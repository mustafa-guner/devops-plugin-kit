import { getClient } from "azure-devops-extension-api";
import { CoreRestClient, TeamContext } from "azure-devops-extension-api/Core";
import { TeamSettingsIteration } from "azure-devops-extension-api/Work";
import { witClient, workClient } from "core/azureClients";
import type { IterationInfoType } from "features/iterations/types/IterationInfoType";

/**
 * Fetches the list of iterations for a specific project and team.
 *
 * Uses the Azure DevOps WorkRestClient to retrieve team iterations and transforms
 * the response into a more convenient format with ISO date strings.
 *
 * @param projectId - The unique identifier of the project
 * @param teamId - The unique identifier of the team
 * @returns A promise resolving to an array of IterationInfo objects
 */
export async function fetchIterations(projectId: string, teamId: string): Promise<IterationInfoType[]> {
    // Fetch TEAM iterations first (fast path)
    let teamIterations: TeamSettingsIteration[] = [];
    try {
        // Resolve the correct team context (ids + names) for Work REST calls.
        const teamContext = await resolveTeamContext(projectId, teamId);
        // Pull team iterations (usually includes dates + paths).
        teamIterations = await workClient().getTeamIterations(teamContext);
    } catch (err) {
        // If team iterations fail, fall back to the classification tree.
        console.warn("Failed to fetch team iterations:", { projectId, teamId, err });
        teamIterations = [];
    }

    // Normalize/shape team iterations into IterationInfoType and keep only dated entries.
    const fromTeam = teamIterations
        .map((iter) => {
            // Read dates from team iteration attributes.
            const startRaw = iter.attributes?.startDate;
            const finishRaw = iter.attributes?.finishDate;
            // Normalize the path for WIQL compatibility.
            const finalPath = normalizeIterationPath(String(iter.path ?? iter.name ?? ""));

            return {
                // Use server id when available; fallback to normalized path for stability.
                id: String(iter.id ?? finalPath) as any,
                iterationId: undefined as any,
                timeFrame: iter.attributes?.timeFrame,
                name: String(iter.name ?? ""),
                path: finalPath,
                // Convert dates to ISO string format.
                startDate: startRaw ? new Date(startRaw).toISOString() : undefined,
                finishDate: finishRaw ? new Date(finishRaw).toISOString() : undefined,
                projectId,
                teamId,
            } as IterationInfoType;
        })
        .filter((iter) => {
            // Skip undated iterations (folders or invalid entries).
            if (!iter.startDate || !iter.finishDate) return false;
            // Ensure dates parse cleanly.
            const s = Date.parse(iter.startDate);
            const f = Date.parse(iter.finishDate);
            return Number.isFinite(s) && Number.isFinite(f);
        });

    // If we got valid iterations from the team API, return them.
    if (fromTeam.length > 0) {
        return dedupeAndSortIterations(fromTeam);
    }

    // Fallback: classification tree (slower, but fills gaps)
    const rootNodes = await witClient().getRootNodes(projectId, 1);
    // Find the "Iteration" root node.
    const iterationRoot = rootNodes.find((n: any) => n.structureType === 1);
    if (!iterationRoot) return [];

    // Fetch the classification nodes (tree of all iterations).
    let topLevelNodes: any[] = [];
    try {
        const fetched = await witClient().getClassificationNodes(projectId, [iterationRoot.id], 100);
        topLevelNodes = Array.isArray(fetched) ? fetched : [];
    } catch {
        const fetched = await witClient().getClassificationNodes(projectId, [iterationRoot.id], 1);
        topLevelNodes = Array.isArray(fetched) ? fetched : [];
    }

    // Walk the tree and collect iteration nodes.
    const iterationNodes: any[] = [];
    const collect = (node: any) => {
        if (!node) return;
        if (node.structureType === 1) iterationNodes.push(node);
        if (Array.isArray(node.children)) {
            for (const c of node.children) collect(c);
        }
    };
    for (const n of topLevelNodes) collect(n);

    if (iterationNodes.length === 0) return [];

    // Map classification nodes into IterationInfoType and keep only dated entries.
    const mapped: IterationInfoType[] = iterationNodes
        .map((node: any) => {
            // Normalize the raw node path for WIQL compatibility.
            const nodePathRaw = String(node.path ?? node.name ?? "");
            const finalPath = normalizeIterationPath(nodePathRaw);
            // Read dates from classification node attributes.
            const startRaw = node.attributes?.startDate;
            const finishRaw = node.attributes?.finishDate;

            return {
                // Prefer node identifier/id; fallback to normalized path.
                id: String(node.identifier ?? node.id ?? finalPath) as any,
                iterationId: node.id,
                timeFrame: undefined,
                name: String(node.name ?? ""),
                path: finalPath,
                // Convert dates to ISO string format.
                startDate: startRaw ? new Date(startRaw).toISOString() : undefined,
                finishDate: finishRaw ? new Date(finishRaw).toISOString() : undefined,
                projectId,
                teamId,
            } as IterationInfoType;
        })
        .filter((iter) => {
            // Skip undated iterations (folders or invalid entries).
            if (!iter.startDate || !iter.finishDate) return false;
            // Ensure dates parse cleanly.
            const s = Date.parse(iter.startDate);
            const f = Date.parse(iter.finishDate);
            return Number.isFinite(s) && Number.isFinite(f);
        });

    // Deduplicate by canonical path and sort by start date.
    return dedupeAndSortIterations(mapped);
}

/**
 * Fetches team iteration metadata for a project/team pair.
 *
 * Uses the Azure DevOps WorkRestClient to retrieve the team's iterations,
 * normalizes paths, and filters out entries without valid dates.
 *
 * @param projectId - The unique identifier of the project
 * @param teamId - The unique identifier of the team
 * @returns A promise resolving to an array of IterationInfo objects
 */
export async function fetchIterationsPerWorkItem(projectId: string, teamId: string): Promise<IterationInfoType[]> {
    const teamContext = await resolveTeamContext(projectId, teamId);
    const teamIterations = await workClient().getTeamIterations(teamContext);

    const teamIterByPath = new Map<string, TeamSettingsIteration>();
    for (const t of teamIterations) {
        if (!t?.path) continue;
        const key = canonicalIterationPath(String(t.path));
        teamIterByPath.set(key, t);
    }

    const mapped: IterationInfoType[] = teamIterations
        .map((node: any) => {
            const nodePathRaw = String(node.path ?? node.name ?? "");
            const lookupKey = canonicalIterationPath(nodePathRaw);
            const teamIteration = teamIterByPath.get(lookupKey);
            const startRaw = teamIteration?.attributes?.startDate ?? node.attributes?.startDate;
            const finishRaw = teamIteration?.attributes?.finishDate ?? node.attributes?.finishDate;
            const finalPath = normalizeIterationPath(String(teamIteration?.path ?? node.path ?? nodePathRaw));

            return {
                id: node.id,
                timeFrame: teamIteration?.attributes?.timeFrame,
                name: node.name,
                path: finalPath,
                startDate: startRaw ? new Date(startRaw).toISOString() : undefined,
                finishDate: finishRaw ? new Date(finishRaw).toISOString() : undefined,
                projectId,
                teamId,
            } as IterationInfoType;
        })
        .filter((iter) => {
            if (!iter.startDate || !iter.finishDate) return false;
            const s = Date.parse(iter.startDate);
            const f = Date.parse(iter.finishDate);
            return Number.isFinite(s) && Number.isFinite(f);
        });
    return mapped;
}

/**
 * Canonicalizes an iteration path for reliable comparisons and deduplication.
 *
 * Normalizes slashes, removes leading separators, and strips the "\Iteration\" segment.
 *
 * @param path - Raw iteration path string
 * @returns Canonicalized iteration path string
 */
export function canonicalIterationPath(path: string): string {
    let p = (path ?? "").trim().toLowerCase();

    // normalize separators
    p = p.replace(/\//g, "\\");

    // collapse multiple backslashes
    p = p.replace(/\\\\+/g, "\\");

    // remove ALL leading backslashes
    p = p.replace(/^\\+/, "");

    // remove ALL trailing backslashes
    p = p.replace(/\\+$/, "");

    // remove the "\iteration\" segment if present (case-insensitive because we lowercased)
    p = p.replace(/\\iteration\\/, "\\");

    return p;
}

/**
 * Compares two iteration paths for equality after canonical normalization.
 *
 * @param a - First iteration path
 * @param b - Second iteration path
 * @returns True if canonicalized paths match; otherwise false.
 */
export function iterationPathsEqual(a?: string | null, b?: string | null): boolean {
    return canonicalIterationPath(a ?? "") === canonicalIterationPath(b ?? "");
}

//#region Private Functions
/**
 * Resolves a TeamContext for Work REST calls by looking up project and team names.
 *
 * Falls back to provided ids if names are unavailable.
 *
 * @param projectId - The unique identifier of the project
 * @param teamId - The unique identifier of the team
 * @returns A promise resolving to a TeamContext object
 */
async function resolveTeamContext(projectId: string, teamId: string): Promise<TeamContext> {
    const core = getClient(CoreRestClient);

    const project = await core.getProject(projectId);
    const team = await core.getTeam(projectId, teamId);

    return {
        projectId: projectId,
        teamId: teamId,
        project: project && project.name ? project.name : projectId,
        team: team && team.name ? team.name : teamId
    };
}

/**
 * Normalizes an iteration path for WIQL compatibility.
 *
 * Collapses duplicate backslashes, removes leading separators,
 * and strips the "\Iteration\" segment.
 *
 * @param path - Raw iteration path string
 * @returns Normalized iteration path string
 */
function normalizeIterationPath(path: string): string {
    let p = (path ?? "").trim();

    // Convert double slashes to single
    p = p.replace(/\\\\+/g, "\\");

    // Remove ALL leading backslashes
    p = p.replace(/^\\+/, "");

    // Some sources include "\Iteration\" explicitly; many queries expect it without that segment.
    // If your WIQL uses [System.IterationPath] = 'Project\...\Sprint', it should NOT contain "\Iteration\".
    p = p.replace(/\\Iteration\\/, "\\");

    return p;
}

/**
 * Deduplicates iterations by canonical path and sorts them by start date (ascending).
 *
 * Uses iteration name as a secondary tie-breaker when dates match.
 *
 * @param items - Array of IterationInfo objects
 * @returns Deduped and sorted array of IterationInfo objects
 */
function dedupeAndSortIterations(items: IterationInfoType[]) {
    const byKey = new Map<string, IterationInfoType>();
    for (const it of items) {
        const key = canonicalIterationPath(String(it.path ?? it.name ?? it.id ?? ""));
        if (!byKey.has(key)) byKey.set(key, it);
    }

    const unique = Array.from(byKey.values());
    unique.sort((a, b) => {
        const aTs = Date.parse(a.startDate ?? "");
        const bTs = Date.parse(b.startDate ?? "");
        if (aTs !== bTs) return aTs - bTs;
        return (a.name ?? "").localeCompare(b.name ?? "");
    });

    return unique;
}
//#endregion

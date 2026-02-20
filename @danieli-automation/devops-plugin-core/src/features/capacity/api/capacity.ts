import { TeamContext } from "azure-devops-extension-api/Core";
import type { TeamCapacity } from "azure-devops-extension-api/Work";
import { WorkItemTypeFieldsExpandLevel } from "azure-devops-extension-api/WorkItemTracking";
import { coreClient, witClient, workClient } from "core/azureClients";

/**
 * Fetches team members with extended identity properties for capacity planning.
 *
 * @param projectId Project identifier.
 * @param teamId Team identifier.
 * @returns Team members mapped to descriptor/display metadata.
 */
export async function fetchTeamMembersForCapacity(
    projectId: string,
    teamId: string
): Promise<
    {
        descriptor: string;
        displayName: string;
        uniqueName?: string;
        imageUrl?: string;
    }[]
> {
    const core = coreClient();
    const members = await core.getTeamMembersWithExtendedProperties(projectId, teamId);

    return members.map((m: any) => ({
        descriptor: m.identity?.descriptor ?? "",
        displayName: m.identity?.displayName ?? "",
        uniqueName: m.identity?.uniqueName,
        imageUrl: m.identity?.imageUrl,
    }));
}

/**
 * Builds `TeamContext` payload required by Work API capacity/iteration endpoints.
 *
 * @param projectId Project identifier.
 * @param teamId Team identifier.
 * @returns Team context with both IDs and resolved names.
 */
async function buildTeamContext(projectId: string, teamId: string): Promise<TeamContext> {
    const core = coreClient();
    const [project, team] = await Promise.all([
        core.getProject(projectId),
        core.getTeam(projectId, teamId),
    ]);
    return {
        projectId,
        teamId,
        project: project?.name ?? projectId,
        team: team?.name ?? teamId,
    };
}

/**
 * Fetches current iteration id for the given project/team pair.
 *
 * @param projectId Project identifier.
 * @param teamId Team identifier.
 * @returns Current iteration id, or `null` when unavailable.
 */
export async function fetchCurrentIterationId(
    projectId: string,
    teamId: string
): Promise<string | null> {
    try {
        const teamContext = await buildTeamContext(projectId, teamId);
        const iterations = await workClient().getTeamIterations(teamContext, "Current");
        const id = iterations?.[0]?.id;
        return id ? String(id) : null;
    } catch {
        return null;
    }
}

/**
 * Fetches team capacities including totals for a specific iteration.
 *
 * @param projectId Project identifier.
 * @param teamId Team identifier.
 * @param iterationId Iteration identifier.
 * @returns Team capacity payload with member totals.
 */
export async function fetchCapacitiesWithTotals(
    projectId: string,
    teamId: string,
    iterationId: string
): Promise<TeamCapacity> {
    const teamContext = await buildTeamContext(projectId, teamId);
    return workClient().getCapacitiesWithIdentityRefAndTotals(teamContext, iterationId);
}

/**
 * Collects distinct activity names currently used in team capacities.
 *
 * @param projectId Project identifier.
 * @param teamId Team identifier.
 * @returns List of unique activity names.
 */
export async function fetchTeamActivityTypes(
    projectId: string,
    teamId: string
): Promise<string[]> {
    const iterationId = await fetchCurrentIterationId(projectId, teamId);
    if (!iterationId) return [];

    try {
        const capacity = await fetchCapacitiesWithTotals(projectId, teamId, iterationId);
        const names = new Set<string>();
        for (const member of capacity.teamMembers ?? []) {
            for (const activity of member.activities ?? []) {
                if (activity.name) names.add(activity.name);
            }
        }
        return Array.from(names);
    } catch {
        return [];
    }
}

/**
 * Fetches allowed values for `Microsoft.VSTS.Common.Activity` on Task work item type.
 *
 * @param projectId Project identifier.
 * @returns Allowed activity field values.
 */
export async function fetchActivityFieldValues(projectId: string): Promise<string[]> {
    try {
        const field = await witClient().getWorkItemTypeFieldWithReferences(
            projectId,
            "Task",
            "Microsoft.VSTS.Common.Activity",
            WorkItemTypeFieldsExpandLevel.AllowedValues
        );
        const { allowedValues } = field as unknown as { allowedValues?: string[] };
        return allowedValues?.filter((v: string) => v) ?? [];
    } catch {
        return [];
    }
}

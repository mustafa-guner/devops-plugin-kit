import { useQuery } from "@tanstack/react-query";
import { CrossSprintInstanceType } from "core/types/instance/CrossSprintInstanceType";
import { fetchIterations } from "features/iterations/api/iterations";
import { IterationService } from "features/iterations/services/IterationService";
import { useIterationStore } from "features/iterations/stores/useIterationStore";
import { IterationInfoType } from "features/iterations/types/IterationInfoType";
import { SelectedProjectType } from "features/teams/types/SelectedProjectType";
import * as React from "react";
import { getIterationsQueryKey } from "src/app/utils/queryKey";

export function useIterationsQuery(projectTeamPairs: SelectedProjectType[], currentInstance: CrossSprintInstanceType | null, myTeams: SelectedProjectType[]) {

    const hasAccess = React.useCallback((projectId: string, teamId: string) => {
        return myTeams.some(p => p.projectId === projectId && p.teams?.some(t => t.id === teamId));
    }, [myTeams]);

    const sourcePairs = React.useMemo(() => {
        const instPairs = currentInstance?.projectTeamPairs ?? [];
        if (instPairs.length > 0) return instPairs;
        return projectTeamPairs ?? [];
    }, [currentInstance?.id, projectTeamPairs]);

    const pairsToFetch = React.useMemo(() => {
        const filtered = (sourcePairs ?? []).filter((p: any) => hasAccess(p.projectId, p.teamId))
            .map((p: any) => ({ projectId: p.projectId, teamId: p.teamId }));
        return uniquePairs(filtered);
    }, [sourcePairs, hasAccess]);

    return useQuery({
        queryKey: getIterationsQueryKey(currentInstance?.id, pairsToFetch),

        enabled: pairsToFetch.length > 0,

        retry: (failureCount, error) => {
            if (isPermission404(error)) return false;
            return failureCount < 2;
        },

        queryFn: async () => {
            const settled = await mapWithConcurrency(pairsToFetch, 4, (p) => fetchIterations(p.projectId, p.teamId));

            const ok = settled.filter(r => r.status === "fulfilled").flatMap(r => (r as PromiseFulfilledResult<any>).value);

            const failed = settled.filter(r => r.status === "rejected") as PromiseRejectedResult[];

            if (failed.length) {
                console.debug("Some iteration fetches failed", failed.map(f => f.reason));
            }

            return ok.sort((a, b) => a.path.localeCompare(b.path));
        },

        onSuccess: (iterations: IterationInfoType[]) => {
            const filteredIterations = IterationService.getIterationsInScope(iterations, pairsToFetch as any);
            useIterationStore.getState().setIterations(filteredIterations);
        },
    });
}

//#region Private Helpers
function uniquePairs(pairs: Array<{ projectId: string; teamId: string }>) {
    const seen = new Set<string>();
    return pairs.filter(p => {
        const k = `${p.projectId}:${p.teamId}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });
}

function isPermission404(err: any) {
    const status =
        err?.status ??
        err?.response?.status ??
        err?.serverError?.statusCode ??
        err?.message?.match(/\b(401|403|404)\b/)?.[1];

    return Number(status) === 401 || Number(status) === 403 || Number(status) === 404;
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<PromiseSettledResult<R>[]> {
    const results: PromiseSettledResult<R>[] = new Array(items.length);
    let index = 0;

    async function runWorker() {
        while (index < items.length) {
            const current = index++;
            try {
                const value = await worker(items[current]);
                results[current] = { status: "fulfilled", value } as PromiseFulfilledResult<R>;
            } catch (reason) {
                results[current] = { status: "rejected", reason } as PromiseRejectedResult;
            }
        }
    }

    const workers = Array.from({ length: Math.min(limit, items.length) }, () => runWorker());
    await Promise.all(workers);
    return results;
}
//#endregion

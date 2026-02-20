import { witClient } from "core/azureClients";
import { AreaGroup } from "features/teams/services/ProjectService";
import { wiqlForMultipleIterations, wiqlForParentWorkItems, wiqlForSingleIteration } from "features/work-items/api/wiql";
import { fetchWorkItemsByIds } from "features/work-items/api/workItems";
import { AdoWorkItemType } from "features/work-items/types/AdoWorkItemType";

export const WIQLService = {

    /**
     * Fetches parent work items (PBIs and Bugs) for the given child work item IDs across projects.
     * 
     * @param workItemIds 
     * @param projectId 
     * @returns Promise resolving to an array of parent work items
     * 
     */
    getParentWorkItemsForPbisAndBugs: async (workItemIds: number[], projectId?: string): Promise<AdoWorkItemType[]> => {

        const wiql = wiqlForParentWorkItems(workItemIds);
        if (!wiql) return [];

        const wit = witClient();
        const res = await wit.queryByWiql({ query: wiql }, undefined, projectId ?? "");

        const parentIds = new Set<number>();
        const relations = res.workItemRelations || [];

        for (const rel of relations) {
            if (rel.source?.id) parentIds.add(rel.source.id);
        }

        if (parentIds.size === 0) return [];
        const parentIdArray = Array.from(parentIds);
        return fetchWorkItemsByIds(parentIdArray, projectId ?? "");
    },

    /**
     * @description: Fetches Task IDs that belong to the selected iteration, per project area groups.
     * @param areaGroups Project+area scoping.
     * @param iterationPath Selected iteration path.
     * @returns Promise resolving to a unique list of task IDs.
     */
    getTaskIdsForSelectedIteration: async (areaGroups: AreaGroup[], iterationPaths: string[]): Promise<number[]> => {
        const out = new Set<number>();
        const wit = witClient();

        const results = await Promise.all(
            areaGroups.map(async (g) => {
                if (!g.areaPaths?.length) return [];

                const { tasksQuery } = iterationPaths.length > 1
                    ? wiqlForMultipleIterations(iterationPaths, g.areaPaths)
                    : wiqlForSingleIteration(iterationPaths[0], g.areaPaths);
                const res = await wit.queryByWiql({ query: tasksQuery }, undefined, g.projectId ?? "");
                return (res.workItems ?? []).map(w => w.id).filter(Boolean) as number[];
            })
        );

        for (const ids of results) {
            for (const id of ids) out.add(id);
        }

        return Array.from(out);
    },

    /**
     * @description: Fetches parent work item IDs (PBIs/Bugs) that belong to the selected iteration,
     *               scoped by project area groups.
     * @param areaGroups Project+area scoping.
     * @param iterationPath Selected iteration path.
     * @returns Promise resolving to a unique list of parent work item IDs.
     */
    getParentIdsForSelectedIteration: async (areaGroups: AreaGroup[], iterationPaths: string[]): Promise<number[]> => {
        const out = new Set<number>();
        const wit = witClient();

        const results = await Promise.all(
            areaGroups.map(async (g) => {
                if (!g.areaPaths?.length) return [];

                const { parentsQuery } = iterationPaths.length > 1
                    ? wiqlForMultipleIterations(iterationPaths, g.areaPaths)
                    : wiqlForSingleIteration(iterationPaths[0], g.areaPaths);
                const res = await wit.queryByWiql({ query: parentsQuery }, undefined, g.projectId ?? "");
                return (res.workItems ?? []).map(w => w.id).filter(Boolean) as number[];
            })
        );

        for (const ids of results) {
            for (const id of ids) out.add(id);
        }

        return Array.from(out);
    }
};







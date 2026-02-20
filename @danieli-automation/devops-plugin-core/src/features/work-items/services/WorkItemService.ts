import { WorkItemExpand } from "azure-devops-extension-api/WorkItemTracking";
import { fetchWorkItemById } from "features/work-items/api/workItems";
import FieldConstant from "features/work-items/constants/FieldConstant";

export const WorkItemService = {

    /**
     * Fetches a single work item including its relations (parent/child links, etc.).
     * Used for traversing work item hierarchy via "System.LinkTypes.Hierarchy-Forward".
     *
     * @param id - Work item ID
     * @param projectId - Project name or ID used by the client
     * @returns Promise resolving to the work item including `relations`
     */
    collectDescendantWorkItemIds: async (rootId: number, project: string): Promise<number[]> => {
        const visited = new Set<number>();
        const result: number[] = [];

        const stack: number[] = [rootId];

        while (stack.length > 0) {
            const id = stack.pop()!;
            if (visited.has(id)) continue;
            visited.add(id);

            const wi = await fetchWorkItemById(id, project, [FieldConstant.WORK_ITEM_FIELD_ID]);
            const relations = wi?.relations ?? [];

            for (const r of relations) {
                if (r.rel !== "System.LinkTypes.Hierarchy-Forward") continue;
                const match = r.url?.match(/(\d+)$/);
                if (!match) continue;
                const childId = Number(match[1]);
                if (!Number.isFinite(childId) || visited.has(childId)) continue;

                result.push(childId);
                stack.push(childId);
            }
        }
        return result;
    },

    /**
     * Fetches a single work item including its relations (parent/child links, etc.).
     *
     * @param id - Work item ID
     * @param projectId - Project name or ID used by the client
     * @returns Promise resolving to the work item including `relations`
     */
    getWorkItemById: async (workItemId: number, project?: string, fields?: string[], expand?: WorkItemExpand) => {
        const workItem = await fetchWorkItemById(workItemId, project, fields, expand);
        return workItem;
    }
}

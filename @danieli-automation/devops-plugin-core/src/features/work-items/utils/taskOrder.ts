import FieldConstant from "features/work-items/constants/FieldConstant";
import { AdoWorkItemType } from "features/work-items/types/AdoWorkItemType";

/**
 * Builds a stable key used for task ordering under a specific parent.
 *
 * @param parentId Parent work item id.
 * @param taskId Task work item id.
 * @returns Composite key in `parentId:taskId` format.
 */
export function getTaskOrderKey(parentId: number, taskId: number): string {
    return `${parentId}:${taskId}`;
}

/**
 * Resolves parent id for a task from `System.Parent` or reverse hierarchy relation.
 *
 * @param task Task work item.
 * @returns Parent work item id, or `null` when no parent could be resolved.
 */
export function getParentIdFromTask(task: AdoWorkItemType): number | null {
    const viaField = task.fields?.[FieldConstant.WORK_ITEM_FIELD_PARENT];
    if (typeof viaField === "number") return viaField;

    for (const rel of task.relations ?? []) {
        if (rel.rel !== "System.LinkTypes.Hierarchy-Reverse") continue;
        const match = String(rel.url ?? "").match(/(\d+)$/);
        if (!match) continue;
        const pid = Number(match[1]);
        if (!Number.isNaN(pid)) return pid;
    }

    return null;
}

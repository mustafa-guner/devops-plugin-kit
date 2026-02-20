import { WorkItemOrderMapType } from "core/types/workItemOrder/WorkItemOrderMapType";
import { WorkItemOrderType } from "core/types/workItemOrder/WorkItemOrderType";
import { STORAGE_KEYS } from "../keys";
import { workItemOrderStore } from "../stores";

/**
 * Save backlog order for a given instance or personal board.
 *
 * Persists work item ordering under an instance-specific key.
 * Falls back to the personal board key when no instance id is provided.
 * Includes backward compatibility for the legacy array-based schema.
 *
 * @param instanceId Instance id or null for personal board.
 * @param rows Ordered work items to persist.
 */
export async function saveWorkItemOrder(instanceId: string | null | undefined, rows: WorkItemOrderType[]): Promise<void> {
    // Fallback key for personal board
    const key = instanceId ?? STORAGE_KEYS.personalOrder;

    const stored = await workItemOrderStore.load();

    // Backward-compat: old schema = plain array
    if (Array.isArray(stored)) {
        const map: WorkItemOrderMapType = { [key]: rows };
        await workItemOrderStore.save(map);
        return;
    }

    const current: WorkItemOrderMapType = stored ?? {};
    const next: WorkItemOrderMapType = {
        ...current,
        [key]: rows,
    };

    await workItemOrderStore.save(next);
}

/**
 * Load backlog order for a given instance or personal board.
 *
 * Resolves work item ordering using an instance-specific key.
 * Falls back to the personal board key when no instance id is provided.
 * Includes backward compatibility for the legacy array-based schema.
 *
 * @param instanceId Instance id or null for personal board.
 * @returns Ordered work items array.
 */
export async function loadWorkItemOrder(instanceId: string | null | undefined): Promise<WorkItemOrderType[]> {
    const key = instanceId ?? STORAGE_KEYS.personalOrder;

    const stored = await workItemOrderStore.load();

    // Backward-compat: old schema = plain array → treat as personal
    if (Array.isArray(stored)) {
        return stored;
    }

    if (!stored) return [];
    return stored[key] ?? [];
}
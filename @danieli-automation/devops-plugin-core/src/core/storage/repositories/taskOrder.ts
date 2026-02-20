import { TaskOrderMapType } from "core/types/taskOrder/TaskOrderMapType";
import { TaskOrderType } from "core/types/taskOrder/TaskOrderType";
import { STORAGE_KEYS } from "../keys";
import { taskOrderStore } from "../stores";

/**
 * Save task order for a given instance or personal board.
 *
 * Persists task ordering under an instance-specific key.
 * Falls back to the personal board key when no instance id is provided.
 * Includes backward compatibility for the legacy array-based schema.
 *
 * @param instanceId Instance id or null for personal board.
 * @param rows Ordered tasks to persist.
 */
export async function saveTaskOrder(instanceId: string | null | undefined, rows: TaskOrderType[]): Promise<void> {
    const key = instanceId ?? STORAGE_KEYS.personalTaskOrder;

    const stored = await taskOrderStore.load();

    // Backward-compat: old schema = plain array
    if (Array.isArray(stored)) {
        const map: TaskOrderMapType = { [key]: rows };
        await taskOrderStore.save(map);
        return;
    }

    const current: TaskOrderMapType = stored ?? {};
    const next: TaskOrderMapType = {
        ...current,
        [key]: rows,
    };

    await taskOrderStore.save(next);
}

/**
 * Load task order for a given instance or personal board.
 *
 * Resolves task ordering using an instance-specific key.
 * Falls back to the personal board key when no instance id is provided.
 * Includes backward compatibility for the legacy array-based schema.
 *
 * @param instanceId Instance id or null for personal board.
 * @returns Ordered tasks array.
 */
export async function loadTaskOrder(instanceId: string | null | undefined): Promise<TaskOrderType[]> {
    const key = instanceId ?? STORAGE_KEYS.personalTaskOrder;

    const stored = await taskOrderStore.load();

    // Backward-compat: old schema = plain array -> treat as personal
    if (Array.isArray(stored)) {
        return stored as TaskOrderType[];
    }

    if (!stored) return [];
    return stored[key] ?? [];
}

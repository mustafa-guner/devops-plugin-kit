/**
 * @description: Task order storage hooks using React Query.
 * Provides hooks for querying and mutating task order preferences.
 * Utilizes zustand stores for persistent storage and caching.
 * Ensures data consistency by updating the query cache on successful mutations.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TaskOrderType } from "core/types/taskOrder/TaskOrderType";
import { AdoWorkItemType } from "core/types/AdoWorkItemType";
import { QUERY_KEYS, STORAGE_KEYS } from "../keys";
import { loadTaskOrder, saveTaskOrder } from "../repositories/taskOrder";

/**
 * Load task ordering preference for a given instance.
 *
 * @param instanceId The instance id to scope the task order to.
 * @returns React Query result containing the task order.
 */
export function useTaskOrderQuery(instanceId: string | null | undefined) {
    const isSharedInstance = !!instanceId;

    return useQuery({
        queryKey: [QUERY_KEYS.prefs, QUERY_KEYS.taskOrder, instanceId],
        enabled: isSharedInstance,
        queryFn: () => loadTaskOrder(instanceId),
        staleTime: Infinity,
        cacheTime: 1,
        keepPreviousData: false,
        // Keep shared-instance task order in sync across owners/viewers.
        refetchInterval: isSharedInstance ? 5000 : false,
        refetchOnWindowFocus: isSharedInstance,
        refetchOnReconnect: isSharedInstance,
    });
}

/**
 * Save task ordering preference
 *
 * Persists task order rows for the given instance (or personal scope),
 * and updates the query cache on success.
 *
 * @param instanceId The instance id or null for personal order.
 * @returns React Query mutation for saving task order.
 */
export function useSaveTaskOrder(instanceId: string | null | undefined) {
    const qc = useQueryClient();
    const effectiveId = instanceId ?? STORAGE_KEYS.personalTaskOrder;
    return useMutation({
        mutationFn: (rows: TaskOrderType[]) => saveTaskOrder(effectiveId, rows),
        onSuccess: (_, rows) => {
            qc.setQueryData([QUERY_KEYS.prefs, QUERY_KEYS.taskOrder, effectiveId], rows);
        },
    });
}

export function buildNormalizedTaskOrder(tasksInCurrentOrder: AdoWorkItemType[], stored: TaskOrderType[]): TaskOrderType[] {
    if (!tasksInCurrentOrder.length) return [];

    const byParent = new Map<number, AdoWorkItemType[]>();
    for (const t of tasksInCurrentOrder) {
        if (typeof t.id !== "number") continue;
        const pid = getParentIdFromTask(t);
        if (pid == null || Number.isNaN(pid)) continue;
        const arr = byParent.get(pid) ?? [];
        arr.push(t);
        byParent.set(pid, arr);
    }

    const storedByParent = new Map<number, TaskOrderType[]>();
    for (const r of stored ?? []) {
        const arr = storedByParent.get(r.parentId) ?? [];
        arr.push(r);
        storedByParent.set(r.parentId, arr);
    }

    const normalized: TaskOrderType[] = [];

    Array.from(byParent.entries()).forEach(([parentId, tasks]) => {
        const storedRows = storedByParent.get(parentId) ?? [];
        const byId = new Map(storedRows.map(r => [r.id, r.order]));

        const looksIdBasedOrMissing =
            storedRows.length > 0 &&
            storedRows.every(r => !r.order || r.order === r.id);

        let ordered = tasks.map((t) => ({
            id: t.id as number,
            order: byId.get(t.id as number) ?? Number.MAX_SAFE_INTEGER,
        }));

        if (looksIdBasedOrMissing || storedRows.length === 0) {
            ordered = tasks.map((t, idx) => ({ id: t.id as number, order: idx + 1 }));
        } else {
            ordered.sort((a, b) => a.order - b.order || a.id - b.id);
            ordered = ordered.map((r, idx) => ({ id: r.id, order: idx + 1 }));
        }

        ordered.forEach((r) => {
            normalized.push({
                id: r.id,
                parentId,
                order: r.order,
            });
        });
    });

    return normalized;
}

function getParentIdFromTask(task: AdoWorkItemType): number | null {
    if (typeof task.parentWorkItem?.id === "number") {
        return task.parentWorkItem.id;
    }

    const parentRel = task.relations?.find((rel) => rel?.rel === "System.LinkTypes.Hierarchy-Reverse");
    if (!parentRel?.url) {
        return null;
    }

    const segments = parentRel.url.split("/");
    const idRaw = segments[segments.length - 1];
    const id = Number(idRaw);
    return Number.isFinite(id) ? id : null;
}

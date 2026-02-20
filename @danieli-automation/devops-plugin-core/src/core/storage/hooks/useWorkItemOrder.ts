/**
 * @description: Column Preference storage hooks using React Query.
 * Provides hooks for querying and mutating
 * Utilizes zustand stores for persistent storage and caching.
 * Ensures data consistency by updating the query cache on successful mutations.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { WorkItemOrderType } from "core/types/workItemOrder/WorkItemOrderType";
import { QUERY_KEYS, STORAGE_KEYS } from "../keys";
import { loadWorkItemOrder, saveWorkItemOrder } from "../repositories/workItemOrder";

/** Global (unscoped) hooks
 *
 * Load work item ordering preference for a given instance.
 *
 * @param instanceId The instance id to scope the backlog order to.
 * @returns React Query result containing the backlog order.
 */
export function useWorkItemOrderQuery(instanceId: string | null | undefined) {
    const isSharedInstance = !!instanceId;

    return useQuery({
        queryKey: [QUERY_KEYS.prefs, QUERY_KEYS.backlogOrder, instanceId],
        enabled: isSharedInstance,
        queryFn: () => loadWorkItemOrder(instanceId),
        staleTime: Infinity,
        cacheTime: 1,
        keepPreviousData: false,
        // Keep shared-instance work item order in sync across owners/viewers.
        refetchInterval: isSharedInstance ? 5000 : false,
        refetchOnWindowFocus: isSharedInstance,
        refetchOnReconnect: isSharedInstance,
    });
}

/** Save work item ordering preference
 *
 * Persists work item order rows for the given instance (or personal scope),
 * and updates the query cache on success.
 *
 * @param instanceId The instance id or null for personal order.
 * @returns React Query mutation for saving backlog order.
 */
export function useSaveWorkItemOrder(instanceId: string | null | undefined) {
    const qc = useQueryClient();
    const effectiveId = instanceId ?? STORAGE_KEYS.personalOrder;
    return useMutation({
        mutationFn: (rows: WorkItemOrderType[]) => saveWorkItemOrder(effectiveId, rows),
        onSuccess: (_, rows) => {
            qc.setQueryData([QUERY_KEYS.prefs, QUERY_KEYS.backlogOrder, effectiveId], rows);
        },
    });
}

export function buildNormalizedOrder(itemsInCurrentOrder: { id: number }[], stored: WorkItemOrderType[]): WorkItemOrderType[] {
    if (!itemsInCurrentOrder.length) return [];

    if (!stored || stored.length === 0) {
        // no stored order -> just 1..N
        return itemsInCurrentOrder.map((wi, idx) => ({ id: wi.id, order: idx + 1 }));
    }

    // index by id for fast lookup
    const byId = new Map(stored.map(r => [r.id, r.order]));

    // detect if everything looks like "ID as order" or invalid (0/undefined)
    const looksIdBasedOrMissing = stored.length > 0 && stored.every(r =>
        !r.order || r.order === r.id
    );

    if (looksIdBasedOrMissing) {
        // treat as no real order -> regenerate 1..N from current order
        return itemsInCurrentOrder.map((wi, idx) => ({ id: wi.id, order: idx + 1 }));
    }

    // we have at least one “real” order – use it, but normalize and ensure 1..N
    const existingForCurrent = itemsInCurrentOrder
        .map(wi => ({
            id: wi.id,
            order: byId.get(wi.id) ?? Number.MAX_SAFE_INTEGER, // unseen ids go to the end
        }))
        .sort((a, b) => a.order - b.order || a.id - b.id) // stable-ish fallback

    return existingForCurrent.map((r, idx) => ({ id: r.id, order: idx + 1 }));
}

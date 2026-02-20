import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateWorkItem } from "features/work-items/api/workItems";
import { useWorkItemStore } from "features/work-items/stores/useWorkItemStore";
import { AdoWorkItemType } from "features/work-items/types/AdoWorkItemType";

type Props = {
    workItemId: number;
    queryKeys: readonly (readonly unknown[])[];
    project: string;
    fieldUpdates: Record<string, any>;
    optimisticFieldUpdates?: Record<string, any>;
    storeKeys?: string[];
    storeIteration?: any;
    operation?: "remove" | "replace" | "add";
};

export function useUpdateWorkItemData() {
    const qc = useQueryClient();

    const setWorkItemError = useWorkItemStore((w) => w.setWorkItemError);
    const clearWorkItemError = useWorkItemStore((w) => w.clearWorkItemError);
    const setWorkItems = useWorkItemStore((w) => w.setWorkItems);

    return useMutation({
        mutationFn: ({ workItemId, project, fieldUpdates, operation }: Props) => {

            const changes = Object.entries(fieldUpdates).map(([fieldRef, value]) => {
                const isRemove = operation === "remove" && (value === null || value === "" || value === undefined);

                if (isRemove) {
                    return { op: "remove", path: `/fields/${fieldRef}` };
                }

                return { op: operation ?? "replace", path: `/fields/${fieldRef}`, value };
            });

            return updateWorkItem(workItemId, changes, project);
        },

        onMutate: async ({ workItemId, queryKeys, fieldUpdates, optimisticFieldUpdates, storeKeys, storeIteration }: Props) => {
            clearWorkItemError(workItemId);
            const optimistic = optimisticFieldUpdates ?? fieldUpdates;

            const patchItem = (wi: AdoWorkItemType) => {
                // If this is the target item, merge optimistic fields directly.
                if (wi.id === workItemId) {
                    return { ...wi, fields: { ...(wi.fields ?? {}), ...optimistic } };
                }

                // If the item has children, patch the matching child to keep parent views in sync.
                if (Array.isArray((wi as any)._children) && (wi as any)._children.length > 0) {
                    const nextChildren = (wi as any)._children.map((c: AdoWorkItemType) =>
                        c.id === workItemId ? { ...c, fields: { ...(c.fields ?? {}), ...optimistic } } : c
                    );
                    return { ...wi, _children: nextChildren } as AdoWorkItemType;
                }
                // Otherwise, leave the item unchanged.
                return wi;
            };

            // ----- React Query optimistic updates (ALL keys)
            const prevQueries: Record<string, AdoWorkItemType[] | undefined> = {};

            for (const key of queryKeys) {
                await qc.cancelQueries({ queryKey: key });
                const prev = qc.getQueryData<AdoWorkItemType[]>(key);
                prevQueries[JSON.stringify(key)] = prev;

                if (prev?.length) {
                    qc.setQueryData<AdoWorkItemType[]>(
                        key,
                        prev.map(patchItem)
                    );
                }
            }

            // --- Zustand optimistic update + snapshot for rollback
            const prevStores: Record<string, AdoWorkItemType[] | undefined> = {};

            if (storeKeys?.length) {
                const storeState: any = useWorkItemStore.getState();

                for (const sk of storeKeys) {
                    const prevStore = (storeState?.[sk] ?? []) as AdoWorkItemType[];
                    prevStores[sk] = prevStore;

                    const nextStore = prevStore.map(patchItem);

                    setWorkItems(sk as any, nextStore, storeIteration);
                }
            }

            return { prevQueries, prevStores };
        },

        onSuccess: (_data, vars: Props) => clearWorkItemError(vars.workItemId),

        onError: (err: any, vars, ctx) => {
            setWorkItemError(vars.workItemId, err?.message ?? "Failed");

            // rollback query caches
            for (const key of vars.queryKeys) {
                const k = JSON.stringify(key);
                const prev = ctx?.prevQueries?.[k];
                if (prev) qc.setQueryData(key, prev);
            }

            // rollback store slices
            if (vars.storeKeys?.length) {
                for (const sk of vars.storeKeys) {
                    const prev = ctx?.prevStores?.[sk];
                    if (prev) setWorkItems(sk as any, prev, vars.storeIteration);
                }
            }
        },

        //onSettled invalidate all query keys
        onSettled: (_d, _e, vars) => {
            for (const key of vars.queryKeys) {
                qc.invalidateQueries({ queryKey: key });
            }
        },

    });
}

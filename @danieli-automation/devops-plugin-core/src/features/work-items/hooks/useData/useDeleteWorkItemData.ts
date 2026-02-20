import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteWorkItem } from "features/work-items/api/workItems";
import { useWorkItemStore } from "features/work-items/stores/useWorkItemStore";
import { AdoWorkItemType } from "features/work-items/types/AdoWorkItemType";

type Props = {
    workItemId: number;
    project: string;
    childrenKey: readonly unknown[];
    storeKey?: string;
    storeIteration?: any;
};

export function useDeleteWorkItemData() {
    const qc = useQueryClient();

    const setWorkItemError = useWorkItemStore((w) => w.setWorkItemError);
    const clearWorkItemError = useWorkItemStore((w) => w.clearWorkItemError);
    const setWorkItems = useWorkItemStore((w) => w.setWorkItems);

    return useMutation({
        mutationFn: ({ workItemId, project }: Props) => {
            return deleteWorkItem(workItemId, project);
        },

        onMutate: async ({ workItemId, childrenKey, storeKey, storeIteration }: Props) => {
            clearWorkItemError(workItemId);

            // --- React Query optimistic update + snapshot for rollback
            await qc.cancelQueries({ queryKey: childrenKey });
            const prevQuery = qc.getQueryData<AdoWorkItemType[]>(childrenKey);

            if (prevQuery?.length) {
                qc.setQueryData<AdoWorkItemType[]>(
                    childrenKey,
                    prevQuery.filter((t) => t.id !== workItemId)
                );
            }

            // --- Zustand optimistic update + snapshot for rollback
            let prevStore: AdoWorkItemType[] | undefined;

            if (storeKey) {
                const storeState: any = useWorkItemStore.getState();
                prevStore = (storeState?.[storeKey] ?? []) as AdoWorkItemType[];

                const nextStore = (prevStore ?? []).filter((wi: AdoWorkItemType) => wi.id !== workItemId);
                setWorkItems(storeKey as any, nextStore, storeIteration);
            }

            return { prevQuery, prevStore };
        },

        onSuccess: (_data, vars: Props) => clearWorkItemError(vars.workItemId),

        onError: (err: any, vars: Props, ctx: any) => {
            const msg = err?.message ?? err?.serverError?.message ?? err?.response?.message ?? "Failed to delete work item.";
            setWorkItemError(vars.workItemId, msg);

            // rollback query cache
            if (ctx?.prevQuery) {
                qc.setQueryData(vars.childrenKey, ctx.prevQuery);
            }

            // rollback zustand store slice
            if (vars.storeKey && ctx?.prevStore) {
                setWorkItems(vars.storeKey as any, ctx.prevStore, vars.storeIteration);
            }
        },

        onSettled: (_data, _err, vars: Props) => {
            qc.invalidateQueries({ queryKey: vars.childrenKey });
        },
    });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateWorkItem } from "features/work-items/api/workItems";
import FieldConstant from "features/work-items/constants/FieldConstant";
import StateConstant from "features/work-items/constants/StateConstant";
import { WorkItemService } from "features/work-items/services/WorkItemService";
import { useWorkItemStore } from "features/work-items/stores/useWorkItemStore";
import { AdoWorkItemType } from "features/work-items/types/AdoWorkItemType";

export type Props = {
    parentId: number;
    project: string;
    childrenKey: readonly unknown[];
    children?: AdoWorkItemType[];
    childIds?: number[];
    cancelParent?: boolean;
    includeDescendants?: boolean;
    storeKey?: string;
    storeIteration?: any;
    cancelState?: string;
};

const DEFAULT_CANCEL_STATE = StateConstant.REMOVED_STATE;

export function useDeleteWorkItemDataWithChildren() {
    const qc = useQueryClient();

    const setWorkItemError = useWorkItemStore((w) => w.setWorkItemError);
    const clearWorkItemError = useWorkItemStore((w) => w.clearWorkItemError);
    const setWorkItems = useWorkItemStore((w) => w.setWorkItems);

    return useMutation({
        mutationFn: async (vars: Props) => {
            const cancelState = vars.cancelState ?? DEFAULT_CANCEL_STATE;
            const idsToCancel = await computeIdsToCancel(vars);

            if (!idsToCancel.length) return { canceled: 0 };

            await Promise.all(
                idsToCancel.map((id) =>
                    updateWorkItem(
                        id,
                        [
                            {
                                op: "replace",
                                path: `/fields/${FieldConstant.WORK_ITEM_FIELD_STATE}`,
                                value: cancelState,
                            },
                        ],
                        vars.project
                    )
                )
            );

            return { canceled: idsToCancel.length };
        },

        onMutate: async (vars) => {
            clearWorkItemError(vars.parentId);

            const idsToCancel = await computeIdsToCancel(vars);

            await qc.cancelQueries({ queryKey: vars.childrenKey });
            const prevQuery = qc.getQueryData<AdoWorkItemType[]>(vars.childrenKey);

            let prevStore: AdoWorkItemType[] | undefined;
            if (vars.storeKey) {
                const storeState: any = useWorkItemStore.getState();
                prevStore = storeState?.[vars.storeKey] as AdoWorkItemType[];
            }

            const cancelState = vars.cancelState ?? DEFAULT_CANCEL_STATE;

            const applyCancel = (list: AdoWorkItemType[]) =>
                list.map((wi) =>
                    idsToCancel.includes(wi.id!)
                        ? {
                            ...wi,
                            fields: {
                                ...(wi.fields ?? {}),
                                [FieldConstant.WORK_ITEM_FIELD_STATE]: cancelState,
                            },
                        }
                        : wi
                );

            if (prevQuery?.length && idsToCancel.length) {
                qc.setQueryData(vars.childrenKey, applyCancel(prevQuery));
            }

            if (vars.storeKey && prevStore && idsToCancel.length) {
                setWorkItems(vars.storeKey as any, applyCancel(prevStore), vars.storeIteration);
            }

            return { prevQuery, prevStore };
        },

        onSuccess: (_data, vars) => clearWorkItemError(vars.parentId),

        onError: (err: any, vars, ctx: any) => {
            setWorkItemError(vars.parentId, err?.message ?? err?.serverError?.message ?? err?.response?.message ?? "Failed to cancel work items.");

            if (ctx?.prevQuery) qc.setQueryData(vars.childrenKey, ctx.prevQuery);

            if (vars.storeKey && ctx?.prevStore) {
                setWorkItems(vars.storeKey as any, ctx.prevStore, vars.storeIteration);
            }
        },

        onSettled: (_data, _err, vars) => {
            qc.invalidateQueries({ queryKey: vars.childrenKey });
        },
    });
}

//#region 
// helper to compute ids once (and reuse)
async function computeIdsToCancel(vars: Props): Promise<number[]> {
    let childIds: number[] = [];

    if (vars.includeDescendants) {
        childIds = await WorkItemService.collectDescendantWorkItemIds(vars.parentId, vars.project);
    } else if (vars.childIds) {
        childIds = vars.childIds;
    } else if (vars.children?.length) {
        childIds = vars.children.map((c) => c.id).filter((id): id is number => typeof id === "number" && Number.isFinite(id));
    }

    const idsToCancel = vars.cancelParent ? [vars.parentId, ...childIds] : childIds;
    return Array.from(new Set(idsToCancel.filter((id) => typeof id === "number" && Number.isFinite(id))));
};
//#endregion

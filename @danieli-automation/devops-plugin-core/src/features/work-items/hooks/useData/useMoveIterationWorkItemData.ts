import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateWorkItem } from "features/work-items/api/workItems";
import FieldConstant from "features/work-items/constants/FieldConstant";
import { useWorkItemStore } from "features/work-items/stores/useWorkItemStore";
import QueryKeyConstant from "src/app/constants/QueryKeyConstant";
import { WorkItemStoreKeyConstant } from "src/app/constants/StoreKeyConstant";

type Props = {
    workItemId: number;
    project: string;
    parentId?: number;
    newIterationPath: string;
    queryKeys?: readonly (readonly unknown[])[];
};

export function useMoveIterationWorkItemData() {
    const qc = useQueryClient();
    const setWorkItemError = useWorkItemStore(w => w.setWorkItemError);
    const clearWorkItemError = useWorkItemStore(w => w.clearWorkItemError);
    const setWorkItems = useWorkItemStore(w => w.setWorkItems);

    return useMutation({
        mutationFn: async ({ workItemId, project, newIterationPath }: Props) => {
            return updateWorkItem(
                workItemId,
                [{ op: "replace", path: `/fields/${FieldConstant.WORK_ITEM_FIELD_ITERATION_PATH}`, value: newIterationPath }],
                project
            );
        },

        onMutate: async ({ workItemId, newIterationPath }) => {
            clearWorkItemError(workItemId);

            const patchItem = (wi: any) => {
                if (wi.id === workItemId) {
                    return {
                        ...wi,
                        fields: {
                            ...(wi.fields ?? {}),
                            [FieldConstant.WORK_ITEM_FIELD_ITERATION_PATH]: newIterationPath,
                        },
                    };
                }
                if (Array.isArray(wi._children) && wi._children.length > 0) {
                    const nextChildren = wi._children.map((c: any) =>
                        c.id === workItemId
                            ? {
                                ...c,
                                fields: {
                                    ...(c.fields ?? {}),
                                    [FieldConstant.WORK_ITEM_FIELD_ITERATION_PATH]: newIterationPath,
                                },
                            }
                            : c
                    );
                    return { ...wi, _children: nextChildren };
                }
                return wi;
            };

            const storeState: any = useWorkItemStore.getState();
            const prevStore = (storeState?.[WorkItemStoreKeyConstant.workItems] ?? []) as any[];
            if (prevStore.length) {
                const nextStore = prevStore.map(patchItem);
                setWorkItems(WorkItemStoreKeyConstant.workItems as any, nextStore, undefined);
            }
        },

        onError: (err: any, vars) => {
            setWorkItemError(vars.workItemId, err?.message ?? "Failed");
        },

        onSettled: (_d, _e, vars) => {
            for (const key of vars.queryKeys ?? []) {
                qc.invalidateQueries({ queryKey: key });
            }

            qc.invalidateQueries({
                queryKey: [QueryKeyConstant.WORK_ITEMS_QUERY_KEY],
                exact: false,
            });

            if (vars.parentId) {
                qc.invalidateQueries({
                    queryKey: [QueryKeyConstant.CHILDREN_QUERY_KEY, vars.project, vars.parentId],
                    exact: false,
                });
            }
        },
    });
}

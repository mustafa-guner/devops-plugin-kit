import { IterationInfoType } from "features/iterations/types/IterationInfoType";
import FieldConstant from "features/work-items/constants/FieldConstant";
import { WorkItemSetFields, WorkItemStoreType } from "features/work-items/stores/types/WorkItemStoreType";
import { AdoWorkItemType } from "features/work-items/types/AdoWorkItemType";
import { filterPbisAndBugs, filterTasks } from "features/work-items/utils/filter";
import { WorkItemStoreKeyConstant } from "src/app/constants/StoreKeyConstant";
import { toUtcDateOnly } from "src/app/utils/date";
import { create } from "zustand";

export const useWorkItemStore = create<WorkItemStoreType>((set, get) => ({
    workItems: [],
    parentWorkItems: [],
    topLevelParentWorkItems: [],
    childrenWorkItems: [],
    isLoading: false,
    workItemErrors: {} as Record<number, string | null>,
    selectedWorkItem: null,

    setWorkItems: <K extends WorkItemSetFields>(key: K, v: WorkItemStoreType[K], selectedIteration?: IterationInfoType) =>
        set(() => {
            // When setting workItems, we need to derive other lists as well
            if (key === WorkItemStoreKeyConstant.workItems) {
                return derive(v as AdoWorkItemType[], selectedIteration);
            }
            return { [key]: v } as Pick<WorkItemStoreType, K>;
        }),

    setTopLevelParentWorkItems: (topLevelParentWorkItems: any[] | []) => set({ topLevelParentWorkItems }),

    setWorkItemError: (id: number, error: string | null) =>
        set((state) => ({
            workItemErrors: {
                ...state.workItemErrors,
                [id]: error,
            },
        })),

    clearWorkItemError: (id: number) =>
        set((state) => {
            const { [id]: _removed, ...rest } = state.workItemErrors;
            return { workItemErrors: rest };
        }),

    setSelectedWorkItem: (item, options) =>
        set((state) => {
            const isSame = state.selectedWorkItem?.id === item?.id;

            // Right-click: NEVER toggle off
            if (options?.source === "context") {
                return { selectedWorkItem: item };
            }

            // Left-click: toggle
            return {
                selectedWorkItem: isSame ? null : item,
            };
        }),

    setIsLoading: (isLoading) => set({ isLoading }),

    //setters only
    removeDraftsFromWorkItems: () => {
        const next = get().childrenWorkItems.filter((t) => (t as AdoWorkItemType).isNewTask ? null : t)
        return set({ childrenWorkItems: next });
    },

    setChildRemainingWork: (childId: number, newRemainingWork: number | null) =>
        set((state) => {
            const patch = (wi: AdoWorkItemType) =>
                wi.id === childId
                    ? {
                        ...wi,
                        fields: {
                            ...wi.fields,
                            [FieldConstant.WORK_ITEM_FIELD_REMAINING_WORK]:
                                newRemainingWork !== null ? Number(newRemainingWork) : null,
                        },
                    }
                    : wi;

            return {
                childrenWorkItems: state.childrenWorkItems.map(patch),
                workItems: state.workItems.map(patch),
            };
        }),

}));

//#region Private Functions
function derive(items: AdoWorkItemType[], selectedIteration?: IterationInfoType) {
    const childrenWorkItems = filterTasks(items);

    const parentWorkItems = filterPbisAndBugs(items).map(parent => {
        const parentWorkItemIteration = parent.fields[FieldConstant.WORK_ITEM_FIELD_ITERATION_INFO];
        const startDate = parentWorkItemIteration?.startDate;
        const finishDate = parentWorkItemIteration?.finishDate;

        const isFaded = selectedIteration ? !(toUtcDateOnly(startDate) === toUtcDateOnly(selectedIteration.startDate) &&
            toUtcDateOnly(finishDate) === toUtcDateOnly(selectedIteration.finishDate))
            : false;

        return { ...parent, isFaded: isFaded };
    });

    return {
        workItems: items,
        parentWorkItems: parentWorkItems,
        childrenWorkItems: childrenWorkItems,
    };
}
//#endregion
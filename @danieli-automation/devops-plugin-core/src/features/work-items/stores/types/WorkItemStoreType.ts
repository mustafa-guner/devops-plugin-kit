import { IterationInfoType } from "features/iterations/types/IterationInfoType";
import { AdoWorkItemType } from "features/work-items/types/AdoWorkItemType";

export type WorkItemSetFields = | "workItems" | "parentWorkItems" | "childrenWorkItems";

export type WorkItemStoreType = {
    workItems: AdoWorkItemType[];
    parentWorkItems: AdoWorkItemType[];
    topLevelParentWorkItems: AdoWorkItemType[];
    childrenWorkItems: AdoWorkItemType[];
    selectedWorkItem: AdoWorkItemType | null;
    isLoading: boolean;
    workItemErrors: Record<number, string | null>;

    //setters
    setWorkItems: <K extends WorkItemSetFields>(key: K, v: WorkItemStoreType[K], selectedIteration?: IterationInfoType) => void;
    clearWorkItemError: (id: number) => void;
    setTopLevelParentWorkItems: (updatedTopLevelParents: AdoWorkItemType[]) => void;
    setIsLoading: (v: boolean) => void;
    removeDraftsFromWorkItems: () => void;
    setWorkItemError: (id: number, error: string | null) => void;
    setSelectedWorkItem: (workItem: AdoWorkItemType | null, options?: { source?: "click" | "context" }) => void;
    setChildRemainingWork: (childId: number, newRemainingWork: number | null) => void;
}
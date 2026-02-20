import { useIterationStore } from "features/iterations/stores/useIterationStore";
import FieldConstant from "features/work-items/constants/FieldConstant";
import StateConstant from "features/work-items/constants/StateConstant";
import { useUpdateWorkItemData } from "features/work-items/hooks/useData/useUpdateWorkItemData";
import { useWorkItemStore } from "features/work-items/stores/useWorkItemStore";
import { AdoWorkItemType } from "features/work-items/types/AdoWorkItemType";
import { calculateTotalRemainingWorkByWorkItems, isTask } from "features/work-items/utils/workItem";
import * as React from "react";
import QueryKeyConstant from "src/app/constants/QueryKeyConstant";
import { WorkItemStoreKeyConstant } from "src/app/constants/StoreKeyConstant";
import { formatNumberTrimmed } from "src/app/utils/global";

type Props = {
    workItem: AdoWorkItemType;
};

export function WorkItemRemainingWork({ workItem }: Props) {
    const { childrenWorkItems } = useWorkItemStore();
    const { currentIteration, selectedIteration } = useIterationStore();
    const updateFields = useUpdateWorkItemData();

    const [isEditEnabled, setIsEditEnabled] = React.useState(false);

    const filteredChildren = React.useMemo(
        () =>
            childrenWorkItems
                .filter((child) => {
                    if (!child) return false;
                    const parentId = child.fields?.[FieldConstant.WORK_ITEM_FIELD_PARENT];
                    return parentId === workItem.id;
                })
                .filter((child) => isTask(child))
                .filter(
                    (child) =>
                        child.fields[FieldConstant.WORK_ITEM_FIELD_STATE] !==
                        StateConstant.DONE_STATE
                ),
        [childrenWorkItems, workItem.id, isTask]
    );

    const rawRemainingWork: number | undefined = React.useMemo(() => {
        if (isTask(workItem)) {
            const v = workItem.fields[FieldConstant.WORK_ITEM_FIELD_REMAINING_WORK];
            return typeof v === "number" ? v : undefined;
        }

        const total = calculateTotalRemainingWorkByWorkItems(filteredChildren);
        return total > 0 ? total : undefined;
    }, [isTask, workItem, filteredChildren]);

    const hasRemainingWork = rawRemainingWork != null;

    const displayRemainingWork = rawRemainingWork == null ? "" : formatNumberTrimmed(rawRemainingWork);

    const saveRemainingWork = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== "Enter") return;

        const inputValue = (e.target as HTMLInputElement).value.trim();

        let newRemainingWork: number | null = null;

        if (inputValue !== "") {
            const parsed = Number(inputValue);
            newRemainingWork = Number.isFinite(parsed) ? parsed : null;
        }

        const currentRemainingWork = resolveRemainingWorkAsNumber(workItem);
        const currentAndNewRemainingWorkSame = checkIsCurrentAndNewSame(newRemainingWork, currentRemainingWork);

        if (currentAndNewRemainingWorkSame) {
            setIsEditEnabled(false);
            return;
        }

        setIsEditEnabled(false);

        const project = workItem.fields[FieldConstant.WORK_ITEM_FIELD_TEAM_PROJECT];
        const parentId = Number(workItem.fields[FieldConstant.WORK_ITEM_FIELD_PARENT]);
        const childrenKey = [QueryKeyConstant.CHILDREN_QUERY_KEY, project, parentId] as const;

        updateFields.mutate({
            workItemId: workItem.id,
            project,
            queryKeys: [childrenKey],
            fieldUpdates: { [FieldConstant.WORK_ITEM_FIELD_REMAINING_WORK]: newRemainingWork },
            storeKeys: [WorkItemStoreKeyConstant.workItems],
            storeIteration: selectedIteration ?? currentIteration ?? undefined,
            operation: newRemainingWork == null ? "remove" : "replace",
        });
    };

    const onClickEditable = () => {
        if (isTask(workItem)) setIsEditEnabled(true);
    };

    const editDefaultValue = resolveRemainingWorkAsString(workItem)

    return (
        <div className="tb-card-remaining-work">
            {isEditEnabled && isTask(workItem) ? (
                <input
                    className="tb-card-remaining-input tb-card-input short-input-field align-right"
                    type="text"
                    onKeyUp={saveRemainingWork}
                    onFocus={(e) => e.currentTarget.select()}
                    defaultValue={editDefaultValue}
                    onBlur={() => setIsEditEnabled(false)}
                    autoFocus
                />
            ) : (
                (!isTask(workItem) ||
                    workItem.fields[FieldConstant.WORK_ITEM_FIELD_STATE] !==
                    StateConstant.DONE_STATE) && (
                    <div
                        className={`${isTask(workItem) ? "editable-data" : ""} w-35`}
                        onClick={onClickEditable}
                        title={isTask(workItem) ? "Click to edit remaining work" : "Remaining work can only be edited on Tasks"}
                        {...(!hasRemainingWork ? { style: { padding: "10px 0" } } : {})}
                    >
                        {hasRemainingWork ? displayRemainingWork : ""}
                    </div>
                )
            )}
        </div>
    );
}

//#region Private Functions
function resolveRemainingWorkAsNumber(workItem: AdoWorkItemType): number | null {
    const remainingWork = workItem.fields[FieldConstant.WORK_ITEM_FIELD_REMAINING_WORK];
    return typeof remainingWork === "number" ? (remainingWork as number) : null;
}

function resolveRemainingWorkAsString(workItem: AdoWorkItemType): string | "" {
    const remainingWork = workItem.fields[FieldConstant.WORK_ITEM_FIELD_REMAINING_WORK];
    return typeof remainingWork === "number" ? String(remainingWork) : "";
}

function checkIsCurrentAndNewSame(newRemainingWork: number | null, currentRemainingWork: number | null): boolean {
    return newRemainingWork === currentRemainingWork ||
        (newRemainingWork != null && currentRemainingWork != null
            && Math.abs(newRemainingWork - currentRemainingWork) < 1e-10);
}
//#endregion
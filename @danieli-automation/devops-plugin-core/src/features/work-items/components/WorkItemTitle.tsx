import { Icon } from "@fluentui/react/lib/Icon";
import { Link } from "azure-devops-ui/Link";
import { queryClient } from "core/queryClient";
import { IterationService } from "features/iterations/services/IterationService";
import { useIterationStore } from "features/iterations/stores/useIterationStore";
import { useProjectStore } from "features/teams/stores/useProjectStore";
import { createWorkItem } from "features/work-items/api/workItems";
import FieldConstant from "features/work-items/constants/FieldConstant";
import StateConstant from "features/work-items/constants/StateConstant";
import TypeConstant from "features/work-items/constants/TypeConstant";
import { useUpdateWorkItemData } from "features/work-items/hooks/useData/useUpdateWorkItemData";
import { useWorkItemStore } from "features/work-items/stores/useWorkItemStore";
import { AdoWorkItemType } from "features/work-items/types/AdoWorkItemType";
import React from "react";
import QueryKeyConstant from "src/app/constants/QueryKeyConstant";
import { WorkItemStoreKeyConstant } from "src/app/constants/StoreKeyConstant";
import Helper from "src/app/utils/column";
import { getEditWorkItemUrl } from "src/app/utils/global";
import { getChildrenQueryKey } from "src/app/utils/queryKey";

type Props = {
    icon: { iconName: string; color: string };
    isNewTask: boolean;
    isEditEnabled?: boolean;
    setIsEditEnabled?: (value: React.SetStateAction<boolean>) => void;
    setIsEditEnabledOverlay?: (value: boolean) => void;
    workItem?: any;
    errorHandlers?: {
        setCardError: (msg: string | null, options?: { local: boolean }) => void;
        clearCardError: () => void;
    };
};

export function WorkItemTitle({ workItem, icon, isEditEnabled, setIsEditEnabled, isNewTask, errorHandlers }: Props) {
    const { workItems, setWorkItems, childrenWorkItems, parentWorkItems, removeDraftsFromWorkItems } = useWorkItemStore();
    const { selectedIteration, currentIteration } = useIterationStore();
    const updateFields = useUpdateWorkItemData();
    const { selectedProjects } = useProjectStore();

    const link = getEditWorkItemUrl(workItem);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const isMountedRef = React.useRef(true);
    const isCreatingRef = React.useRef(false);
    const [isCreating, setIsCreating] = React.useState(false);

    React.useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const safeSetIsEditEnabled = React.useCallback(
        (value: boolean) => {
            if (isMountedRef.current) {
                setIsEditEnabled?.(value);
            }
        },
        [setIsEditEnabled]
    );

    React.useEffect(() => {
        if (isNewTask) {
            safeSetIsEditEnabled(true);
        }
    }, [isNewTask, safeSetIsEditEnabled]);

    const saveTitle = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== "Enter") return;

        e.preventDefault();
        e.stopPropagation();
        if (e.repeat) return;

        if (isNewTask) {
            await createNewWorkItem(e);
        } else {
            updateWorkItemTitle(e);
        }
    };

    // @TODO: needs refactor
    const createNewWorkItem = async (e: React.KeyboardEvent<HTMLInputElement>) => {

        if (isCreatingRef.current) return;
        isCreatingRef.current = true;
        setIsCreating(true);

        try {
            const input = e.currentTarget;
            const newTitle = input.value.trim();

            if (!newTitle) {
                errorHandlers?.setCardError("Title is required.", { local: true });
                return;
            }

            const parent = workItem.parentWorkItem;
            const project = parent.fields[FieldConstant.WORK_ITEM_FIELD_TEAM_PROJECT];

            const allowedPaths = await IterationService.getAllowedIterationPathsForSelection(
                selectedProjects ?? [],
                {
                    startDate: selectedIteration!.startDate!,
                    finishDate: selectedIteration!.finishDate!,
                }
            );

            const workItemProjectName = String(
                parent.fields[FieldConstant.WORK_ITEM_FIELD_TEAM_PROJECT] ?? ""
            ).toLowerCase();

            const getCorrectIteration = allowedPaths.find((iterPath) => {
                const parts = iterPath.toLowerCase().split("\\");
                const projectName = parts[0];
                return projectName === workItemProjectName;
            });

            const fields = {
                title: newTitle,
                state: StateConstant.TO_DO_STATE,
                iterationPath: getCorrectIteration || parent.fields[FieldConstant.WORK_ITEM_FIELD_ITERATION_PATH],
                areaPath: parent.fields[FieldConstant.WORK_ITEM_FIELD_AREA_PATH],
                parent: parent.id,
                workItemType: TypeConstant.TASK_TYPE,
            };

            const newWorkItem = (await createWorkItem(project, parent.id, fields)) as AdoWorkItemType;

            errorHandlers?.clearCardError();

            const nextChildren = [...(childrenWorkItems ?? []), newWorkItem];

            const nextParents = (parentWorkItems ?? []).map((p: AdoWorkItemType) =>
                p.id === parent.id
                    ? {
                        ...p,
                        _children: [...(((p as any)._children as AdoWorkItemType[]) ?? []), newWorkItem],
                    }
                    : p
            );

            const nextWorkItems: AdoWorkItemType[] = [
                ...(workItems ?? []).map((wi: AdoWorkItemType) =>
                    wi.id === parent.id
                        ? {
                            ...wi,
                            _children: [...(((wi as any)._children as AdoWorkItemType[]) ?? []), newWorkItem],
                        }
                        : wi
                ),
                newWorkItem,
            ];

            setWorkItems(WorkItemStoreKeyConstant.childrenWorkItems, nextChildren);
            setWorkItems(WorkItemStoreKeyConstant.parentWorkItems, nextParents);
            setWorkItems(WorkItemStoreKeyConstant.workItems, nextWorkItems, selectedIteration ?? currentIteration ?? undefined);

            // Update react-query children cache 
            const projectId = String(parent.fields[FieldConstant.WORK_ITEM_FIELD_TEAM_PROJECT]);
            const parentId = parent.id;

            queryClient.setQueriesData<AdoWorkItemType[]>(
                { queryKey: [QueryKeyConstant.CHILDREN_QUERY_KEY, projectId, parentId], exact: false },
                (old) => {
                    const prev = old ?? [];
                    if (prev.some((x) => x.id === newWorkItem.id)) return prev;
                    return [newWorkItem, ...prev];
                }
            );

            input.value = "";
            safeSetIsEditEnabled(false);
        } catch (err: any) {
            errorHandlers?.setCardError(err?.message || "Failed to create new task", { local: true } as any);
        } finally {
            isCreatingRef.current = false;
            setIsCreating(false);
        }
    };

    const updateWorkItemTitle = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== "Enter") return;

        const newTitle = e.currentTarget.value.trim();
        const oldTitle = String(workItem.fields[FieldConstant.WORK_ITEM_FIELD_TITLE] ?? "");

        if (!newTitle || newTitle === oldTitle) {
            safeSetIsEditEnabled(false);
            return;
        }

        const project = String(workItem.fields[FieldConstant.WORK_ITEM_FIELD_TEAM_PROJECT] ?? "");

        safeSetIsEditEnabled(false);

        const parent = workItem.fields[FieldConstant.WORK_ITEM_FIELD_PARENT];
        const iteration = selectedIteration ?? currentIteration ?? undefined;

        const childFields = Helper.getColumnFields();
        const childrenKey = getChildrenQueryKey(project, parent, childFields);

        updateFields.mutate({
            workItemId: workItem.id,
            project,
            queryKeys: [childrenKey],
            fieldUpdates: { [FieldConstant.WORK_ITEM_FIELD_TITLE]: newTitle },
            storeKeys: [WorkItemStoreKeyConstant.workItems],
            storeIteration: iteration,
        });
    };

    function handleOnBlur() {
        safeSetIsEditEnabled(false);
        removeDraftsFromWorkItems();
    }

    return (
        <div className="tb-card-title">
            {isEditEnabled ? (
                <input
                    ref={inputRef}
                    className="tb-card-title-input tb-card-input long-input-field"
                    type="text"
                    onKeyDown={saveTitle}
                    onFocus={(e) => e.currentTarget.select()}
                    defaultValue={workItem.fields[FieldConstant.WORK_ITEM_FIELD_TITLE]}
                    onBlur={handleOnBlur}
                    autoFocus
                    aria-busy={isCreating}
                />
            ) : (
                <>
                    <Icon
                        className="tb-card-icon"
                        iconName={icon.iconName}
                        style={{ color: icon.color, fontSize: 16, width: 18, height: 18 }}
                    />
                    <span className="tb-card-task-id">{workItem.id}</span>{" "}
                    <Link href={link} target="_blank" rel="noreferrer" className="text">
                        {workItem.fields[FieldConstant.WORK_ITEM_FIELD_TITLE]}
                    </Link>
                </>
            )}
        </div>
    );
}

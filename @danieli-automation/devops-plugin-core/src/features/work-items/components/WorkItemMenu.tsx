import { IconSize } from "azure-devops-ui/Icon";
import { MenuButton } from "azure-devops-ui/Menu";
import { useIterationStore } from "features/iterations/stores/useIterationStore";
import FieldConstant from "features/work-items/constants/FieldConstant";
import { useDeleteWorkItemData } from "features/work-items/hooks/useData/useDeleteWorkItemData";
import { useDeleteWorkItemDataWithChildren } from "features/work-items/hooks/useData/useDeleteWorkItemDataWithChildren";
import { useAssignToMenu } from "features/work-items/hooks/useMenu/subMenu/useAssignToMenu";
import { useMoveToIterationMenu } from "features/work-items/hooks/useMenu/subMenu/useMoveToIterationMenu";
import { AdoWorkItemType } from "features/work-items/types/AdoWorkItemType";
import { buildWorkItemMenuItems } from "features/work-items/utils/workItemMenu";
import * as React from "react";
import { ConfirmActionDialog } from "src/app/components/Dialog/ConfirmActionDialog";
import QueryKeyConstant from "src/app/constants/QueryKeyConstant";
import { WorkItemStoreKeyConstant } from "src/app/constants/StoreKeyConstant";
import { TabConstant } from "src/app/constants/TabConstant";
import { useConfirmDialog } from "src/app/hooks/useConfirmDialog";
import { useMountedRef } from "src/app/hooks/useMountedRef";

type Props = {
    isTaskboardView?: boolean;
    titleEditOptions?: {
        setIsEditTitleEnabled: (value: React.SetStateAction<boolean>) => void;
        isEditTitleEnabled: boolean;
    };
    workItem: AdoWorkItemType;
    errorHandlers?: {
        setCardError: (msg: string | null) => void;
        clearCardError: () => void;
    };
};

type Mode = "delete" | "cancel-children";

export function WorkItemMenu({ isTaskboardView = true, workItem, titleEditOptions, errorHandlers }: Props) {
    const mountedRef = useMountedRef();
    const { currentIteration, selectedIteration } = useIterationStore();
    const [menuOpen, setMenuOpen] = React.useState(false);
    const closeMenu = React.useCallback(() => setMenuOpen(false), []);

    const enableAssignTo = !isTaskboardView;
    const enableMoveTo = true;

    const { members, membersLoading, ensureMembersLoaded, handleAssign } = useAssignToMenu(enableAssignTo);
    const { iterations, iterationsLoading, ensureIterationsLoaded, handleMove } = useMoveToIterationMenu(true);

    React.useEffect(() => {
        if (!menuOpen) return;
        void ensureMembersLoaded(workItem);
        void ensureIterationsLoaded(workItem);
    }, [menuOpen, ensureMembersLoaded, ensureIterationsLoaded, workItem]);

    const deleteMutation = useDeleteWorkItemData();
    const deleteWorkItemDataWithChildren = useDeleteWorkItemDataWithChildren();

    // dialog state
    const confirmDialog = useConfirmDialog<{ mode: Mode; workItem: AdoWorkItemType }>();

    // derive common fields
    const project = String(workItem.fields?.[FieldConstant.WORK_ITEM_FIELD_TEAM_PROJECT] ?? "");
    const parentId = Number(workItem.fields?.[FieldConstant.WORK_ITEM_FIELD_PARENT] ?? 0);
    const childrenKey = [QueryKeyConstant.CHILDREN_QUERY_KEY, project, parentId] as const;

    const openConfirm = React.useCallback((mode: Mode) => {
        confirmDialog.openFor({ mode, workItem });
        closeMenu();
    },
        [confirmDialog, workItem, closeMenu]
    );

    const items = React.useMemo(() => {
        return buildWorkItemMenuItems(workItem, {
            view: isTaskboardView ? TabConstant.Taskboard : TabConstant.Backlog,
            source: "moreButton",
            enableAssignTo,
            enableMoveTo,
            members,
            membersLoading,
            iterationsList: iterations,
            iterationsLoading,
            currentIteration,
            handlers: {
                onAssign: handleAssign,
                onMoveTo: handleMove,
                onToggleEditTitle: isTaskboardView
                    ? () => titleEditOptions?.setIsEditTitleEnabled(!titleEditOptions.isEditTitleEnabled)
                    : undefined,
                onOpenDeleteDialog: () => openConfirm("delete"),
                onOpenCancelChildrenDialog: () => openConfirm("cancel-children"),
            },
            closeMenu,
        });
    }, [
        workItem,
        isTaskboardView,
        enableAssignTo,
        enableMoveTo,
        members,
        membersLoading,
        handleAssign,
        iterations,
        iterationsLoading,
        currentIteration,
        titleEditOptions,
        handleMove,
        closeMenu,
        openConfirm,
    ]);

    const handleConfirm = React.useCallback(async () => {
        if (!mountedRef.current) return;

        const payload = confirmDialog.target;
        if (!payload) return;

        errorHandlers?.clearCardError?.();

        try {
            const mode = payload.mode;
            const wi = payload.workItem;

            if (!project || !wi.id) return;

            if (mode === "cancel-children") {

                await deleteWorkItemDataWithChildren.mutateAsync({
                    parentId: wi.id,
                    project,
                    childrenKey: [QueryKeyConstant.CHILDREN_QUERY_KEY, project, wi.id] as const,
                    includeDescendants: true,
                    cancelParent: true,
                    storeKey: WorkItemStoreKeyConstant.workItems,
                    storeIteration: selectedIteration ?? currentIteration ?? undefined
                });

                if (mountedRef.current) confirmDialog.close();
                return;
            }

            // delete
            await deleteMutation.mutateAsync({
                workItemId: wi.id,
                project,
                childrenKey,
                storeKey: WorkItemStoreKeyConstant.workItems,
                storeIteration: selectedIteration ?? currentIteration ?? undefined
            });

            if (mountedRef.current) confirmDialog.close();
        } catch (err: any) {
            if (!mountedRef.current) return;
            errorHandlers?.setCardError(err?.message || "Operation failed");
        }
    }, [
        mountedRef,
        confirmDialog,
        errorHandlers,
        project,
        childrenKey,
        deleteMutation,
        deleteWorkItemDataWithChildren,
    ]);

    const isOpen = confirmDialog.isOpen && !!confirmDialog.target;
    const mode = confirmDialog.target?.mode ?? "delete";
    const isCancelChildren = mode === "cancel-children";

    const loading = (mode === "delete" && deleteMutation.isLoading) || (mode === "cancel-children" && deleteWorkItemDataWithChildren.isLoading);

    const stop = (e: React.SyntheticEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <div onMouseDown={stop} onClick={stop}>
            <MenuButton
                style={{ padding: 0 }}
                ariaLabel="Actions"
                iconProps={{ iconName: isTaskboardView ? "More" : "MoreVertical", size: IconSize.medium }}
                className="card-context-menu"
                subtle
                hideDropdownIcon
                contextualMenuProps={{
                    menuProps: { id: "wi-menu", items },
                    onDismiss: closeMenu,
                }}
                onClick={(e?: any) => {
                    e?.stopPropagation?.();
                    setMenuOpen(true);
                }}
            />

            {isOpen ? (
                <div onMouseDown={stop} onClick={stop}>
                    <ConfirmActionDialog
                        title={isCancelChildren ? "Cancel child work item(s)" : "Delete work item(s)"}
                        confirmText={isCancelChildren ? "Cancel Children" : "Delete"}
                        loadingLabel={isCancelChildren ? "Canceling children" : "Deleting work item(s)"}
                        isOpen={isOpen}
                        isLoading={loading}
                        onCancel={confirmDialog.close}
                        onConfirm={() => void confirmDialog.runConfirm(() => handleConfirm())}
                    >
                        {isCancelChildren ? (
                            <>
                                <p>Are you sure you want to cancel the child work item(s)?</p>
                                <p>This will update children under the selected parent.</p>
                            </>
                        ) : (
                            <>
                                <p>Are you sure you want to delete the selected work item(s)?</p>
                                <p>You can restore deleted work items from the Recycle Bin.</p>
                            </>
                        )}
                    </ConfirmActionDialog>
                </div>
            ) : null}
        </div>
    );
}

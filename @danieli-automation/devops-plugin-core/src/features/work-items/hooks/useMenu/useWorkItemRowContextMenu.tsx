import { ContextualMenu } from "azure-devops-ui/Menu";
import { IPoint } from "azure-devops-ui/Utilities/Position";
import { AdoWorkItemType } from "features/work-items/types/AdoWorkItemType";
import { WorkItemRowContextMenuType } from "features/work-items/types/WorkItemRowContextMenuType";
import { buildWorkItemMenuItems } from "features/work-items/utils/workItemMenu";
import * as React from "react";
import { ConfirmActionDialog } from "src/shared/components/Dialog/ConfirmActionDialog";
import { useConfirmDialog } from "../../../../shared/hooks/useConfirmDialog";
import { useAssignToMenu } from "./subMenu/useAssignToMenu";
import { useMoveToIterationMenu } from "./subMenu/useMoveToIterationMenu";

type Props = {
    onDelete: (wi: AdoWorkItemType) => Promise<void> | void;
    onCancelChildren: (wi: AdoWorkItemType) => Promise<void> | void;
    enableAssignTo?: boolean;
};

/**
 * Work item row context-menu hook (right-click).
 *
 * Responsibilities:
 * - Tracks anchor position + selected work item for menu
 * - Preloads Assign-To members (optional)
 * - Opens confirm dialogs for Delete and Cancel-Children actions
 *
 * @param options Hook options and action handlers.
 * @returns Handlers + portals for menu and dialogs.
 */
export function useWorkItemRowContextMenu(options: Props): WorkItemRowContextMenuType {
    const { onDelete, onCancelChildren } = options;
    const enableAssignTo = options.enableAssignTo ?? true;

    const [contextMenuState, setContextMenuState] = React.useState<{ workItem: AdoWorkItemType; anchorPoint: IPoint; } | null>(null);

    const closeContextMenu = React.useCallback(() => setContextMenuState(null), []);
    const { members, membersLoading, ensureMembersLoaded, handleAssign } = useAssignToMenu(enableAssignTo);
    const { iterations, iterationsLoading, ensureIterationsLoaded, handleMove, currentIteration } = useMoveToIterationMenu(true);

    const deleteDialog = useConfirmDialog<AdoWorkItemType>();
    const cancelChildrenDialog = useConfirmDialog<AdoWorkItemType>();

    const handleRowContextMenu = React.useCallback(
        (e: React.MouseEvent<HTMLTableRowElement>, wi: AdoWorkItemType) => {
            e.preventDefault();
            setContextMenuState({ workItem: wi, anchorPoint: { x: e.clientX, y: e.clientY } });
            void ensureMembersLoaded(wi);
            void ensureIterationsLoaded(wi);
        },
        [ensureMembersLoaded, ensureIterationsLoaded]
    );

    const openDeleteDialogFor = React.useCallback(
        (wi: AdoWorkItemType) => {
            deleteDialog.openFor(wi);
            closeContextMenu();
        },
        [deleteDialog, closeContextMenu]
    );

    const openCancelChildrenDialogFor = React.useCallback(
        (wi: AdoWorkItemType) => {
            cancelChildrenDialog.openFor(wi);
            closeContextMenu();
        },
        [cancelChildrenDialog, closeContextMenu]
    );

    // ---- Context Menu Portal ----
    const ContextMenuPortal = contextMenuState ? (
        <ContextualMenu
            anchorPoint={contextMenuState.anchorPoint}
            onDismiss={closeContextMenu}
            menuProps={{
                id: "wi-row-context-menu",
                items: buildWorkItemMenuItems(contextMenuState.workItem, {
                    view: "backlog",
                    source: "rightClick",
                    enableAssignTo,
                    members,
                    membersLoading,
                    enableMoveTo: true,
                    iterationsList: iterations,
                    iterationsLoading,
                    currentIteration,
                    handlers: {
                        onAssign: handleAssign,
                        onMoveTo: handleMove,
                        onOpenDeleteDialog: openDeleteDialogFor,
                        onOpenCancelChildrenDialog: openCancelChildrenDialogFor,
                    },
                    closeMenu: closeContextMenu,
                }),
            }}
        />
    ) : null;

    // ---- Delete Dialog ----
    const DeleteDialog = deleteDialog.isOpen && deleteDialog.target ? (
        <ConfirmActionDialog
            title="Delete work item"
            confirmText="Delete"
            loadingLabel="Deleting work item"
            isOpen={deleteDialog.isOpen}
            isLoading={deleteDialog.isLoading}
            onCancel={deleteDialog.close}
            onConfirm={() => void deleteDialog.runConfirm(onDelete)}
        >
            <p>Are you sure you want to delete the selected work item(s)?</p>
            <p>You can restore deleted work items from the Recycle Bin.</p>
        </ConfirmActionDialog>
    ) : null;

    // ---- Cancel Children Dialog ----
    const CancelChildrenDialog = cancelChildrenDialog.isOpen && cancelChildrenDialog.target ? (
        <ConfirmActionDialog
            title="Delete Children"
            confirmText="Delete Children"
            loadingLabel="Deleting children"
            isOpen={cancelChildrenDialog.isOpen}
            isLoading={cancelChildrenDialog.isLoading}
            onCancel={cancelChildrenDialog.close}
            onConfirm={() => void cancelChildrenDialog.runConfirm(onCancelChildren)}
        >
            <p>Are you sure you want to delete children?</p>
            <p>This will update children under the selected parent.</p>
        </ConfirmActionDialog>
    ) : null;

    return { handleRowContextMenu, ContextMenuPortal, DeleteDialog, CancelChildrenDialog };
}

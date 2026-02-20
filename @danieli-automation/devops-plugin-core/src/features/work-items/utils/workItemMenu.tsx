import { IconSize } from "azure-devops-ui/Icon";
import { IMenuItem, MenuItemType } from "azure-devops-ui/Menu";
import * as React from "react";
import { TabConstant } from "../../../app/constants/TabConstant";
import { copyWorkItemUrl, openWorkItemUrl } from "../../../app/utils/global";
import { IterationInfoType } from "../../iterations/types/IterationInfoType";
import { findByAreaRoot, formatIteration } from "../../iterations/utils/iteration";
import { TeamMember } from "../../teams/types/TeamMemberType";
import FieldConstant from "../constants/FieldConstant";
import { AdoWorkItemType } from "../types/AdoWorkItemType";

export type OpenSource = "rightClick" | "moreButton";

export type WorkItemMenuHandlers = {

    onOpenDeleteDialog: (wi: AdoWorkItemType) => void;
    onOpenCancelChildrenDialog: (wi: AdoWorkItemType) => void;
    onToggleEditTitle?: () => void;
    onAssign?: (wi: AdoWorkItemType, member: TeamMember | null) => void;
    onMoveTo?: (wi: AdoWorkItemType, iteration: IterationInfoType | null | undefined) => void;
};

export type BuildMenuOptions = {
    view: string;
    source: OpenSource;
    enableAssignTo?: boolean;
    enableMoveTo?: boolean;
    iterationsLoading?: boolean;
    membersLoading?: boolean;
    members?: TeamMember[] | null;
    iterationsList?: IterationInfoType[] | null;
    currentIteration?: IterationInfoType | null;
    handlers: WorkItemMenuHandlers;
    closeMenu: () => void;
};

/**
 * Builds context-menu items for a work item based on current view and enabled capabilities.
 *
 * @param workItem Work item that menu actions will target.
 * @param opts Menu build options, loading flags, and action handlers.
 * @returns Fully built menu item list for Azure DevOps UI menu control.
 */
export function buildWorkItemMenuItems(workItem: AdoWorkItemType, opts: BuildMenuOptions): IMenuItem[] {
    const { view, enableAssignTo, enableMoveTo, handlers, closeMenu } = opts;

    const menu: IMenuItem[] = [];

    if (enableAssignTo && handlers.onAssign) {
        menu.push({
            id: "assign-to",
            text: "Assign to",
            iconProps: { iconName: "People" },
            subMenuProps: {
                id: "assign-to-submenu",
                items: buildAssignToSubMenuItems(workItem, opts),
            },
        });
    }

    // Taskboard-only item
    if (view === TabConstant.Taskboard && handlers.onToggleEditTitle) {
        menu.push(
            {
                id: "open-wi",
                text: "Open",
                iconProps: { iconName: "ReplyMirrored" },
                onActivate: () => {
                    closeMenu();
                    openWorkItemUrl(workItem);
                },
            },
            {
                id: "edit-wi",
                text: "Edit Title",
                iconProps: { iconName: "Edit" },
                onActivate: () => {
                    closeMenu();
                    handlers.onToggleEditTitle?.();
                },
            }
        );
    }

    if (enableMoveTo && handlers.onMoveTo) {
        menu.push(
            {
                id: "move-wi-to-iteration",
                text: "Move to Iteration",
                iconProps: { iconName: "" },
                subMenuProps: {
                    id: "move-to-submenu",
                    items: buildMoveToIterationSubMenuItems(workItem, opts),

                },
            }
        )
    }

    // Backlog-only item
    if (view == TabConstant.Backlog) {
        menu.push(
            {
                id: "copy-wi-link",
                text: "Copy Link",
                iconProps: { iconName: "Link" },
                onActivate: () => {
                    closeMenu();
                    copyWorkItemUrl(workItem);
                },
            }
        )
    }


    // Destructive actions
    menu.push(
        {
            id: "delete-wi",
            text: "Delete",
            iconProps: { iconName: "Delete" },
            onActivate: () => handlers.onOpenDeleteDialog(workItem),
        }
    );

    if (workItem?._children?.length) {
        menu.push(
            { id: "separator-edit", itemType: MenuItemType.Divider },
            {
                id: "cancel-wi-children",
                text: "Delete Work Item with Children",
                iconProps: { iconName: "Cancel" },
                onActivate: () => handlers.onOpenCancelChildrenDialog(workItem),
            });
    }

    return menu;
}


//#region Private Functions
/**
 * Builds the "Assign to" submenu items including unassigned and member choices.
 *
 * @param workItem Work item to update after member selection.
 * @param opts Menu options containing member data and handlers.
 * @returns Assign submenu items.
 */
function buildAssignToSubMenuItems(workItem: AdoWorkItemType, opts: BuildMenuOptions): IMenuItem[] {
    const { membersLoading, members, handlers, closeMenu } = opts;

    if (membersLoading) {
        return [{ id: "assign-to-loading", text: "Loading...", disabled: true }];
    }

    const people: IMenuItem[] = (members ?? []).map((m) => ({
        id: `assign-${m.uniqueName ?? m.descriptor ?? m.displayName}`,
        text: m.displayName,
        data: m,
        onActivate: () => {
            closeMenu();
            handlers.onAssign?.(workItem, m);
        },
    }));

    return [
        {
            id: "assign-unassigned",
            text: "Unassigned",
            onActivate: () => {
                closeMenu();
                handlers.onAssign?.(workItem, null);
            },
        },
        { id: "assign-divider", itemType: MenuItemType.Divider },
        ...(people.length ? people : [{ id: "assign-none", text: "No members found", disabled: true }]),
    ];
}

/**
 * Builds the "Move to Iteration" submenu with backlog/current/future options.
 *
 * @param workItem Work item to move.
 * @param opts Menu options containing iteration data and handlers.
 * @returns Move-to-iteration submenu items.
 */
function buildMoveToIterationSubMenuItems(workItem: AdoWorkItemType, opts: BuildMenuOptions): IMenuItem[] {
    const { iterationsLoading, iterationsList, currentIteration, handlers, closeMenu } = opts;

    if (iterationsList === null) {
        return [{ id: "move-to-loading", text: "Loading...", disabled: true }];
    }

    if (iterationsLoading) {
        return [{ id: "move-to-loading", text: "Loading...", disabled: true }];
    }

    const iterPath = String(workItem.fields?.[FieldConstant.WORK_ITEM_FIELD_ITERATION_PATH] ?? "");
    const level1FromPath = iterPath.split("\\")[0] || "";
    const level1 = String(workItem.fields?.[FieldConstant.WORK_ITEM_FIELD_ITERATION_LEVEL_1] ?? level1FromPath);

    const iterations: IMenuItem[] = (iterationsList ?? []).map((iteration) => ({
        id: `move-${iteration.id ?? iteration.name}`,
        text: (
            <div className="overflowed-it-menu-option">
                <span>{`${iteration ? iteration.name + " - " : ""}${formatIteration(iteration)}`}</span>
                <br />
                {iteration && <small className="faded">{iteration.path}</small>}
            </div>
        ) as unknown as string,
        data: iteration,
        onActivate: () => {
            closeMenu();
            handlers.onMoveTo?.(workItem, iteration);
        },
    }));


    iterations.unshift(
        {
            id: "move-section-future",
            text: "Future iterations",
            itemType: MenuItemType.Header,
        },
    )
    return [
        {
            id: "move-to-backlog",
            iconProps: {
                iconName: "Backlog",
                size: IconSize.small,
            },
            text: (
                <div className="overflowed-it-menu-option">
                    <span>Backlog</span>
                    <br />
                    {currentIteration && <small className="faded">{level1}</small>}
                </div>
            ) as unknown as string,
            data: { ...currentIteration, path: level1 },
            onActivate: () => {
                closeMenu();
                handlers.onMoveTo?.(workItem, { ...currentIteration, path: level1 } as IterationInfoType);
            }
        },
        {
            id: "move-to-current-iteration",
            iconProps: {
                iconName: "TriangleRight12",
                size: IconSize.small
            },
            text: (
                <div className="overflowed-it-menu-option">
                    <span>{`Current (${currentIteration ? currentIteration.name + " - " : ""}${formatIteration(currentIteration)})`}</span>
                    <br />
                    {currentIteration && (
                        <small className="faded">
                            {`${level1}\\${currentIteration.name}`}
                        </small>
                    )}
                </div>
            ) as unknown as string,
            data: currentIteration,
            onActivate: () => {
                closeMenu();
                const matchedPath = findByAreaRoot(currentIteration?.paths, level1);
                if (!currentIteration || !matchedPath) return;
                const next: IterationInfoType = { ...currentIteration, path: matchedPath };
                handlers.onMoveTo?.(workItem, next);
            }
        },
        { id: "move-to-divider", itemType: MenuItemType.Divider },
        ...(iterations.length ? iterations : [{ id: "move-to-none", text: "No Iteration found", disabled: true }]),
    ];
}
//#endregion

import StateConstant from "./StateConstant";
import TypeConstant from "./TypeConstant";

export const WORK_ITEM_TYPES = [TypeConstant.PRODUCT_BACKLOG_ITEM_TYPE, TypeConstant.BUG_TYPE, TypeConstant.TASK_TYPE];

//@TODO: States should be fetched from the api
export const WORK_ITEM_STATES = [
    StateConstant.NEW_STATE,
    StateConstant.TO_DO_STATE,
    StateConstant.IN_PROGRESS_STATE,
    StateConstant.DONE_STATE,
    StateConstant.EXECUTING_STATE,
    StateConstant.TERMINATED_STATE,
    StateConstant.APPROVED_STATE,
    StateConstant.REMOVED_STATE,
    StateConstant.COMMITTED_STATE,
    StateConstant.DEFAULT_STATE
];

//@TODO: Colors should be fetched from the api
export const WORK_ITEM_STATE_COLORS: { [state: string]: string } = {
    [StateConstant.NEW_STATE]: "rgb(178, 178, 178)",
    [StateConstant.COMMITTED_STATE]: "#007acc",
    [StateConstant.IN_PROGRESS_STATE]: "#007acc",
    [StateConstant.EXECUTING_STATE]: "#A020F0",
    [StateConstant.TERMINATED_STATE]: "#6BB700",
    [StateConstant.APPROVED_STATE]: "rgb(178, 178, 178)",
    [StateConstant.REMOVED_STATE]: "rgba(218, 213, 208, 0.5)",
    [StateConstant.TO_DO_STATE]: "rgb(178, 178, 178)",
    [StateConstant.DONE_STATE]: "#339933",
    [StateConstant.DEFAULT_STATE]: "rgb(178, 178, 178)",
    [StateConstant.BLOCKED_STATE]: "rgb(230, 0, 23);"
};

//@TODO: Icons should be fetched from the api
export const WORK_ITEM_TYPE_ICON: { [type: string]: { iconName: string; color: string } } = {
    [TypeConstant.EPIC_TYPE]: { iconName: "CrownSolid", color: "rgb(224,108,0)" },
    [TypeConstant.FEATURE_TYPE]: { iconName: "Trophy", color: "rgb(119,59,147)" },
    [TypeConstant.BUG_TYPE]: { iconName: "LadybugSolid", color: "rgb(204, 41, 6)" },
    [TypeConstant.TASK_TYPE]: { iconName: "TaskSolid", color: "rgb(164, 136, 10)" },
    [TypeConstant.PRODUCT_BACKLOG_ITEM_TYPE]: { iconName: "PageListSolid", color: "rgb(0, 152, 199)" },
    "Default": { iconName: "WorkItem", color: "#605E5C" }
};

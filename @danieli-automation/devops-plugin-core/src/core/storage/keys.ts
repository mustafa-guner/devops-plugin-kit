/**
 * @description: Stores for user preferences using Key-Value Store abstraction.
 * Provides stores for backlog order, column preferences, dialog rows, and saved rows.
 * Utilizes createKVStore to create typed stores for specific storage keys.
 */

import { ScopeType } from "core/types/ScopeType";

export const STORAGE_KEYS = {
    columnPrefs: "crossTeamColumnPrefs",
    dialogRows: "crossTeamDialogRows",
    savedRows: "crossTeamSavedRows",
    crossTeamInstances: "crossTeamInstances",
    crossTeamDefaultInstance: "crossTeamDefaultInstance",
    personalOrder: "personalBacklogOrder",
    personalTaskOrder: "personalTaskOrder"
};

export const QUERY_KEYS = {
    prefs: "prefs",
    taskOrder: "taskOrder",
    columns: "columns",
    dialowRows: "dialogRows",
    instances: "instances",
    crossSprint: "cross-sprint",
    defaultInstancePref: "defaultInstancePref",
    backlogOrder: "backlogOrder" //workitem order
}

const SCOPE = process.env.SCOPE as ScopeType | undefined;
export const DEFAULT_SCOPE: ScopeType = SCOPE || "User";

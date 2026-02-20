/**
 * @description: Stores for user preferences using Key-Value Store abstraction.
 * Provides stores for backlog order, column preferences, dialog rows, and saved rows.
 * Utilizes createKVStore to create typed stores for specific storage keys.
 */

import { DefaultInstanceType } from "core/types/instance/DefaultInstanceType";
import { TaskOrderMapType } from "core/types/taskOrder/TaskOrderMapType";
import { WorkItemOrderMapType } from "core/types/workItemOrder/WorkItemOrderMapType";
import { CrossSprintInstanceMap } from "../types/instance/CrossSprintInstanceType";
import { createKVStore } from "./createStore";
import { STORAGE_KEYS } from "./keys";

//The scope is set as "Default" so all users see same JM-defined order
export const workItemOrderStore = createKVStore<WorkItemOrderMapType>(STORAGE_KEYS.personalOrder, "Default");
export const taskOrderStore = createKVStore<TaskOrderMapType>(STORAGE_KEYS.personalTaskOrder, "Default");
export const crossTeamInstancesStore = createKVStore<CrossSprintInstanceMap>(STORAGE_KEYS.crossTeamInstances, "Default");
export const defaultInstanceStore = createKVStore<DefaultInstanceType>(STORAGE_KEYS.crossTeamDefaultInstance, "User");

/**
 * @description: Stores for user preferences using Key-Value Store abstraction.
 * Provides stores for backlog order, column preferences, dialog rows, and saved rows.
 * Utilizes createKVStore to create typed stores for specific storage keys.
 */

import { createKVStore } from "./createStore";
import { STORAGE_KEYS } from "./keys";

export const backlogOrderStore = createKVStore<Array<{ id: number; order: number }>>(STORAGE_KEYS.personalOrder);
export const columnPrefsStore = createKVStore<{ order: string[]; visible: string[] }>(STORAGE_KEYS.columnPrefs);
export const dialogRowsStore = createKVStore<any[]>(STORAGE_KEYS.dialogRows);
export const savedRowsStore = createKVStore<any>(STORAGE_KEYS.savedRows);
/**
 * @description: Key-Value Store abstraction using Azure DevOps Data Manager.
 * Provides load and save methods for storing and retrieving data with specified scope.
 * Handles non-existent keys gracefully by returning undefined on load.
 * Uses default scope from configuration if none is provided.
 * Logs errors during save operations for debugging purposes.
 */

import { IExtensionDataManager, IExtensionDataService } from "azure-devops-extension-api";
import * as SDK from "azure-devops-extension-sdk";
import { KVStore } from "core/types/KVStoreType";
import { ScopeType } from "core/types/ScopeType";
import { DEFAULT_SCOPE } from "./keys";

export function createKVStore<T>(key: string, scopeType: ScopeType = DEFAULT_SCOPE): KVStore<T> {
    return {
        async load() {
            try {
                const manager = await getDataManager();
                return await manager.getValue(key, { scopeType }) as T | undefined;
            } catch (err: any) {
                if (err?.typeKey === "DocumentCollectionDoesNotExistException") {
                    return undefined;
                }
                if (String(err).includes("404")) return undefined;
                throw err;
            }
        },
        async save(value: T) {
            try {
                const manager = await getDataManager();
                await manager.setValue(key, value, { scopeType });
            } catch (err) {
                console.log(`CrateteKVStore: Error saving key ${key} with scope ${scopeType}`, err);
                throw err;
            }
        }
    };
}

//#region Private Functions

/**
 * @description: Azure DevOps Data Manager accessor.
 * Provides a function to get the extension data manager for storing and retrieving extension data.
 * Caches the manager instance for reuse.   
 * Handles SDK readiness and service retrieval.
 * Uses extension context to get the appropriate data manager.
 * @returns Promise resolving to IExtensionDataManager instance.
 */

let cachedManager: IExtensionDataManager | null = null;

async function getDataManager(): Promise<IExtensionDataManager> {
    if (cachedManager) return cachedManager;

    try { await SDK.ready(); } catch { }
    const extDataService: IExtensionDataService = await SDK.getService<IExtensionDataService>("ms.vss-features.extension-data-service");
    const accessToken = await SDK.getAccessToken();
    const { id: extensionId } = SDK.getExtensionContext();

    cachedManager = await extDataService.getExtensionDataManager(extensionId, accessToken);
    return cachedManager;
}
//#endregion

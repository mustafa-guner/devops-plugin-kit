/**
 * @description: Column Preference storage hooks using React Query.
 * Provides hooks for querying and mutating
 * Utilizes zustand stores for persistent storage and caching.
 * Ensures data consistency by updating the query cache on successful mutations.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "core/storage/keys";
import { CreateInstanceInput } from "core/types/instance/CreateInstanceInputType";
import { CrossSprintInstanceType } from "core/types/instance/CrossSprintInstanceType";
import { DefaultInstanceType } from "core/types/instance/DefaultInstanceType";
import { UpdateInstanceInput } from "core/types/instance/UpdateInstanceInputType";
import { createCrossSprintInstance, deleteCrossTeamInstance, loadAllInstances, updateCrossSprintInstance } from "../repositories/instance";
import { defaultInstanceStore } from "../stores";

/** Load all instances (for some picker UI later)
 *
 * Fetches all saved Cross Sprint instances.
 *
 * @returns React Query result containing the instances list.
 */
export function useCrossSprintInstancesQuery() {
    return useQuery({
        queryKey: [QUERY_KEYS.crossSprint, QUERY_KEYS.instances],
        queryFn: () => loadAllInstances(),
        staleTime: Infinity,
        cacheTime: 1,
    });
}

/** Create new instance
 *
 * Creates a new Cross Sprint instance and appends it to the cached instances list.
 *
 * @returns React Query mutation for creating an instance.
 */
export function useCreateCrossSprintInstance() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateInstanceInput) => createCrossSprintInstance(input),
        onSuccess: (created) => {
            qc.setQueryData<CrossSprintInstanceType[] | undefined>(
                [QUERY_KEYS.crossSprint, QUERY_KEYS.instances],
                (prev) => (prev ? [...prev, created] : [created])
            );
        },
    });
}

/** Update existing instance (e.g. add/remove teams)
 *
 * Updates an existing Cross Sprint instance, replaces it in the cached list,
 * and syncs the zustand `currentInstance` if it matches the updated item.
 *
 * @returns React Query mutation for updating an instance.
 */
export function useUpdateCrossTeamInstance() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (input: UpdateInstanceInput) => updateCrossSprintInstance(input),
        onSuccess: (updated) => {
            if (!updated) return;

            qc.setQueryData<CrossSprintInstanceType[] | undefined>(
                [QUERY_KEYS.crossSprint, QUERY_KEYS.instances],
                (prev) => prev?.map(i => i.id === updated.id ? updated : i) ?? [updated]
            );
        },
    });
}

/** Delete an instance
 *
 * Deletes an instance, removes it from the cached instances list,
 * clears related preference queries, and resets zustand `currentInstance`
 * if the deleted instance was selected. Also clears default instance preference
 * if it was pointing to the deleted instance.
 *
 * @returns React Query mutation for deleting an instance by id.
 */
export function useDeleteCrossTeamInstance() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (instanceId: string) => deleteCrossTeamInstance(instanceId),
        onSuccess: async (_, instanceId) => {
            qc.setQueryData<CrossSprintInstanceType[] | undefined>(
                [QUERY_KEYS.crossSprint, QUERY_KEYS.instances],
                (prev) => prev?.filter(i => i.id !== instanceId) ?? []
            );

            qc.removeQueries({ queryKey: [QUERY_KEYS.prefs, QUERY_KEYS.backlogOrder, instanceId] });

            try {
                const pref = await defaultInstanceStore.load();
                if (pref?.id === instanceId) {
                    await defaultInstanceStore.save({});
                    qc.setQueryData([QUERY_KEYS.crossSprint, QUERY_KEYS.defaultInstancePref], {});
                }
            } catch (e) {
                console.warn("Failed to clear default instance pref after delete:", e);
            }
        },
    });
}

//#region Default Instance Hook

/** Load default instance preference
 *
 * Loads the persisted default instance preference from storage.
 *
 * @returns React Query result containing the default instance preference.
 */
export function useDefaultInstanceQuery() {
    return useQuery({
        queryKey: [QUERY_KEYS.crossSprint, QUERY_KEYS.defaultInstancePref],
        queryFn: () => defaultInstanceStore.load(),
        staleTime: Infinity,
        cacheTime: Infinity,
    });
}

/** Save default instance preference
 *
 * Persists the default instance preference and updates the query cache.
 *
 * @param pref The default instance preference object to save.
 * @returns React Query mutation for saving the default preference.
 */
export function useSaveDefaultInstance() {
    const qc = useQueryClient();

    return useMutation({
        // always save an object, never null/undefined
        mutationFn: (pref: DefaultInstanceType) => defaultInstanceStore.save(pref),
        onSuccess: (_, pref) => {
            qc.setQueryData([QUERY_KEYS.crossSprint, QUERY_KEYS.defaultInstancePref], pref);
        },
    });
}

//#endregion

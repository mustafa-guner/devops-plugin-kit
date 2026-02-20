import { CreateInstanceInput } from "core/types/instance/CreateInstanceInputType";
import type { CrossSprintInstanceMap, CrossSprintInstanceType } from "core/types/instance/CrossSprintInstanceType";
import { UpdateInstanceInput } from "core/types/instance/UpdateInstanceInputType";
import type { WorkItemOrderMapType } from "core/types/workItemOrder/WorkItemOrderMapType";
import { crossTeamInstancesStore, defaultInstanceStore, workItemOrderStore } from "../stores";


/**
 * Load all stored Cross Sprint instances.
 *
 * Reads the instance map from storage and returns it as an array.
 *
 * @returns A list of instances, or an empty array if none exist.
 */
export async function loadAllInstances(): Promise<CrossSprintInstanceType[]> {
    const stored = await crossTeamInstancesStore.load();

    if (!stored) return [];

    return Object.values(stored);
}

/**
 * Load the default Cross Sprint instance.
 *
 * Reads the stored default instance preference, then looks up
 * the corresponding instance from all persisted instances.
 *
 * @returns The default Cross Sprint instance if defined and found,
 *          otherwise undefined.
 */
export async function loadDefaultInstance() {
    const defaultPref = await defaultInstanceStore.load();
    const allInstances = await loadAllInstances();

    if (!defaultPref?.id) return undefined;

    return allInstances.find((i) => i.id === defaultPref.id);
}

/**
 * Load a single Cross Sprint instance by id.
 *
 * Reads the instance map from storage, finds the instance,
 * and normalizes it (ensuring `owners` fallback behavior).
 *
 * @param id Instance id to load.
 * @returns The found instance (normalized) or undefined if not found.
 */
export async function loadInstanceById(id: string): Promise<CrossSprintInstanceType | undefined> {
    const stored = await crossTeamInstancesStore.load();
    if (!stored) return undefined;
    const inst = stored[id];
    return inst ? normalizeInstance(inst) : undefined;
}

/**
 * Create and persist a new Cross Sprint instance.
 *
 * Generates an id, sets timestamps, applies owners fallback,
 * and saves the new instance into the instance map in storage.
 *
 * @param input New instance fields.
 * @returns The created instance object.
 */
export async function createCrossSprintInstance(input: CreateInstanceInput): Promise<CrossSprintInstanceType> {
    const { name, description, org, createdBy, owners, projectTeamPairs, } = input;

    const now = new Date().toISOString();
    const id = crypto.randomUUID() ?? Math.random().toString(36).substring(2, 15);

    const instance: CrossSprintInstanceType = {
        id,
        name,
        description,
        org,
        createdBy,
        owners: owners && owners.length > 0 ? owners : [createdBy],
        projectTeamPairs,
        isDefault: false,
        createdAt: now,
        updatedAt: now,
    };

    const stored = await crossTeamInstancesStore.load();
    const current: CrossSprintInstanceMap = stored ?? {};

    const next: CrossSprintInstanceMap = {
        ...current,
        [id]: instance,
    };

    await crossTeamInstancesStore.save(next);

    return instance;
}

/**
 * Update an existing Cross Sprint instance.
 *
 * Reads the instance map, finds the target instance, and applies partial updates:
 * - Only provided fields override existing values.
 * - Always updates `updatedAt`.
 *
 * @param input Partial update payload containing the instance id and changed fields.
 * @returns The updated instance, or undefined if storage/instance is missing.
 */
export async function updateCrossSprintInstance(input: UpdateInstanceInput): Promise<CrossSprintInstanceType | undefined> {
    const stored = await crossTeamInstancesStore.load();
    if (!stored) return undefined;

    const { id, name, description, owners, projectTeamPairs, isDefault } = input;

    const existing = stored[id];
    if (!existing) return undefined;

    const updated: CrossSprintInstanceType = {
        ...existing,
        name: name ?? existing.name,
        description: description ?? existing.description,
        projectTeamPairs: projectTeamPairs ?? existing.projectTeamPairs,
        owners: owners ?? existing.owners,
        isDefault: isDefault ?? existing.isDefault,
        updatedAt: new Date().toISOString(),
    };

    const next: CrossSprintInstanceMap = {
        ...stored,
        [id]: updated,
    };

    await crossTeamInstancesStore.save(next);

    return updated;
}

/**
 * Delete a Cross Sprint instance and its related backlog order preferences.
 *
 * Removes the instance entry from the instances map.
 * Also removes any backlog order saved under the same instance id.
 *
 * @param instanceId Instance id to delete.
 * @returns Void.
 */
export async function deleteCrossTeamInstance(instanceId: string): Promise<void> {

    const instances = await crossTeamInstancesStore.load();
    if (instances && typeof instances === "object" && !Array.isArray(instances)) {
        const { [instanceId]: _, ...rest } = instances;
        await crossTeamInstancesStore.save(rest as CrossSprintInstanceMap);
    }

    const orders = await workItemOrderStore.load();

    if (Array.isArray(orders) || !orders) return;

    const { [instanceId]: __, ...restOrders } = orders as WorkItemOrderMapType;
    await workItemOrderStore.save(restOrders as WorkItemOrderMapType);
}


//#region Private Functions

/**
 * Normalizes a stored instance into a safe shape for consumers.
 *
 * Ensures `owners` is always present:
 * - If `owners` exists and has items, keep it.
 * - Otherwise fallback to `[createdBy]`.
 *
 * @param inst Raw instance object read from storage.
 * @returns Normalized CrossSprintInstanceType with guaranteed `owners`.
 */
function normalizeInstance(inst: any): CrossSprintInstanceType {
    return {
        ...inst,
        owners: inst.owners && inst.owners.length > 0
            ? inst.owners
            : [inst.createdBy],
    };
}

//#endregion
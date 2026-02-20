import { WorkItem, WorkItemErrorPolicy, WorkItemExpand } from "azure-devops-extension-api/WorkItemTracking";
import { witClient } from "core/azureClients";
import { AdoWorkItemType } from 'features/work-items/types/AdoWorkItemType';

/**
 * Fetches work items by their IDs within a project.
 * 
 * @param ids - Array of work item IDs to fetch
 * @param projectId - Optional project ID to scope the query
 * @param fields - Optional array of fields to retrieve for each work item
 * @param expand - Optional expansion options for the work items
 * @returns Promise resolving to an array of work items
 */
export async function fetchWorkItemsByIds(ids: number[], projectId?: string, fields?: string[], expand: WorkItemExpand = WorkItemExpand.All): Promise<AdoWorkItemType[]> {
    if (!ids || ids.length === 0) return [];

    const client = witClient();
    const uniqueIds = Array.from(new Set(ids));
    const BATCH_SIZE = 150;
    const result: AdoWorkItemType[] = [];

    const fieldsArg = expand !== WorkItemExpand.None ? undefined : fields;

    for (let i = 0; i < uniqueIds.length; i += BATCH_SIZE) {
        const slice = uniqueIds.slice(i, i + BATCH_SIZE);

        try {
            const batch = await client.getWorkItems(
                slice,
                projectId,
                fieldsArg,
                undefined,
                expand,
                WorkItemErrorPolicy.Omit
            );

            if (Array.isArray(batch)) {
                const cleaned = batch.filter((wi): wi is WorkItem => !!wi && typeof wi.id === "number" && !!wi.fields)
                result.push(...cleaned);
            }

        } catch (err) {
            console.error("[fetchWorkItemsByIds] failed batch", { projectId, slice }, err);
        }
    }
    return result;
}

/**
 * Fetches work item details by given id and project id
 * 
 * @param id - the id of the work item
 * @param project - the id of the related project
 * @param fields - the work items to select
 * @returns Promise resolving to the object of work item
 */
export async function fetchWorkItemById(id: number, project?: string, fields?: string[], expand: WorkItemExpand = WorkItemExpand.Relations) {
    const wit = witClient();
    const fieldsArg = expand !== WorkItemExpand.None ? undefined : fields;
    const workItem = await wit.getWorkItem(id, project, fieldsArg, undefined, expand);
    return workItem;
}

/**
 * Fetches child work items for a given parent work item within a project.
 * 
 * @param projectId - The ID of the project
 * @param parentId - The ID of the parent work item
 * @param fields - Optional array of fields to retrieve for each child work item
 * @param signal - Optional AbortSignal to cancel the request
 * @returns Promise resolving to an array of child work items
 * 
 */
export async function fetchChildren(projectId: string, parentId: number, fields?: string[], signal?: AbortSignal) {

    if (signal?.aborted) return [];

    const wit = witClient();
    const parent = await wit.getWorkItem(parentId, projectId, undefined, undefined, WorkItemExpand.Relations);
    const rels = parent.relations || [];
    const childIdArray: number[] = [];

    for (const r of rels) {
        if (signal?.aborted) return [];
        if (r.rel === "System.LinkTypes.Hierarchy-Forward") {
            const m = r.url?.match(/(\d+)$/);
            if (m) childIdArray.push(+m[1]);
        }
    }

    if (childIdArray.length === 0) return [];

    return fetchWorkItemsByIds(childIdArray, projectId, fields);
}

/**
 * Updates a work item with the specified changes within a project.
 *
 * @param taskId - The ID of the work item to update
 * @param changes - An array of change operations to apply to the work item
 * @param project - The project ID where the work item resides
 * @returns Promise resolving to the updated work item
 * 
 */
export async function updateWorkItem(taskId: number, changes: any[], project: string) {

    const wit = witClient();
    const wi = await wit.getWorkItem(taskId, project, undefined, undefined, WorkItemExpand.Fields);
    const currentRev = wi.rev;
    return wit.updateWorkItem(
        [
            { op: "test", path: "/rev", value: currentRev },
            ...changes
        ],
        taskId,
        project,
        false,
        false
    );
}

/**
 * Creates a new work item within a project, optionally linking it to a parent work item.
 * 
 * @param project - The project ID where the work item will be created
 * @param parentId - The ID of the parent work item, if any
 * @param fields - A record of fields to set on the new work item
 * @returns Promise resolving to the created work item
 * 
 */
export async function createWorkItem(project: string, parentId: number, fields: Record<any, any>) {
    const wit = witClient();
    const { title, state, iterationPath, areaPath, workItemType, parent } = fields;

    const patchDocument = [
        { op: "add", path: "/fields/System.Title", value: title ?? "New Task" },
        { op: "add", path: "/fields/System.State", value: state ?? "To Do" },
        { op: "add", path: "/fields/System.AreaPath", value: areaPath },
        { op: "add", path: "/fields/System.IterationPath", value: normalizeAndEscapeIterationPath(iterationPath) },
        { op: "add", path: "/fields/System.Parent", value: parent },
        //{ op: "add", path: "/fields/System.History", value: }
    ];

    if (parentId) {
        patchDocument.push({
            op: "add",
            path: "/relations/-",
            value: {
                rel: "System.LinkTypes.Hierarchy-Reverse",
                url: `vstfs:///WorkItemTracking/WorkItem/${parentId}`,
            },
        });
    }

    const result = await wit.createWorkItem(patchDocument, project, workItemType);

    return result;
}

/**
 * Deletes a work item within a project.
 * 
 * @param taskId - The ID of the work item to delete
 * @param project - The project ID where the work item resides
 * @returns Promise resolving to the deletion result
 * 
 */
export async function deleteWorkItem(taskId: number, project: string) {
    const wit = witClient();
    return wit.deleteWorkItem(taskId, project);
}

//#region Private Functions

/**
 * Normalize then escape backslashes so result is safe for Azure DevOps JSON payloads.
 * This is idempotent: calling it multiple times yields the same result.
 *
 * Examples at runtime (string contents):
 *  "JOB_CLIENTE1\\Sprint 5" -> "JOB_CLIENTE1\\\\Sprint 5"
 *  "JOB_CLIENTE1\Sprint 5"  -> "JOB_CLIENTE1\\\\Sprint 5"
 *
 * @param path Iteration path value.
 * @returns Normalized and escaped iteration path.
 */
function normalizeAndEscapeIterationPath(path: string) {
    if (path == null) return path;           // keep null/undefined as-is
    // Collapse any run of backslashes to a single backslash
    const collapsed = path.replace(/\\+/g, '\\');
    // Escape single backslashes for JSON payload (double them)
    return collapsed.replace(/\\/g, '\\\\');
}
//#endregion

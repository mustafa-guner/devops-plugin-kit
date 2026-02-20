import { getClient } from "azure-devops-extension-api";
import { WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking";

/**
 * Fetches the work item states for a given work item type within a project.
 * @description This function uses the Work Item Tracking REST client to retrieve
 * the states associated with the specified work item type in the given project.
 * 
 * @param projectName - The name of the project
 * @param workItemType - The work item type (e.g., 'Task', 'Bug')
 * @returns - A promise resolving to an array of work item states for the specified type
 */
export async function getWorkItemStates(projectName: string, workItemType: string) {
    const witClient = getClient(WorkItemTrackingRestClient);
    const typeInfo = await witClient.getWorkItemType(projectName, workItemType);

    // Map to a clean array for dropdowns
    return typeInfo.states.map((s) => ({
        id: s.name,
        text: s.name,
        color: s.color,
        category: s.category
    }));
}

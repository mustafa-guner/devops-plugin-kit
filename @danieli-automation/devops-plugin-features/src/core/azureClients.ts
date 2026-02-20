import { getClient } from "azure-devops-extension-api";
import { CoreRestClient } from "azure-devops-extension-api/Core";
import { GitRestClient } from "azure-devops-extension-api/Git";
import { GraphRestClient } from "azure-devops-extension-api/Graph";
import { WorkRestClient } from "azure-devops-extension-api/Work";
import { WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking";

export const coreClient = () => getClient(CoreRestClient);
export const witClient = () => getClient(WorkItemTrackingRestClient);
export const workClient = () => getClient(WorkRestClient);
export const gitClient = () => getClient(GitRestClient);
export const graphClient = () => getClient(GraphRestClient);
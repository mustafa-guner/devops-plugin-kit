import { WorkItemRelation } from "azure-devops-extension-api/WorkItemTracking";

export type AdoWorkItemType = {
    id: any,
    tempId?: string
    fields: { [key: string]: any; }
    _links?: any;
    url?: string;
    order?: number;
    displayOrder?: string;
    rev?: number;
    multiLineFields?: { [k: string]: string[] };
    relations?: WorkItemRelation[];
    isNewTask?: boolean;
    parentWorkItem?: AdoWorkItemType;
    isFaded?: boolean | undefined;
    _children?: AdoWorkItemType[];
};

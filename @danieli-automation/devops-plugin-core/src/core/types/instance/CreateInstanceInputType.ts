import { SelectedProjectType } from "core/types/SelectedProjectType";

export type CreateInstanceInput = {
    name: string;
    description?: string;
    org: string;
    createdBy: string;        // current user id/descriptor
    owners?: string[];        // if omitted, default [createdBy]
    projectTeamPairs: SelectedProjectType[];
};
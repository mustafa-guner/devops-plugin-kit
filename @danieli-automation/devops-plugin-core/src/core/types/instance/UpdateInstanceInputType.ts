import { SelectedProjectType } from "core/types/SelectedProjectType";

export type UpdateInstanceInput = {
    id: string;
    name?: string;
    description?: string;
    projectTeamPairs?: SelectedProjectType[];
    owners?: string[];
    isDefault?: boolean;
};
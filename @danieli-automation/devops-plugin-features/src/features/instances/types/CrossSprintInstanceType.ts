import { SelectedProjectType } from "features/teams/types/SelectedProjectType";

export type CrossSprintInstanceType = {
    id: string;
    name: string;
    description?: string;

    org: string;
    createdBy: any;
    owners: string[];

    projectTeamPairs: SelectedProjectType[];

    createdAt: string;
    updatedAt: string;

    isDefault?: boolean;
};

export type CrossSprintInstanceMap = Record<string, CrossSprintInstanceType>;
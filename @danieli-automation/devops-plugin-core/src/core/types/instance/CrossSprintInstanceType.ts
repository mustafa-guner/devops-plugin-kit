import { SelectedProjectType } from "core/types/SelectedProjectType";

export type CrossSprintInstanceType = {
    id: string;                      // GUID/UUID
    name: string;
    description?: string;

    org: string;                     // dev.azure.com/{org}
    createdBy: any;               // user identifier (UPN/email or descriptor)
    owners: string[];                // list of JMs (can contain createdBy)

    projectTeamPairs: SelectedProjectType[];  // N project/team pairs

    createdAt: string;
    updatedAt: string;

    isDefault?: boolean;             // whether this instance is the default one for the whole TEAM
};

export type CrossSprintInstanceMap = Record<string, CrossSprintInstanceType>;
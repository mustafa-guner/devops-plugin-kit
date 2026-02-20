export type DefaultInstanceType = {
    id?: string;                      // GUID/UUID
    name?: string;
    description?: string;

    org?: string;                     // dev.azure.com/{org}
    createdBy?: string;               // user identifier (UPN/email or descriptor)
    owners?: string[];                // list of JMs (can contain createdBy)

    createdAt?: string;
    updatedAt?: string;
}
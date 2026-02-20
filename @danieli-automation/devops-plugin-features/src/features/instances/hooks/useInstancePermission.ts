import { useUIStore } from "app/stores/useUIStore";
import { GraphGroup } from "azure-devops-extension-api/Graph";
import { graphClient } from "core/azureClients";
import { useInstanceStore } from "features/instances/stores/useInstanceStore";
import * as React from "react";

type RoleState = {
    isAdmin: boolean;
    isJM: boolean;
    groups: string[];
    loading: boolean;
};

/**
 * Centralized permission logic for instances.
 * - canReorder = true  -> user can drag & drop backlog order
 * - canReorder = false -> instance is active and user is NOT a JM
 */
export function useInstancePermission() {
    const { currentInstance } = useInstanceStore();
    const { currentUser } = useUIStore();
    const isInstanceMode = !!currentInstance?.id;

    const [roles, setRoles] = React.useState<RoleState>({
        isAdmin: false,
        isJM: false,
        groups: [],
        loading: false,
    });

    /*React.useEffect(() => {
        if (!currentUser) return;

        let mounted = true;

        (async () => {
            const result = await resolveUserRoles(currentUser);
            if (mounted) setRoles({ ...result, loading: false });
        })();

        return () => {
            mounted = false;
        };
    }, [currentUser]);*/

    // Owner logic is **instance-specific**

    const canEditInstance = React.useMemo(() => {
        if (!isInstanceMode || !currentUser) return false;
        const currentDescriptor = currentUser?.descriptor;
        const createdByDescriptor = currentInstance.createdBy?.descriptor;
        return currentInstance.createdBy.id === currentUser.id ||
            (!!currentDescriptor && createdByDescriptor === currentDescriptor);
    }, [isInstanceMode, currentInstance, currentUser]);

    const canReorder = React.useMemo(() => {
        if (!isInstanceMode) return true; // Personal Board Mode -> can reorder
        const currentId = currentUser?.id;
        const currentDescriptor = currentUser?.descriptor;
        const isOwner =
            currentInstance.createdBy.id === currentId ||
            (!!currentDescriptor && currentInstance.createdBy?.descriptor === currentDescriptor);

        const isInOwners =
            (!!currentId && currentInstance.owners.includes(currentId)) ||
            (!!currentDescriptor && currentInstance.owners.includes(currentDescriptor));

        return isInOwners || isOwner;
    }, [isInstanceMode, currentInstance, currentUser]);

    return {
        isInstanceMode,
        canEditInstance,  //roles.isAdmin || roles.isJM || isInstanceOwner,
        canReorder,
        currentUser,
        loading: roles.loading,
        groups: roles.groups,
        /*
        ----------------------------------------------------------------------------------------- 
        @IMPORTANT: as SPM-HUB does not have public api and endpoint to verify the permissions,
         we are going to bypass the permissions for now (meeting: 28.11.2025 - w/Luca)
        ----------------------------------------------------------------------------------------- 
        */
        isAdmin: true,//roles.isAdmin,
        isJM: true, // roles.isJM,
        canCreateInstance: true, //roles.isAdmin || roles.isJM
    };
}

//#region Private Functions
async function resolveUserRoles(user: any) {
    try {
        const descriptor = user.descriptor;
        if (!descriptor) {
            return { isAdmin: false, isJM: false, groups: [] as string[] };
        }
        const gClient = graphClient();
        const memberships = await gClient.listMemberships(descriptor);

        const roles = {
            isAdmin: false,
            isJM: false,
            groups: [] as string[],
        };

        for (const m of memberships) {
            const group = await gClient.getGroup(m.containerDescriptor) as GraphGroup;
            const name = group?.displayName?.toLowerCase() ?? "";

            roles.groups.push(name);

            if (name.includes("project administrators") || name.includes("collection administrators")) {
                roles.isAdmin = true;
            }

            if (name.includes("jm") || name.includes("owner")) {
                roles.isJM = true;
            }
        }

        return roles;
    } catch (err) {
        console.warn("resolveUserRoles error:", err);
        return { isAdmin: false, isJM: false, groups: [] };
    }
}
//#endregion

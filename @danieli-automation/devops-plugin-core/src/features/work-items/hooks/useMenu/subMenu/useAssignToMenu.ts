import { useIterationStore } from "features/iterations/stores/useIterationStore";
import { getCurrentTeamMembers } from "features/teams/api/users";
import { useProjectStore } from "features/teams/stores/useProjectStore";
import { TeamMember } from "features/teams/types/TeamMemberType";
import FieldConstant from "features/work-items/constants/FieldConstant";
import { AdoWorkItemType } from "features/work-items/types/AdoWorkItemType";
import * as React from "react";
import { WorkItemStoreKeyConstant } from "src/app/constants/StoreKeyConstant";
import Helper from "src/app/utils/column";
import { getCurrentUser } from "src/app/utils/global";
import { getChildrenQueryKey } from "src/app/utils/queryKey";
import { useUpdateWorkItemData } from "../../useData/useUpdateWorkItemData";

export function useAssignToMenu(enableAssignTo: boolean) {
    const { selectedProjects } = useProjectStore();
    const { selectedIteration, currentIteration } = useIterationStore();
    const updateFields = useUpdateWorkItemData();

    const [members, setMembers] = React.useState<TeamMember[] | null>(null);
    const [membersLoading, setMembersLoading] = React.useState(false);

    const ensureMembersLoaded = React.useCallback(
        async (wi: AdoWorkItemType) => {
            if (!enableAssignTo || membersLoading || (members && members.length)) return;

            const teamProject = wi?.fields?.[FieldConstant.WORK_ITEM_FIELD_TEAM_PROJECT];
            if (!teamProject) {
                setMembers([]);
                return;
            }

            try {
                setMembersLoading(true);
                const fetched = await getCurrentTeamMembers(teamProject, selectedProjects);

                const normalized: TeamMember[] = (fetched ?? []).map((m) => ({
                    id: m.uniqueName ?? m.descriptor ?? m.displayName,
                    descriptor: m.descriptor,
                    displayName: m.displayName,
                    uniqueName: m.uniqueName ?? "",
                    imageUrl: m.imageUrl,
                }));

                const currentUser = await getCurrentUser();
                const currentLogin = (currentUser.name || "").toLowerCase();
                const currentDescriptor = (currentUser.descriptor || "").toLowerCase();

                // check if current user is in the fetched list
                const exists = fetched.some((m) => {
                    const memberLogin = (m.uniqueName || "").toLowerCase();
                    const memberDescriptor = (m.descriptor || "").toLowerCase();
                    return (
                        (memberLogin && memberLogin === currentLogin) ||
                        (memberDescriptor && memberDescriptor === currentDescriptor)
                    );
                });

                //if current user is available and does not exist in the fetched list add manually
                if (!exists && currentUser) {
                    normalized.unshift({
                        id: currentUser.id,
                        descriptor: currentUser.descriptor,
                        displayName: currentUser.displayName || currentUser.name || "Me",
                        uniqueName: currentUser.name,
                        imageUrl: currentUser.imageUrl || "",
                    } as TeamMember);
                }

                setMembers(normalized);
            } catch {
                setMembers([]);
            } finally {
                setMembersLoading(false);
            }
        },
        [enableAssignTo, membersLoading, members, selectedProjects]
    );

    const handleAssign = React.useCallback(
        async (workItem: AdoWorkItemType, newMember: TeamMember | null) => {
            const project = workItem?.fields?.[FieldConstant.WORK_ITEM_FIELD_TEAM_PROJECT];
            const parentId = Number(workItem.fields?.[FieldConstant.WORK_ITEM_FIELD_PARENT] ?? 0);

            if (!project || !workItem.id) return;

            const isUnassigned = !newMember || newMember.id === "";
            const serverAssignedTo = isUnassigned ? "" : (newMember.uniqueName || newMember.displayName);
            const optimisticAssignedTo = isUnassigned ? null : newMember;

            // Define the Query Keys that is to be updated.
            const childFields = Helper.getColumnFields();
            const childrenKey = getChildrenQueryKey(project, parentId, childFields);

            updateFields.mutate({
                workItemId: workItem.id,
                project,
                queryKeys: [childrenKey],
                fieldUpdates: {
                    [FieldConstant.WORK_ITEM_FIELD_ASSIGNED_TO]: serverAssignedTo,
                },
                optimisticFieldUpdates: {
                    [FieldConstant.WORK_ITEM_FIELD_ASSIGNED_TO]: optimisticAssignedTo,
                },
                storeKeys: [WorkItemStoreKeyConstant.childrenWorkItems, WorkItemStoreKeyConstant.workItems],
                storeIteration: selectedIteration ?? currentIteration ?? undefined,
            });

        },
        [updateFields, selectedIteration, currentIteration]
    );

    return { members, membersLoading, ensureMembersLoaded, handleAssign };
}

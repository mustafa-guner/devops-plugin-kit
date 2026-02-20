import { GraphMember } from "azure-devops-extension-api/Graph";
import { AvatarSize } from "azure-devops-extension-api/Profile/Profile";
import { coreClient, graphClient } from "core/azureClients";
import { SelectedProjectType } from "features/teams/types/SelectedProjectType";
import { UserSearchResultType } from "features/teams/types/UserSearchResultType";
import { getProjectAndTeamIds } from "./projects";

/**
 * Fetches current team members for a given team project and selected projects.
 * 
 * @param teamProjectName 
 * @param selectedProjects 
 * @param areaPath 
 * @returns Promise resolving to an array of team member information
 * 
 */
export async function getCurrentTeamMembers(teamProjectName: string, selectedProjects: SelectedProjectType[], areaPath?: string) {
    const core = coreClient();
    const ids = await getProjectAndTeamIds(teamProjectName, selectedProjects, areaPath);
    let members = await core.getTeamMembersWithExtendedProperties(ids.projectId, ids.teamId);

    /*if (!isAdminIncluded) {
        members = members.filter(m => !m.isTeamAdmin);
    }*/

    return members.map(m => ({
        descriptor: m.identity?.descriptor,
        displayName: m.identity?.displayName ?? "",
        uniqueName: m.identity?.uniqueName,
        imageUrl: m.identity?.imageUrl,
    }));
}

/**
 * Fetches the avatar image for a given Azure DevOps user.
 *
 * Retrieves the user's avatar using their graph descriptor and
 * allows specifying the desired avatar size.
 *
 * @param descriptor Azure DevOps graph descriptor of the user.
 * @param size Optional avatar size (defaults to small).
 * @returns Promise resolving to the user's avatar image.
 */
export async function getDefaultUserAvatar(descriptor?: string, size = AvatarSize.Small as AvatarSize) {
    if (!descriptor) return;
    return await graphClient().getAvatar(descriptor, size);
}

/**
 * Searches users across the whole organization for typeahead scenarios.
 *
 * Uses Graph client `querySubjects` with `subjectKind: ["User"]`.
 * Azure DevOps Graph currently returns results in batches (typically up to 100).
 * 
 * @param query searched value
 * @param maxResults desired max result constant
 * @returns Promise resolving to an object containing user fields
 */
export async function searchUsersInOrganization(query: string, maxResults = 100): Promise<UserSearchResultType[]> {
    const term = query.trim();
    if (!term) return [];

    const subjects = await graphClient().querySubjects({
        query: term,
        subjectKind: ["User"],
        scopeDescriptor: undefined as unknown as string,
    });

    return (subjects as GraphMember[])
        .filter(subject => (subject.subjectKind || "").toLowerCase() === "user")
        .slice(0, maxResults)
        .map(subject => ({
            id: subject.descriptor,
            descriptor: subject.descriptor,
            displayName: subject.displayName || "",
            uniqueName: subject.principalName || undefined,
            mailAddress: subject.mailAddress || undefined,
            origin: subject.origin || undefined,
            originId: subject.originId || undefined,
        }));
}

/**
 * Resolves user ids/descriptors to user profiles for display purposes.
 *
 * This is used when persisted owner ids are already known, but we need
 * display names for UI rendering.
 * 
 * @params userIds list of user ids to get details
 * @returns Promise resolving to an object containing user details
 */
export async function getUsersByIds(userIds: string[]): Promise<UserSearchResultType[]> {
    const ids = Array.from(new Set((userIds ?? []).map(id => (id || "").trim()).filter(Boolean)));
    if (ids.length === 0) return [];

    const graph = graphClient();

    const resolved = await Promise.all(ids.map(async (userId) => {
        let subject: GraphMember | undefined;

        // Case 1: id is already a graph descriptor.
        try {
            const byDescriptor = await graph.getUser(userId) as GraphMember;
            if ((byDescriptor?.subjectKind || "").toLowerCase() === "user") {
                subject = byDescriptor;
            }
        } catch {
            // noop
        }

        if (!subject) return undefined;

        return {
            id: subject.descriptor,
            descriptor: subject.descriptor,
            displayName: subject.displayName || userId,
            uniqueName: subject.principalName || undefined,
            mailAddress: subject.mailAddress || undefined,
            origin: subject.origin || undefined,
        } as UserSearchResultType;
    }));

    return resolved.filter(Boolean) as UserSearchResultType[];
}

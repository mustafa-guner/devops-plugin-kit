import { CrossSprintInstanceType } from "core/types/instance/CrossSprintInstanceType";
import { TeamMember } from "features/teams/types/TeamMemberType";

/**
 * Checks whether a user is owner-level for the instance (owner list or creator).
 *
 * @param inst Cross-sprint instance.
 * @param user Current user.
 * @returns `true` when user is owner or creator.
 */
export function isInstanceOwner(inst: CrossSprintInstanceType, user: TeamMember) {
    const uid = user?.id;
    const descriptor = user?.descriptor;
    if (!uid && !descriptor) return false;

    const inOwners = (!!uid && inst.owners?.includes(uid)) || (!!descriptor && inst.owners?.includes(descriptor));

    return inOwners || isInstanceCreator(inst, user);
}

/**
 * Checks whether an instance is explicitly shared with a user but not created by them.
 *
 * @param inst Cross-sprint instance.
 * @param user Current user.
 * @returns `true` when user is in owners list and is not creator.
 */
export function isInstanceSharedWithMe(inst: CrossSprintInstanceType, user: TeamMember) {
    const uid = user?.id;
    const descriptor = user?.descriptor;
    if (!uid && !descriptor) return false;

    const inOwners =
        (!!uid && inst.owners?.includes(uid)) ||
        (!!descriptor && inst.owners?.includes(descriptor));

    return inOwners && !isInstanceCreator(inst, user);
}

/**
 * Checks whether a user is the creator of the given instance.
 *
 * @param inst Cross-sprint instance.
 * @param user Current user.
 * @returns `true` when created-by identity matches user id or descriptor.
 */
export function isInstanceCreator(inst: CrossSprintInstanceType, user: TeamMember) {
    const uid = user?.id;
    const descriptor = user?.descriptor;

    return (
        (!!uid && inst.createdBy?.id === uid) ||
        (!!descriptor && inst.createdBy?.descriptor === descriptor)
    );
}

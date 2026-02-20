import { WorkItemRelation } from "azure-devops-extension-api/WorkItemTracking";
import { PRMergeStatus, PRReviewVote, PRStatus } from "features/pull-requests/enums/PREnum";
import { PullRequestType } from "features/pull-requests/types/PullRequestType";

/**
 * Represents the aggregated, high-level outcome of a pull request.
 * - `success` → PR is completed, merged successfully, and has at least one approval.
 * - `failed`  → PR is blocked due to merge failure or an explicit rejection.
 * - `waiting` → PR is still in progress or awaiting required conditions.
 */
type OverallStatusType = "success" | "failed" | "waiting";

/**
 * Computes the overall status of a pull request based on its merge state,
 * completion status, and reviewer votes.
 *
 * Evaluation rules:
 * - Returns `failed` if:
 *   - The merge status indicates conflicts, policy rejection, or failure, OR
 *   - Any reviewer has explicitly rejected the pull request.
 * - Returns `success` if:
 *   - The pull request is completed,
 *   - The merge succeeded, AND
 *   - At least one reviewer has approved (with or without suggestions).
 * - Returns `waiting` in all other cases.
 *
 * @param pullRequest The pull request object to evaluate.
 * @returns The derived overall pull request status.
 */
export function getPullRequestOverallStatus(pullRequest: PullRequestType): OverallStatusType {
    const status = pullRequest.status;
    const mergeStatus = pullRequest.mergeStatus;
    const reviewers = pullRequest.reviewers ?? [];

    const anyRejected = reviewers.some(r => r?.vote === PRReviewVote.Rejected);

    const mergeFailed =
        mergeStatus === PRMergeStatus.Conflicts ||
        mergeStatus === PRMergeStatus.Failed ||
        mergeStatus === PRMergeStatus.RejectedByPolicy;

    const anyApproved = reviewers.some(
        r => r?.vote === PRReviewVote.Approved || r?.vote === PRReviewVote.ApprovedWithSuggestions
    );

    if (mergeFailed || anyRejected) return "failed";

    const isCompleted = status === PRStatus.Completed;
    const isMergeSucceeded = mergeStatus === PRMergeStatus.Succeeded;

    if (isCompleted && isMergeSucceeded && anyApproved) return "success";

    return "waiting";
}

/**
 * Extracts pull request relations from a work item's relations array.
 *
 * Azure DevOps represents linked pull requests as `ArtifactLink` relations
 * with a well-known Git pull request artifact URL prefix.
 *
 * @param relations The full list of work item relations.
 * @returns A filtered list containing only pull request relations.
 */
export function getRelatedPullRequests(relations?: WorkItemRelation[]): WorkItemRelation[] {
    if (!relations?.length) return [];

    const PR_ARTIFACT_PREFIX = "vstfs:///Git/PullRequestId/";

    return relations.filter(
        (rel) =>
            rel.rel === "ArtifactLink" &&
            rel.url?.includes(PR_ARTIFACT_PREFIX)
    );
}

/**
 * Resolves a numeric pull request review vote into a human-readable label.
 *
 * This is typically used for UI display of reviewer states.
 *
 * @param vote The numeric review vote value.
 * @returns A user-friendly string describing the vote.
 */
export function resolvePullRequestReviewVote(vote: number): string {
    switch (vote) {
        case PRReviewVote.Approved:
            return "Approved";
        case PRReviewVote.ApprovedWithSuggestions:
            return "Approved with Suggestions";
        case PRReviewVote.NoVote:
            return "No Vote";
        case PRReviewVote.WaitingForAuthor:
            return "Waiting for Author";
        case PRReviewVote.Rejected:
            return "Rejected";
        default:
            return "Unknown";
    }
}

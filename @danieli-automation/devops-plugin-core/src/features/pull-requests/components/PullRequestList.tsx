import LoadingSpinner from "app/components/LoadingSpinner";
import { PullRequestType } from "features/pull-requests/types/PullRequestType";
import * as React from "react";
import { PullRequestListItem } from "./PullRequestListItem";

type Props = {
    pullRequests: Array<PullRequestType>;
    isLoadingPrs?: boolean;
    setShowPullRequestPanel: React.Dispatch<React.SetStateAction<{
        isOpen: boolean;
        pullRequest: PullRequestType | null;
    }>>;
    showPRs: boolean;
}

export function PullRequestList({ pullRequests, isLoadingPrs, setShowPullRequestPanel, showPRs }: Props) {
    if (!showPRs) return null;
    return (
        <div className="tb-card-pr-list">
            {pullRequests.map((pullRequest) => (
                <PullRequestListItem key={pullRequest.pullRequestId}
                    pullRequest={pullRequest}
                    seeDetails={setShowPullRequestPanel} />
            ))}

            {isLoadingPrs && (<LoadingSpinner label="Loading pull requests..." />)}
        </div>
    )
}

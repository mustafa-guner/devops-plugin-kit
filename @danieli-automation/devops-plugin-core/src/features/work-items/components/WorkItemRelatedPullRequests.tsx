import { Button } from "azure-devops-ui/Button";
import { PRMergeStatus } from "features/pull-requests/enums/PREnum";
import { PullRequestType } from "features/pull-requests/types/PullRequestType";
import { AdoWorkItemType } from "features/work-items/types/AdoWorkItemType";
import * as React from "react";
import { PullRequestDetailsPanel } from "../../pull-requests/components/PullRequestDetailsPanel";
import { PullRequestList } from "../../pull-requests/components/PullRequestList";

type Props = {
    pullRequests: Array<PullRequestType>;
    isLoadingPrs?: boolean;
    parent: AdoWorkItemType;
}

export function WorkItemRelatedPullRequests({ pullRequests, isLoadingPrs, parent }: Props) {
    const [showPRs, setShowPRs] = React.useState(false);
    const [showPullRequestPanel, setShowPullRequestPanel] = React.useState({
        isOpen: false,
        pullRequest: null as PullRequestType | null
    });

    if (!pullRequests || pullRequests.length === 0) return null;

    return (
        <div>
            <Button
                primary
                iconProps={{ iconName: showPRs ? "ChevronUp" : "ChevronDown" }}
                onClick={() => setShowPRs(!showPRs)} className="tb-card-expand-pr-list" >
                {showPRs ? "Hide" : "Show"} Pull Requests ({pullRequests.length})
            </Button>

            <PullRequestList
                pullRequests={pullRequests}
                isLoadingPrs={isLoadingPrs}
                setShowPullRequestPanel={setShowPullRequestPanel}
                showPRs={showPRs} />

            {showPullRequestPanel &&
                <PullRequestDetailsPanel
                    parent={parent}
                    pullRequest={showPullRequestPanel.pullRequest}
                    onDismiss={() => setShowPullRequestPanel({ isOpen: false, pullRequest: null })}
                />
            }
        </div>
    );
}

import { Avatar } from "app/components/Avatar";
import { Status, Statuses, StatusSize } from "azure-devops-ui/Status";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { PRReviewVote } from "features/pull-requests/enums/PREnum";
import { resolvePullRequestReviewVote } from "features/pull-requests/utils/pullRequest";
import * as React from "react";

export function PullRequestReviewerListItem({ reviewer }: any) {
    return (
        <div key={reviewer.displayName} className="tb-panel-reviewer-item">
            <Tooltip text={resolvePullRequestReviewVote(reviewer.vote)}>
                <Status
                    {...reviewer.vote >= PRReviewVote.Approved ? Statuses.Success :
                        reviewer.vote === PRReviewVote.NoVote ? Statuses.Warning : Statuses.Failed}
                    key={resolvePullRequestReviewVote(reviewer.vote)}
                    size={StatusSize.l}
                    className="tb-panel-reviewer-vote-icon"
                />
            </Tooltip>
            <Avatar person={reviewer} showName={true} />
            <span className="tb-panel-reviewer-vote">
                ({resolvePullRequestReviewVote(reviewer.vote)})
            </span>
        </div>
    )
}
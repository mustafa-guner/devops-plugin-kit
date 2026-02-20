import { Avatar } from "app/components/Avatar";
import { Icon } from "azure-devops-ui/Icon";
import { Status, Statuses, StatusSize } from "azure-devops-ui/Status";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { PullRequestType } from "features/pull-requests/types/PullRequestType";
import { getPullRequestOverallStatus } from "features/pull-requests/utils/pullRequest";
import * as React from "react";

type Props = {
    pullRequest: PullRequestType;
    seeDetails: (isOpen: { isOpen: boolean; pullRequest: PullRequestType | null }) => void
}

export function PullRequestListItem({ pullRequest, seeDetails }: Props) {
    return (
        <div className="tb-card-pr-link" onClick={() => seeDetails({ isOpen: true, pullRequest: pullRequest })}>
            <div className="tb-card-pr-status-icon">
                <Avatar person={pullRequest.createdBy} showName={false} />
                <PRStatusBadge pullRequest={pullRequest} />
            </div>

            <Tooltip text={pullRequest.title}>
                <span className="tb-card-pr-title">
                    {pullRequest.title}
                </span>
            </Tooltip>

            <Icon iconName="ChevronRight" />
        </div>
    )
}

//#region Private Functions
function PRStatusBadge({ pullRequest }: { pullRequest: PullRequestType }) {
    const overallStatus = getPullRequestOverallStatus(pullRequest);

    const view = {
        success: { ...Statuses.Success, key: "success" },
        failed: { ...Statuses.Failed, key: "failed" },
        waiting: { ...Statuses.Waiting, key: "waiting" },
    }[overallStatus];

    return <Status {...view} size={StatusSize.m} className="floating-pr-status" />;
}

//#endregion
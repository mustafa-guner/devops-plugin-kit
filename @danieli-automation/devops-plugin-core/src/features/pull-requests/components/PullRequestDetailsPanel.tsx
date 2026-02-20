import { Avatar } from "app/components/Avatar";
import { Card } from "azure-devops-ui/Card";
import { Panel } from "azure-devops-ui/Panel";
import { Pill, PillSize, PillVariant } from "azure-devops-ui/Pill";
import { PRStatus } from "features/pull-requests/enums/PREnum";
import { PullRequestType } from "features/pull-requests/types/PullRequestType";
import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { resolveOrgAndProjectByWorkItem } from "src/app/utils/global";
import { PullRequestReviewersList } from "./PullRequestReviewerList";

export function PullRequestDetailsPanel({ pullRequest, onDismiss, parent }: { parent: any, pullRequest?: PullRequestType | null, onDismiss: () => void }) {

    if (!pullRequest) return null;

    const { title, pullRequestId, status, targetRefName, sourceRefName, description, reviewers } = pullRequest;
    const prStatus = PullRequestStatusResolver(status);
    const branchName = sourceRefName.replace("refs/heads/", "");
    const destinationBranch = targetRefName.replace("refs/heads/", "");

    const requiredReviewers = reviewers.filter(r => r.isRequired);
    const optionalReviewers = reviewers.filter(r => !r.isRequired);
    const { org, project } = resolveOrgAndProjectByWorkItem(parent);

    return (
        <Panel
            onDismiss={() => onDismiss()}
            titleProps={{ text: title }}
            descriptionItem={
                <span>
                    merge <strong>{branchName}</strong> into <strong>{destinationBranch}</strong>
                </span>
            }
            footerButtonProps={[
                { text: "Cancel", onClick: () => onDismiss() },
                {
                    text: "Visit", primary: true, onClick: () => {
                        const { repository, pullRequestId } = pullRequest;
                        const webUrl = `https://dev.azure.com/${org}/${project}/_git/${repository.name}/pullrequest/${pullRequestId}`;
                        window.open(webUrl, "_blank");
                    },
                }
            ]}
        >
            <div className="tb-panel-content" >
                <div className="tb-panel-header">
                    <Pill size={PillSize.regular} className={`tb-panel-header-item 
                        ${status == PRStatus.Active ? 'active' :
                            status == PRStatus.Completed ? 'completed'
                                : ''}`} variant={PillVariant.colored}>
                        {prStatus}
                    </Pill>
                    <span className="tb-panel-header-item">!{pullRequestId}</span>
                    <div className="tb-panel-header-item">
                        <Avatar person={pullRequest.createdBy} showName={true} />
                    </div>
                </div>
                <div className="tb-panel-body">
                    <Card className="tb-panel-section-card">
                        {description && (
                            <div className="tb-panel-section">
                                <h3>Description</h3>
                                <ReactMarkdown className="md" remarkPlugins={[remarkGfm]}>
                                    {description}
                                </ReactMarkdown>
                            </div>
                        )}
                    </Card>

                    {reviewers.length > 0 && (
                        <div className="tb-panel-reviewers">
                            <h3>Reviewers</h3>
                            {<PullRequestReviewersList reviewers={requiredReviewers} isRequired={true} />}
                            {<PullRequestReviewersList reviewers={optionalReviewers} isRequired={false} />}
                        </div>
                    )}
                </div>
            </div>
        </Panel>
    )
}


//#endregion Private Functions
function PullRequestStatusResolver(status: number): string {
    switch (status) {
        case PRStatus.NotSet:
            return "Not Set";
        case PRStatus.Active:
            return "Active";
        case PRStatus.Abandoned:
            return "Abandoned";
        case PRStatus.Completed:
            return "Completed";
        default:
            return "Unknown";
    }
}
//#endregion
import * as React from "react";
import { PullRequestReviewerListItem } from "./PullRequestReviewerListItem";

export function PullRequestReviewersList({ reviewers, isRequired }: {
    isRequired?: boolean;
    reviewers: Array<{
        displayName: string;
        imageUrl?: string;
        vote: number;
    }>
}) {
    return (
        <>
            <p>{isRequired ? 'Required' : 'Optional'}</p>
            <div className="tb-panel-reviewer-list">
                {reviewers.length === 0 && (
                    <div className="text-center">No {isRequired ? 'Required' : 'Optional'} reviewers</div>
                )}
                {reviewers.length > 0 && reviewers.map((reviewer) => (
                    <PullRequestReviewerListItem key={reviewer.displayName} reviewer={reviewer} />
                ))}
            </div>
        </>

    )
};
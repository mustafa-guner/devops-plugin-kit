export type PullRequestType = {
    pullRequestId: number;
    title: string;
    url: string;
    status: number;
    codeReviewId: number;
    createdBy: {
        displayName: string;
        imageUrl?: string;
    },
    creationDate: string;
    description: string;
    reviewers: Array<{
        displayName: string;
        imageUrl?: string;
        vote: number;
        isRequired?: boolean;
    }>;
    repository: {
        name: string;
        url: string;
    };
    mergeStatus: number;
    supportsIterations: boolean;
    sourceRefName: string;
    targetRefName: string;
    lastMergeSourceCommit: {
        commitId: string;
        url: string;
        comment: string;
        committer: {
            displayName: string;
            imageUrl?: string;
        };
        author: {
            displayName: string;
            imageUrl?: string;
        };
    };
}
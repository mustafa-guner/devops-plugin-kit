enum PRStatus {
    NotSet = 0,
    Active = 1,
    Abandoned = 2,
    Completed = 3
}

enum PRReviewVote {
    Approved = 10,
    ApprovedWithSuggestions = 5,
    NoVote = 0,
    WaitingForAuthor = -5,
    Rejected = -10
}

enum PRMergeStatus {
    NotSet = 0,
    Queued = 1,
    Conflicts = 2,
    Succeeded = 3,
    Rejected = 4,
    Failed = 5,
    RejectedByPolicy = 4
}

export { PRMergeStatus, PRReviewVote, PRStatus };


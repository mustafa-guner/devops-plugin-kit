export type ActivityEntry = {
    id: string;
    activity: string;
};

export type CapacityMemberType = {
    id: string;
    descriptor: string;
    displayName: string;
    uniqueName?: string;
    imageUrl?: string;
    daysOff: number;
    activities: ActivityEntry[];
    projectId: string;
    teamId: string;
};

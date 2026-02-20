export type IterationInfoType = {
    id: string;
    iterationId?: number;
    name: string;
    path: string;
    startDate?: string;
    finishDate?: string;
    projectId: string;
    teamId: string;
    paths?: string[];
    timeFrame?: number;
    level1?: string;
    level2?: string;
    projectsIncludedInIteration?: string[];
};
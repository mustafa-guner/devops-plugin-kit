import { fetchIterationsPerWorkItem } from "features/iterations/api/iterations";
import { IterationService } from "features/iterations/services/IterationService";
import { useIterationStore } from "features/iterations/stores/useIterationStore";
import { IterationInfoType } from "features/iterations/types/IterationInfoType";
import { useProjectStore } from "features/teams/stores/useProjectStore";
import FieldConstant from "features/work-items/constants/FieldConstant";
import { useMoveIterationWorkItemData } from "features/work-items/hooks/useData/useMoveIterationWorkItemData";
import { AdoWorkItemType } from "features/work-items/types/AdoWorkItemType";
import * as React from "react";
import Helper from "src/app/utils/column";
import { getChildrenQueryKey, getWorkItemsQueryKey } from "src/app/utils/queryKey";

export function useMoveToIterationMenu(enableMoveTo: boolean) {
    const { selectedProjects, projects } = useProjectStore();
    const { currentIteration } = useIterationStore();
    const [iterationsList, setIterationsList] = React.useState<IterationInfoType[] | null>(null);
    const [iterationsLoading, setIterationsLoading] = React.useState(false);

    const [loadedFor, setLoadedFor] = React.useState<{ projectId: string; teamId: string } | null>(null);
    const projectTeamPairs = React.useMemo(() => selectedProjects, [selectedProjects]);

    const moveToIterationUpdate = useMoveIterationWorkItemData();

    const ensureIterationsLoaded = React.useCallback(async (wi: AdoWorkItemType) => {
        if (!enableMoveTo || iterationsLoading) return;

        const workItemProject = wi?.fields?.[FieldConstant.WORK_ITEM_FIELD_TEAM_PROJECT];
        if (!workItemProject) return;

        const project = projects.value.find((v) => v.text?.trim().toLowerCase() === workItemProject.trim().toLowerCase());
        if (!project?.id) return;

        const projectTeam = selectedProjects.find((p) => p.projectId === project.id);
        if (!projectTeam?.teamId) return;

        // If already loaded for this pair, don't refetch
        if (iterationsList !== null && loadedFor?.projectId === project.id && loadedFor?.teamId === projectTeam.teamId) {
            return;
        }

        try {
            setIterationsLoading(true);
            const iterations = await fetchIterationsPerWorkItem(project.id, projectTeam.teamId);
            const filteredIterations = IterationService.filterFutureIterations(iterations, currentIteration);

            setIterationsList(filteredIterations);
            setLoadedFor({ projectId: project.id, teamId: projectTeam.teamId });
        } catch {
            setIterationsList([]);
            setLoadedFor({ projectId: project.id, teamId: projectTeam.teamId });
        } finally {
            setIterationsLoading(false);
        }
    },
        [enableMoveTo, iterationsLoading, iterationsList, loadedFor, projects.value, selectedProjects, currentIteration]
    );

    const handleMove = React.useCallback(async (wi: AdoWorkItemType, iteration: IterationInfoType | null | undefined) => {
        const project = wi?.fields?.[FieldConstant.WORK_ITEM_FIELD_TEAM_PROJECT];
        const parentId = Number(wi.fields?.[FieldConstant.WORK_ITEM_FIELD_PARENT] ?? 0);
        const newPath = iteration?.path?.trim();

        if (!project || !wi.id || !newPath) return;

        // Define the Query Keys that is to be updated.
        const fields = Helper.getInitializedWorkItemFields();
        const childItemFields = Helper.getColumnFields();
        const childrenKey = getChildrenQueryKey(project, parentId, childItemFields);
        const workItemsKey = getWorkItemsQueryKey({ iteration: currentIteration, projectTeamPairs, fields });

        moveToIterationUpdate.mutate({
            workItemId: wi.id,
            project,
            parentId,
            newIterationPath: newPath,
            queryKeys: [childrenKey, workItemsKey],
        });
    },
        [moveToIterationUpdate, currentIteration, projectTeamPairs]
    );

    return { iterations: iterationsList, currentIteration, iterationsLoading, ensureIterationsLoaded, handleMove };
}

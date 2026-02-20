import { useQuery } from '@tanstack/react-query';
import { WorkItemExpand } from "azure-devops-extension-api/WorkItemTracking";
import { useIterationStore } from "features/iterations/stores/useIterationStore";
import { IterationInfoType } from "features/iterations/types/IterationInfoType";
import { ProjectService } from "features/teams/services/ProjectService";
import { SelectedProjectType } from 'features/teams/types/SelectedProjectType';
import { fetchWorkItemsByIds } from 'features/work-items/api/workItems';
import FieldConstant from 'features/work-items/constants/FieldConstant';
import { WIQLService } from "features/work-items/services/WIQLService";
import { useWorkItemStore } from 'features/work-items/stores/useWorkItemStore';
import { AdoWorkItemType } from 'features/work-items/types/AdoWorkItemType';
import { extractParentIdsFromTasks } from 'features/work-items/utils/workItem';
import React from 'react';
import { WorkItemStoreKeyConstant } from 'src/app/constants/StoreKeyConstant';
import { getWorkItemsQueryKey } from 'src/app/utils/queryKey';

export function useWorkItemsQuery(iteration?: IterationInfoType, projectTeamPairs?: SelectedProjectType[], fields?: string[], expand: WorkItemExpand = WorkItemExpand.Relations) {
    const { setWorkItems, setTopLevelParentWorkItems } = useWorkItemStore();

    const iterationPaths = React.useMemo(() => {
        const p = iteration?.paths && iteration.paths.length > 0 ? iteration.paths : (iteration?.path ? [iteration.path] : []);
        return Array.from(new Set(p.filter(Boolean)));
    }, [iteration?.path, iteration?.paths]);

    const chunk = <T,>(arr: T[], size: number) => {
        const out: T[][] = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
    };

    return useQuery({
        queryKey: getWorkItemsQueryKey({ iteration, projectTeamPairs, fields, expand }),
        enabled: iterationPaths.length > 0 && !!projectTeamPairs?.length,
        queryFn: async () => {
            if (iterationPaths.length === 0 || !projectTeamPairs?.length) {
                return { allWorkItems: [], topLevelParentWorkItems: [] };
            }

            const iterations = useIterationStore.getState().iterations;
            const areaGroups = await ProjectService.getAreaPaths(projectTeamPairs);

            // Parents already in selected iteration (even with zero children)
            const parentIdsSet = new Set<number>();
            const taskIdsSet = new Set<number>();
            const iterationBatches = chunk(iterationPaths, 5);

            for (const batch of iterationBatches) {
                const parentIdsInIteration = await WIQLService.getParentIdsForSelectedIteration(areaGroups, batch);
                const taskIds = await WIQLService.getTaskIdsForSelectedIteration(areaGroups, batch);
                parentIdsInIteration.forEach((id) => parentIdsSet.add(id));
                taskIds.forEach((id) => taskIdsSet.add(id));
            }

            const parentIdsInIteration = Array.from(parentIdsSet);
            const taskIds = Array.from(taskIdsSet);

            // If both are empty, nothing to show
            if (taskIds.length === 0 && parentIdsInIteration.length === 0) {
                return { allWorkItems: [], topLevelParentWorkItems: [] };
            }

            // Fetch tasks WITH relations (needed to get parents from tasks)
            const tasks = taskIds.length ? await fetchWorkItemsByIds(taskIds, undefined, fields, expand) : [];

            // Parents of tasks (could be outside iteration -> faded)
            const parentIdsFromTasks = extractParentIdsFromTasks(tasks);

            // Union all parent ids (in sprint + from tasks)
            const allParentIds = Array.from(new Set([...parentIdsInIteration, ...parentIdsFromTasks]));

            const parents = allParentIds.length ? await fetchWorkItemsByIds(allParentIds, undefined, fields, expand) : [];

            // --- annotate iteration info (so fading works) ---
            const annotate = (wi: AdoWorkItemType) => {
                const iter = iterations.find(it => it.path === wi.fields[FieldConstant.WORK_ITEM_FIELD_ITERATION_PATH]);
                wi.fields = { ...wi.fields, [FieldConstant.WORK_ITEM_FIELD_ITERATION_INFO]: (iter ?? null) as IterationInfoType };
                return wi;
            };

            const annotatedTasks = tasks.map(annotate);
            const annotatedParents = parents.map(annotate);

            // --- attach children to parents ---
            const parentChildrenMap = new Map<number, AdoWorkItemType[]>();
            for (const t of annotatedTasks) {
                for (const rel of t.relations ?? []) {
                    if (rel.rel !== "System.LinkTypes.Hierarchy-Reverse") continue;
                    const match = String(rel.url ?? "").match(/(\d+)$/);
                    if (!match) continue;
                    const pid = Number(match[1]);
                    if (Number.isNaN(pid)) continue;
                    const arr = parentChildrenMap.get(pid) ?? [];
                    arr.push(t);
                    parentChildrenMap.set(pid, arr);
                }
            }

            for (const p of annotatedParents) {
                (p as any)._children = parentChildrenMap.get(p.id) ?? [];
            }

            // Combine + dedupe
            const combined = [...annotatedParents, ...annotatedTasks];
            const seen = new Set<number>();
            const allWorkItems = combined.filter(w => {
                if (!w || typeof w.id !== "number") return false;
                if (seen.has(w.id)) return false;
                seen.add(w.id);
                return true;
            });

            let topLevelParentWorkItems: AdoWorkItemType[] = [];

            if (expand === WorkItemExpand.None) {
                topLevelParentWorkItems = await WIQLService.getParentWorkItemsForPbisAndBugs(
                    allWorkItems.map(w => w.id), undefined);
            } else {
                const getParentIdsFromRelations = (items: AdoWorkItemType[]) => {
                    const out = new Set<number>();
                    for (const item of items) {
                        for (const rel of item.relations ?? []) {
                            if (rel.rel !== "System.LinkTypes.Hierarchy-Reverse") continue;
                            const match = String(rel.url ?? "").match(/(\d+)$/);
                            if (!match) continue;
                            const id = Number(match[1]);
                            if (!Number.isNaN(id)) out.add(id);
                        }
                    }
                    return Array.from(out);
                };

                const featureIds = getParentIdsFromRelations(annotatedParents);
                const features = featureIds.length ? await fetchWorkItemsByIds(featureIds, undefined, fields, expand) : [];

                const epicIds = getParentIdsFromRelations(features);
                const epics = epicIds.length ? await fetchWorkItemsByIds(epicIds, undefined, fields, expand) : [];

                const topLevelCombined = [...features.map(annotate), ...epics.map(annotate)];
                const topLevelSeen = new Set<number>();
                topLevelParentWorkItems = topLevelCombined.filter(w => {
                    if (!w || typeof w.id !== "number") return false;
                    if (topLevelSeen.has(w.id)) return false;
                    topLevelSeen.add(w.id);
                    return true;
                });
            }

            return { allWorkItems, topLevelParentWorkItems };
        },

        onSuccess: (data) => {
            const { allWorkItems, topLevelParentWorkItems } = data ?? {};
            setWorkItems(WorkItemStoreKeyConstant.workItems, allWorkItems ?? [], iteration);
            setTopLevelParentWorkItems(topLevelParentWorkItems ?? []);
        },

        onError: (err) => {
            console.error("[useWorkItemsQuery] error", err);
            setWorkItems(WorkItemStoreKeyConstant.workItems, []);
        },
    });
}



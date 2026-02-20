import { useUIStore } from "app/stores/useUIStore";
import FieldConstant from "features/work-items/constants/FieldConstant";
import TypeConstant from "features/work-items/constants/TypeConstant";
import { useWorkItemStore } from "features/work-items/stores/useWorkItemStore";
import { AdoWorkItemType } from "features/work-items/types/AdoWorkItemType";
import { isTask } from "features/work-items/utils/workItem";
import * as React from "react";
import { filterWorkItemsByAssignee, filterWorkItemsByKeyword, filterWorkItemsByTags } from "../../utils/filter";
import { getParentIdFromTask, getTaskOrderKey } from "../../utils/taskOrder";

type Props = {
    savedOrder?: Map<number, number>;
    taskOrderMap?: Map<string, number>;
    assigneeMode?: "strict" | "parentOrChild";
    allowChildMatch?: boolean;
};

export function useWorkItemsFilter(options?: Props) {
    const { workItems, parentWorkItems, childrenWorkItems, topLevelParentWorkItems } = useWorkItemStore();

    const {
        keyword,
        selectedTypes,
        selectedAssignedTo,
        selectedState,
        selectedIterations,
        selectedTags,
        selectedAreaPaths,
        selectedEpics,
        selectedFeatures,
        sortConfig
    } = useUIStore();

    const debouncedKeyword = useDebouncedValue(keyword, 200);
    const savedOrder = options?.savedOrder;
    const taskOrderMap = options?.taskOrderMap;
    const assigneeMode = options?.assigneeMode ?? "strict";
    const allowChildMatch = options?.allowChildMatch ?? true;

    const setTaskRelatedIds = React.useRef(useUIStore.getState().setTaskRelatedIds);

    // from relations, get all child IDs
    const getChildIdsFromRelations = React.useCallback((wi: AdoWorkItemType): number[] => {
        const rels = wi.relations || [];
        const ids: number[] = [];
        for (const rel of rels) {
            if (rel.rel !== "System.LinkTypes.Hierarchy-Forward") continue;
            const match = rel.url && rel.url.match(/(\d+)$/);
            if (match) {
                ids.push(Number(match[1]));
            }
        }
        return ids;
    }, []);

    const parentLookup = React.useMemo(() => {
        const featureByChildId = new Map<number, AdoWorkItemType>();
        const epicByChildId = new Map<number, AdoWorkItemType>();

        const epics = topLevelParentWorkItems.filter(wi => wi.fields[FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE] === TypeConstant.EPIC_TYPE);

        const features = topLevelParentWorkItems.filter(wi => wi.fields[FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE] === TypeConstant.FEATURE_TYPE);

        // Feature -> children (PBI/Bug/Task etc.)
        for (const feature of features) {
            const childIds = getChildIdsFromRelations(feature);
            childIds.forEach(id => featureByChildId.set(id, feature));
        }

        // Epic -> children (Features)
        for (const epic of epics) {
            const featureIds = getChildIdsFromRelations(epic);
            featureIds.forEach(fid => epicByChildId.set(fid, epic));
        }

        return { featureByChildId, epicByChildId };
    }, [topLevelParentWorkItems, getChildIdsFromRelations]);

    const { featureByChildId, epicByChildId } = parentLookup;

    /**
     * Filter the *flat* workItems list according to UI filters
     * and capture "relatedTaskIds" (for child matches via keyword/tags/etc.)
     */
    const { filteredWorkItems, derivedTaskRelatedIds } = React.useMemo(() => {
        const relatedTaskIds = new Set<number>();

        let nextOrder = (getMaxValue(savedOrder!) ?? 0) + 1;
        const nextTaskOrderByParent = new Map<number, number>();
        const parentOrderById = new Map<number, number>();

        const normalized = workItems.map(wi => {
            const existing =
                savedOrder?.get(wi.id) ??
                (wi as AdoWorkItemType).order;

            if (!isTask(wi)) {
                if (existing != null) {
                    parentOrderById.set(wi.id, existing);
                    return { ...wi, order: existing, displayOrder: String(existing) };
                }

                const assigned = nextOrder++;
                parentOrderById.set(wi.id, assigned);
                return { ...wi, order: assigned, displayOrder: String(assigned) };
            }

            const parentId = getParentIdFromTask(wi);
            const parentOrder = parentId != null ? parentOrderById.get(parentId) ?? savedOrder?.get(parentId) ?? 0 : 0;
            const key = parentId != null ? getTaskOrderKey(parentId, wi.id) : null;
            let taskOrder = key ? taskOrderMap?.get(key) : undefined;

            if (!taskOrder && parentId != null) {
                const next = (nextTaskOrderByParent.get(parentId) ?? 0) + 1;
                nextTaskOrderByParent.set(parentId, next);
                taskOrder = next;
            }

            const displayOrder = parentOrder
                ? `${parentOrder}.${taskOrder ?? ""}`
                : (taskOrder != null ? String(taskOrder) : "");

            const numericOrder = parentOrder && taskOrder
                ? parentOrder + taskOrder / 1000
                : (existing ?? nextOrder++);

            return { ...wi, order: numericOrder, displayOrder };
        });

        const kw = debouncedKeyword?.trim().toLowerCase() ?? "";

        const filtered = normalized.filter((wi: AdoWorkItemType) => {
            const fields = wi.fields ?? {};

            // --- Keyword ---
            if (kw) {
                const matchesSelf = filterWorkItemsByKeyword(wi, kw);
                let hasMatchingChild = false;

                if (allowChildMatch && !matchesSelf && wi._children && wi._children.length > 0) {
                    for (const child of wi._children) {
                        if (filterWorkItemsByKeyword(child, kw)) {
                            relatedTaskIds.add(child.id);
                            hasMatchingChild = true;
                        }
                    }
                }

                if (!matchesSelf && !hasMatchingChild) {
                    return false;
                }
            }

            // --- Type ---
            if (selectedTypes?.length) {
                const typeName = String(fields[FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE] ?? "");
                if (!selectedTypes.includes(typeName)) return false;
            }

            // --- Assigned To ---
            if (selectedAssignedTo?.length) {
                const isAssigneeMatching = filterWorkItemsByAssignee(wi, selectedAssignedTo);
                if (assigneeMode === "strict") {
                    if (!isAssigneeMatching) return false;
                } else {
                    let hasMatchingChild = false;
                    if (allowChildMatch && wi._children && wi._children.length > 0) {
                        for (const child of wi._children) {
                            if (filterWorkItemsByAssignee(child, selectedAssignedTo)) {
                                relatedTaskIds.add(child.id);
                                hasMatchingChild = true;
                            }
                        }
                    }
                    if (!isAssigneeMatching && !hasMatchingChild) return false;
                }
            }

            // --- State ---
            if (selectedState?.length) {
                const stateName = String(fields[FieldConstant.WORK_ITEM_FIELD_STATE] ?? "");
                const matchesSelf = selectedState.includes(stateName);
                let hasMatchingChild = false;

                if (allowChildMatch && wi._children && wi._children.length > 0) {
                    for (const child of wi._children) {
                        const childState = String(child.fields?.[FieldConstant.WORK_ITEM_FIELD_STATE] ?? "");
                        if (selectedState.includes(childState)) {
                            relatedTaskIds.add(child.id);
                            hasMatchingChild = true;
                        }
                    }
                }

                if (!matchesSelf && !hasMatchingChild) return false;
            }

            // --- Iteration Path ---
            if (selectedIterations?.length) {
                const iterPath = String(fields[FieldConstant.WORK_ITEM_FIELD_ITERATION_PATH] ?? "");
                if (!selectedIterations.includes(iterPath)) return false;
            }

            // --- Area Path ---
            if (selectedAreaPaths?.length) {
                const areaPath = String(fields[FieldConstant.WORK_ITEM_FIELD_AREA_PATH] ?? "");
                if (!selectedAreaPaths.includes(areaPath)) return false;
            }

            // --- Tags ---
            if (selectedTags?.length) {
                const someTagsExists = filterWorkItemsByTags(wi, selectedTags);

                if (allowChildMatch && wi._children && wi._children.length > 0) {
                    for (const child of wi._children) {
                        if (filterWorkItemsByTags(child, selectedTags)) {
                            relatedTaskIds.add(child.id);
                        }
                    }
                }

                if (!someTagsExists) return false;
            }

            // Feature filter
            if (selectedFeatures?.length) {
                let parentFeature: AdoWorkItemType | undefined;
                const typeName = String(fields[FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE] ?? "");

                if (typeName === TypeConstant.FEATURE_TYPE) {
                    parentFeature = wi;
                } else {
                    parentFeature = featureByChildId.get(wi.id);
                }

                const featureTitle = parentFeature?.fields[FieldConstant.WORK_ITEM_FIELD_TITLE]?.toLowerCase();

                if (!featureTitle || !selectedFeatures.map((data: any) => data.workItem.fields[FieldConstant.WORK_ITEM_FIELD_TITLE]?.trim().toLowerCase()).includes(featureTitle)) {
                    return false;
                }
            }

            // Epic filter
            if (selectedEpics?.length) {
                let parentEpic: AdoWorkItemType | undefined;
                const typeName = String(fields[FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE] ?? "");

                if (typeName === TypeConstant.EPIC_TYPE) {
                    parentEpic = wi;
                } else if (typeName === TypeConstant.FEATURE_TYPE) {
                    parentEpic = epicByChildId.get(wi.id);
                } else {
                    const feature = featureByChildId.get(wi.id);
                    if (feature) {
                        parentEpic = epicByChildId.get(feature.id);
                    }
                }

                const epicTitle = parentEpic?.fields[FieldConstant.WORK_ITEM_FIELD_TITLE]?.toLowerCase();

                if (!epicTitle || !selectedEpics.map((data: any) => data.workItem.fields[FieldConstant.WORK_ITEM_FIELD_TITLE]?.trim().toLowerCase()).includes(epicTitle)) {
                    return false;
                }
            }

            return true;
        });

        // Default sort
        filtered.sort(
            (a, b) =>
                (a.order ?? 0) - (b.order ?? 0) ||
                a.id - b.id
        );

        // Custom sort from UI
        if (sortConfig) {
            const { field, direction } = sortConfig;
            const dir = direction === "asc" ? 1 : -1;
            filtered.sort((a, b) => {
                const av = field === "order" ? (a as any).order ?? 0 : a.fields[field];
                const bv = field === "order" ? (b as any).order ?? 0 : b.fields[field];
                if (av < bv) return -1 * dir;
                if (av > bv) return 1 * dir;
                return 0;
            });
        }

        return {
            filteredWorkItems: filtered,
            derivedTaskRelatedIds: Array.from(relatedTaskIds),
        };
    }, [
        workItems,
        savedOrder,
        taskOrderMap,
        debouncedKeyword,
        selectedTypes,
        selectedAssignedTo,
        selectedState,
        selectedIterations,
        selectedTags,
        selectedAreaPaths,
        selectedFeatures,
        selectedEpics,
        sortConfig,
        featureByChildId,
        epicByChildId
    ]);

    React.useEffect(() => {
        setTaskRelatedIds.current(derivedTaskRelatedIds);
    }, [derivedTaskRelatedIds]);

    /**
     * Derive filteredParents & filteredChildren
     */
    const { filteredParents, filteredChildren } = React.useMemo(() => {
        const directIds = new Set<number>();
        const parentIds = new Set<number>();

        for (const wi of filteredWorkItems) {
            directIds.add(wi.id);

            if (!isTask(wi)) {
                parentIds.add(wi.id);
            }
        }

        const parents = parentWorkItems.filter(p => directIds.has(p.id));
        const hasAssigneeFilter = !!selectedAssignedTo?.length;

        const children = childrenWorkItems.filter(c => {
            const parentId = c.fields?.[FieldConstant.WORK_ITEM_FIELD_PARENT];
            const inHierarchy = directIds.has(c.id) || (parentId != null && parentIds.has(parentId));
            if (!inHierarchy) return false;
            if (!hasAssigneeFilter) return true;
            return filterWorkItemsByAssignee(c, selectedAssignedTo!);
        });

        return {
            filteredParents: parents,
            filteredChildren: children,
        };
    }, [filteredWorkItems, parentWorkItems, childrenWorkItems, selectedAssignedTo]);

    return {
        workItems: filteredWorkItems,
        parentWorkItems: filteredParents,
        childrenWorkItems: filteredChildren,
    };
}

//#region Private Functions

// simple debounce hook for keyword
function useDebouncedValue<T>(value: T, delay = 200): T {
    const [debounced, setDebounced] = React.useState(value);

    React.useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);

    return debounced;
}

// get the max value from the saved order map to place missing order ones after it
function getMaxValue(map: Map<number, number>): number | undefined {
    let max: number | undefined;

    if (map) {
        map.forEach(value => {
            if (max === undefined || value > max) {
                max = value;
            }
        });
    }

    return max;
}
//#endregion

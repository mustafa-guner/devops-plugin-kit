import { TeamMember } from "features/teams/types/TeamMemberType";
import FieldConstant from "features/work-items/constants/FieldConstant";
import TypeConstant from "features/work-items/constants/TypeConstant";
import { AdoWorkItemType } from "features/work-items/types/AdoWorkItemType";
import { filterEpics, filterFeatures } from "./filter.js";

/**
 * Get the Epic work item that is the ancestor of the given work item.
 * 
 * @param workItem The work item for which to find the Epic ancestor.
 * @param workItems The list of all work items to search within.
 * @returns The Epic work item if found, otherwise undefined.
 * 
 */
export function getEpicByWorkItem(workItem: AdoWorkItemType, workItems: AdoWorkItemType[]): AdoWorkItemType | undefined {
    const epics = filterEpics(workItems);
    const features = filterFeatures(workItems);

    const hasChild = (parent: AdoWorkItemType, childId: number) => {
        const relations = parent.relations || [];
        return relations.some(rel => {
            if (rel.rel !== "System.LinkTypes.Hierarchy-Forward") return false;
            const match = rel.url && rel.url.match(/(\d+)$/);
            const parsedId = match ? Number(match[1]) : null;
            return parsedId === childId;
        });
    };

    //find the feature that is (direct) parent of current item
    let parentFeature: AdoWorkItemType | undefined;

    if (workItem.fields[FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE] === TypeConstant.FEATURE_TYPE) {
        parentFeature = workItem;
    } else {
        parentFeature = features.find(f => hasChild(f, workItem.id));
    }

    if (!parentFeature) {
        return undefined;
    }

    return epics.find(e => hasChild(e, parentFeature!.id));
}

/**
 * Builds a lookup map from Feature ID -> Epic metadata (id + title),
 * by scanning Epic work items and their forward hierarchy child links.
 * 
 * @param topLevelParentWorkItems A list of top-level parent work items (typically epics/features).
 * @returns A map where the key is featureId and the value contains epicId and epicTitle.
 * 
 */
export function getEpicByFeatureId(topLevelParentWorkItems: AdoWorkItemType[]) {
    const map = new Map<number, { epicId: number; epicTitle: string }>();

    for (const wi of topLevelParentWorkItems) {
        const type = String(wi.fields[FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE] || "");
        if (type.toLowerCase() !== "epic") continue;

        const epicId = wi.id;
        const epicTitle = String(wi.fields[FieldConstant.WORK_ITEM_FIELD_TITLE] || "");

        for (const featureId of getChildWorkItemIdsFromRelations(wi)) {
            map.set(featureId, { epicId, epicTitle });
        }
    }
    return map;
}


/**
 * Get the Feature work item that is the parent of the given work item.
 * 
 * @param workItem The work item for which to find the Feature parent.
 * @param workItems The list of all work items to search within.
 * @returns The Feature work item if found, otherwise undefined.
 * 
 */
export function getFeatureByWorkItem(workItem: AdoWorkItemType, workItems: AdoWorkItemType[]): AdoWorkItemType | undefined {
    const features = filterFeatures(workItems);

    return features?.find(f => {
        const relations = f.relations || [];
        return relations.some(rel => {
            const childRel = rel.rel === "System.LinkTypes.Hierarchy-Forward";
            const match = rel.url && rel.url.match(/(\d+)$/);
            const childId = match ? Number(match[1]) : null;
            return childRel && childId === workItem.id;
        });
    });
}


/**
 * Builds a lookup map from Work Item ID -> Feature metadata (id + title),
 * by scanning Feature work items and their forward hierarchy child links.
 * 
 * @param topLevelParentWorkItems A list of top-level parent work items (typically features).
 * @returns A map where the key is child workItemId and the value contains featureId and featureTitle.
 * 
 */
export function getFeatureByWorkItemId(topLevelParentWorkItems: AdoWorkItemType[]) {
    const map = new Map<number, { featureId: number; featureTitle: string }>();

    for (const feature of topLevelParentWorkItems) {
        const type = String(feature.fields[FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE] || "");
        if (type.toLowerCase() !== "feature") continue;

        const featureId = feature.id;
        const featureTitle = String(feature.fields[FieldConstant.WORK_ITEM_FIELD_TITLE] || "");

        for (const childId of getChildWorkItemIdsFromRelations(feature)) {
            map.set(childId, { featureId, featureTitle });
        }
    }

    return map;
}

/**
 * Calculates the total remaining work from an array of work items.
 * 
 * @param workItems Array of work items to calculate remaining work from.
 * @returns Total remaining work as a number.
 * 
 */
export function calculateTotalRemainingWorkByWorkItems(workItems: AdoWorkItemType[]) {
    return workItems.reduce((total, wi) => total + (Number(wi?.fields[FieldConstant.WORK_ITEM_FIELD_REMAINING_WORK]) || 0), 0);
}


/**
 * Get the assignee from the given work item
 * 
 * @param workItem The work item that is asked to get responsible assignee from
 * @returns Assignee as Team Member type.
 */
export function getAssigneeFromWorkItem(workItem: AdoWorkItemType) {
    const v = workItem.fields?.[FieldConstant.WORK_ITEM_FIELD_ASSIGNED_TO];

    if (!v || typeof v !== "object") {
        return { id: "", displayName: "Unassigned", uniqueName: "" } as TeamMember;
    }

    return v as TeamMember;
};

/**
 * Extracts child work item IDs from a work item's relations by reading
 * forward hierarchy links (System.LinkTypes.Hierarchy-Forward).
 * 
 * @param item The work item whose relations will be parsed for child links.
 * @returns A list of child work item IDs. Returns an empty array if there are no relations.
 * 
 */
export function getChildWorkItemIdsFromRelations(item: AdoWorkItemType): number[] {
    if (!Array.isArray(item?.relations)) return [];

    return item.relations
        .filter((r: any) => r.rel === "System.LinkTypes.Hierarchy-Forward")
        .map((r: any) => Number(r.url.match(/(\d+)$/)?.[1] ?? 0))
        .filter((id: number) => Number.isFinite(id) && id > 0);
}

/**
 * @description: Extracts parent work item IDs from task relations (Hierarchy-Reverse).
 * @param tasks Array of task work items (must include relations).
 * @returns Array of unique parent IDs.
 */
export function extractParentIdsFromTasks(tasks: AdoWorkItemType[]): number[] {
    const out = new Set<number>();

    for (const t of tasks) {
        for (const rel of t.relations ?? []) {
            if (rel.rel !== "System.LinkTypes.Hierarchy-Reverse") continue;
            const match = String(rel.url ?? "").match(/(\d+)$/);
            if (!match) continue;
            const id = Number(match[1]);
            if (!Number.isNaN(id)) out.add(id);
        }
    }

    return Array.from(out);
}

/**
 * Checks whether a work item should be treated as a Task by comparing its
 * work item type field against the Task type constant.
 * 
 * @param item The work item to check.
 * @returns True if the work item type matches Task, otherwise false.
 * 
 */
export function isTask(item: AdoWorkItemType) {
    return String(item?.fields?.[FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE]).toLowerCase() === TypeConstant.TASK_TYPE.toLowerCase();
}

/**
 * Parses and returns the tags of a work item as a cleaned string array.
 * Azure DevOps stores tags as a semicolon-separated string.
 * 
 * @param workItem The work item to extract tags from.
 * @returns A trimmed, non-empty list of tags.
 * 
 */
export function getTagsByWorkItem(workItem: AdoWorkItemType) {
    const tags = (workItem.fields[FieldConstant.WORK_ITEM_FIELD_TAGS] || "").split(";");
    const validatedTags = tags.map((tag: string) => tag.trim());
    const filteredTags = validatedTags.filter((tag: string) => tag);
    return filteredTags;
}

/**
 * Returns the IDs of work items that can be expanded (i.e., non-task items that have at least one child).
 * Typically used to determine which parent rows should show an expand/collapse control in the UI.
 *
 * Rules:
 * - Excludes items of type "Task" (tasks are usually the leaf-level items).
 * - Includes only items that have at least one child relation.
 *
 * @param workItems The list of work items to evaluate.
 * @returns A list of work item IDs that are expandable.
 */
export function getExpandableWorkItemIds(workItems: AdoWorkItemType[]) {
    return workItems
        .filter((w) => String(w.fields?.[FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE] || "").toLowerCase() !== TypeConstant.TASK_TYPE.toLowerCase())
        .filter((w) => getChildWorkItemIdsFromRelations(w).length > 0)
        .map((w) => w.id);
}

/**
 * Find a task by its ID across multiple buckets. (e.g., newTasks, existingTasks, deletedTasks)
 * 
 * @param did 
 * @param buckets 
 * @returns The found task or null if not found.
 */
export function findTaskById(did: string, ...buckets: any[][]) {
    const [, , raw] = did.split(":");
    for (const b of buckets) {
        const t = b.find(x => String(x.id ?? x.tempId) === raw);
        if (t) return t;
    }
    return null;
};

import FieldConstant from "features/work-items/constants/FieldConstant";
import StateConstant from "features/work-items/constants/StateConstant";
import TypeConstant from "features/work-items/constants/TypeConstant";
import { AdoWorkItemType } from "features/work-items/types/AdoWorkItemType";

/**
 * Filters work items to include only Epics.
 * 
 * @param workItems Array of work items to filter.
 * @returns Filtered array containing only Epics.
 * 
 */
export function filterEpics(workItems: AdoWorkItemType[]) {
    return workItems.filter(
        wi => wi.fields[FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE] === TypeConstant.EPIC_TYPE
    );
}

/**
 * Filters work items to include only Features.
 * 
 * @param workItems Array of work items to filter.
 * @returns Filtered array containing only Features.
 */
export function filterFeatures(workItems: AdoWorkItemType[]) {
    return workItems.filter(
        wi => wi.fields[FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE] === TypeConstant.FEATURE_TYPE
    );
}

/**
 * Filters work items to include only Product Backlog Items (PBIs) and Bugs.
 * 
 * @param workItems Array of work items to filter.
 * @returns Filtered array containing only PBIs and Bugs.
 * 
 */
export function filterPbisAndBugs(workItems: AdoWorkItemType[]) {
    return workItems.filter((workItem: AdoWorkItemType) => {
        const workItemType = workItem.fields[FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE];
        return workItemType === TypeConstant.PRODUCT_BACKLOG_ITEM_TYPE || workItemType === TypeConstant.BUG_TYPE;
    });
};

/**
 * Filters work items to include only Tasks that are not in the Removed state.
 * 
 * @param workItems Array of work items to filter.
 * @returns Filtered array containing only Tasks that are not removed.
 * 
 */
export function filterTasks(workItems: AdoWorkItemType[]) {
    return workItems.filter((workItem: AdoWorkItemType) => {
        const workItemType = workItem.fields[FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE];
        const isRemoved = workItem.fields[FieldConstant.WORK_ITEM_FIELD_STATE] === StateConstant.REMOVED_STATE;
        return workItemType === TypeConstant.TASK_TYPE && !isRemoved;
    });
};

/** 
 * @description: Filters child work items
 * @param childrenWorkItems: Array of child work items to filter.
 * @param selectedAssignedTo: An array of selected assignee unique names.
 * @param parentId: The parent work item ID to filter by.
 * @return: Filtered array of child work items.
*/
export function filterChildrenWorkItemsByParentId(childrenWorkItems: AdoWorkItemType[], parentId: number, selectedAssignedTo?: string[]) {
    return childrenWorkItems.filter((t: AdoWorkItemType) => {
        if (!t) return false;

        if (t.fields[FieldConstant.WORK_ITEM_FIELD_STATE] == StateConstant.REMOVED_STATE) return false;

        const viaRelations = t.relations?.some(
            (rel: any) => rel.rel === "System.LinkTypes.Hierarchy-Reverse" && rel.url.endsWith(`/${parentId}`)
        );

        const viaParentField = t.fields?.[FieldConstant.WORK_ITEM_FIELD_PARENT] === parentId;

        if (!selectedAssignedTo || selectedAssignedTo.length === 0) {
            return !!(viaRelations || viaParentField);
        }

        let isAssigneeMatched = filterWorkItemsByAssignee(t, selectedAssignedTo);

        if (t._children && t._children.length > 0) {
            for (const child of t._children) {
                if (filterWorkItemsByAssignee(child, selectedAssignedTo)) {
                    isAssigneeMatched = true;
                    break;
                }
            }
            if (!isAssigneeMatched) return false;
        }

        if (!isAssigneeMatched) return false;

        return !!(viaRelations || viaParentField);
    });
}

/** 
* @description: Filters a work item based on selected assignees.
* @param workItem: The work item to filter.
* @param selectedAssignedTo: An array of selected assignee unique names.
* @return: True if the work item matches the selected assignees, false otherwise.
*/
export function filterWorkItemsByAssignee(workItem: AdoWorkItemType, selectedAssignedTo: string[]) {
    if (!selectedAssignedTo?.length) return true;

    const assigned = workItem.fields?.[FieldConstant.WORK_ITEM_FIELD_ASSIGNED_TO] as any | undefined;
    const uniqueName = assigned?.uniqueName as string | undefined;

    const hasUnassigned = selectedAssignedTo.includes("__unassigned__");
    const selectedReal = selectedAssignedTo.filter(x => x !== "__unassigned__");

    const isUnassigned = !uniqueName;

    const matchesReal = selectedReal.length > 0
        ? (!!uniqueName && selectedReal.includes(uniqueName))
        : false;

    const matchesUnassigned = hasUnassigned && isUnassigned;

    if (selectedReal.length === 0 && hasUnassigned) return matchesUnassigned;
    if (selectedReal.length > 0 && !hasUnassigned) return matchesReal;
    return matchesReal || matchesUnassigned;
}


/**
 * @description: Checks if a work item matches a given keyword across defined fields.
 * @param workItem   The work item to check.
 * @param keyword The keyword to match against the work item's specific fields.
 * @returns True if the keyword matches any field in the work item that is specified before, false otherwise.
 */
export function filterWorkItemsByKeyword(workItem: AdoWorkItemType, keyword: string): boolean {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return true;

    const fields = workItem.fields ?? {};

    for (const field of [
        FieldConstant.WORK_ITEM_FIELD_ID,
        FieldConstant.WORK_ITEM_FIELD_TITLE,
        FieldConstant.WORK_ITEM_FIELD_TAGS,
        FieldConstant.WORK_ITEM_FIELD_AREA_PATH,
        FieldConstant.WORK_ITEM_FIELD_ITERATION_PATH
    ]) {
        const value = fields[field];

        if (!value) continue;

        //for Id like fields
        if (typeof value === "number") {
            if (String(value) === kw) return true;
            continue;
        }

        // for title like fields
        if (typeof value === "string") {
            if (value.toLowerCase().includes(kw)) return true;
            continue;
        }

        //for area path and tags like fields
        if (Array.isArray(value)) {
            if (value.some(v => String(v).toLowerCase().includes(kw))) return true;
            continue;
        }
    }

    return false;
}

/**
 * @description: Checks whether a work item contains at least one of the selected tags.
 *                Tags are read from the work item's tag field, split by semicolon (;),
 *                trimmed, and compared against the provided tag list.
 * @param workItem     The work item whose tags will be evaluated.
 * @param selectedTags The list of tags to match against the work item's tags.
 * @returns True if the work item contains at least one of the selected tags, false otherwise.
 */
export function filterWorkItemsByTags(workItem: AdoWorkItemType, selectedTags: string[]) {
    const tagsStr = String(workItem.fields[FieldConstant.WORK_ITEM_FIELD_TAGS] ?? "");
    const tags = tagsStr.split(";").map(t => t.trim()).filter(Boolean);
    const tagSet = new Set(tags);
    const someTagsExists = selectedTags.some(t => tagSet.has(t));
    return someTagsExists
}

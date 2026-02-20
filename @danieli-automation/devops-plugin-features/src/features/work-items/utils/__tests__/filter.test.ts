import FieldConstant from "features/work-items/constants/FieldConstant";
import StateConstant from "features/work-items/constants/StateConstant";
import TypeConstant from "features/work-items/constants/TypeConstant";
import { AdoWorkItemType } from "features/work-items/types/AdoWorkItemType";
import { describe, expect, it } from "vitest";
import { filterEpics, filterFeatures, filterPbisAndBugs, filterTasks } from '../filter.js';

describe("Utils: Filter Helper Tests", () => {

    const epicTypeWorkItem: AdoWorkItemType = {
        id: 1,
        fields: {
            [FieldConstant.WORK_ITEM_FIELD_ID]: "1",
            [FieldConstant.WORK_ITEM_FIELD_TITLE]: "This is test work item 1",
            [FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE]: TypeConstant.EPIC_TYPE
        }
    }

    const featureTypeWorkItem: AdoWorkItemType = {
        id: 2,
        fields: {
            [FieldConstant.WORK_ITEM_FIELD_ID]: "2",
            [FieldConstant.WORK_ITEM_FIELD_TITLE]: "This is test work item 2",
            [FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE]: TypeConstant.FEATURE_TYPE
        }
    }

    const pbiTypeWorkItem: AdoWorkItemType = {
        id: 3,
        fields: {
            [FieldConstant.WORK_ITEM_FIELD_ID]: "3",
            [FieldConstant.WORK_ITEM_FIELD_TITLE]: "This is test work item 3",
            [FieldConstant.WORK_ITEM_FIELD_STATE]: StateConstant.EXECUTING_STATE,
            [FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE]: TypeConstant.PRODUCT_BACKLOG_ITEM_TYPE
        }
    }

    const bugTypeWorkItem: AdoWorkItemType = {
        id: 4,
        fields: {
            [FieldConstant.WORK_ITEM_FIELD_ID]: "4",
            [FieldConstant.WORK_ITEM_FIELD_TITLE]: "This is test work item 4",
            [FieldConstant.WORK_ITEM_FIELD_STATE]: StateConstant.EXECUTING_STATE,
            [FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE]: TypeConstant.BUG_TYPE
        }
    }

    const taskTypeWorkItem: AdoWorkItemType = {
        id: 5,
        fields: {
            [FieldConstant.WORK_ITEM_FIELD_ID]: "5",
            [FieldConstant.WORK_ITEM_FIELD_TITLE]: "This is test work item 5",
            [FieldConstant.WORK_ITEM_FIELD_STATE]: StateConstant.IN_PROGRESS_STATE,
            [FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE]: TypeConstant.TASK_TYPE
        }
    }

    const workItems: AdoWorkItemType[] = [epicTypeWorkItem, featureTypeWorkItem, pbiTypeWorkItem, bugTypeWorkItem, taskTypeWorkItem];

    //#region filterEpics
    it("filterEpics: returns filtered epic type work items from given array of data", () => {
        expect(filterEpics(workItems)).toEqual([{ ...epicTypeWorkItem }]);
    });
    //#endregion

    //#region filterFeatures
    it("filterFeatures: returns filtered feature type work items from given array of data", () => {
        expect(filterFeatures(workItems)).toEqual([{ ...featureTypeWorkItem }]);
    });
    //#endregion

    //#region filterPbisAndBugs
    it("filterPbisAndBugs: returns filtered pbis and bug type work items from given array of data", () => {
        const result = filterPbisAndBugs(workItems);

        expect(result).toHaveLength(2);
        expect(result).toEqual(expect.arrayContaining([bugTypeWorkItem, pbiTypeWorkItem]));
    });
    //#endregions

    //#region filterTasks
    it("filterTasks: returns filtered task type work items from given array of data", () => {
        expect(filterTasks(workItems)).toEqual([{ ...taskTypeWorkItem }]);
    });
    //#endregions

});
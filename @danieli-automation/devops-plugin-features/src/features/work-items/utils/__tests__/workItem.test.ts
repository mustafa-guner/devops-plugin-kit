import FieldConstant from "features/work-items/constants/FieldConstant";
import TypeConstant from "features/work-items/constants/TypeConstant";
import { describe, expect, it } from "vitest";
import { AdoWorkItemType } from "../../types/AdoWorkItemType.js";
import { calculateTotalRemainingWorkByWorkItems, getEpicByWorkItem, getFeatureByWorkItem } from "../workItem.js";

describe("Utils: WorkItem Helper Tests", () => {

    const epic7420: AdoWorkItemType = {
        id: 7420,
        fields: {
            [FieldConstant.WORK_ITEM_FIELD_ID]: "7420",
            [FieldConstant.WORK_ITEM_FIELD_TITLE]: "This is test work item 7420",
            [FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE]: TypeConstant.EPIC_TYPE,
        },
        relations: [
            {
                rel: "System.LinkTypes.Hierarchy-Forward",
                url: "https://dev.azure.com/org/project/_apis/wit/workItems/7428", // child = feature 7428
                attributes: {}
            },
        ],
    };

    const epic7421: AdoWorkItemType = {
        id: 7421,
        fields: {
            [FieldConstant.WORK_ITEM_FIELD_ID]: "7421",
            [FieldConstant.WORK_ITEM_FIELD_TITLE]: "This is test work item 7421",
            [FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE]: TypeConstant.EPIC_TYPE,
        },
        relations: [],
    };

    const feature7428: AdoWorkItemType = {
        id: 7428,
        fields: {
            [FieldConstant.WORK_ITEM_FIELD_ID]: "7428",
            [FieldConstant.WORK_ITEM_FIELD_TITLE]: "This is test work item 7428",
            [FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE]: TypeConstant.FEATURE_TYPE,
        },
        relations: [
            {
                rel: "System.LinkTypes.Hierarchy-Forward",
                url: "https://dev.azure.com/org/project/_apis/wit/workItems/2", // child = PBI id 2
                attributes: {}
            },
        ],
    };

    const pbi2: AdoWorkItemType = {
        id: 2,
        fields: {
            [FieldConstant.WORK_ITEM_FIELD_ID]: "2",
            [FieldConstant.WORK_ITEM_FIELD_TITLE]: "This is test work item 2",
            [FieldConstant.WORK_ITEM_FIELD_REMAINING_WORK]: 3,
            [FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE]: TypeConstant.PRODUCT_BACKLOG_ITEM_TYPE,
        },
    };

    const pbi3: AdoWorkItemType = {
        id: 3,
        fields: {
            [FieldConstant.WORK_ITEM_FIELD_ID]: "3",
            [FieldConstant.WORK_ITEM_FIELD_TITLE]: "This is test work item 3",
            [FieldConstant.WORK_ITEM_FIELD_REMAINING_WORK]: 3,
            [FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE]: TypeConstant.PRODUCT_BACKLOG_ITEM_TYPE,
        },
    };

    const pbi4: AdoWorkItemType = {
        id: 4,
        fields: {
            [FieldConstant.WORK_ITEM_FIELD_ID]: "4",
            [FieldConstant.WORK_ITEM_FIELD_TITLE]: "This is test work item 4",
            [FieldConstant.WORK_ITEM_FIELD_REMAINING_WORK]: 3,
            [FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE]: TypeConstant.PRODUCT_BACKLOG_ITEM_TYPE,
        },
    };

    const pbi5: AdoWorkItemType = {
        id: 5,
        fields: {
            [FieldConstant.WORK_ITEM_FIELD_ID]: "5",
            [FieldConstant.WORK_ITEM_FIELD_TITLE]: "This is test work item 5",
            [FieldConstant.WORK_ITEM_FIELD_REMAINING_WORK]: 3,
            [FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE]: TypeConstant.PRODUCT_BACKLOG_ITEM_TYPE,
        },
    };

    const workItems: AdoWorkItemType[] = [epic7420, epic7421, feature7428, pbi2, pbi3, pbi4, pbi5];

    //#region getEpicById
    it("getEpicById: returns epic type work item by the id of child work item among the provided array of work items", () => {
        const result = getEpicByWorkItem(pbi2, workItems);

        expect(result).toEqual(epic7420);
    });
    //#endregion

    //#region getFeatureById
    it("getFeatureById: returns feature type work item by the id of child work item among the provided array of work items", () => {
        const result = getFeatureByWorkItem(pbi2, workItems);

        expect(result).toEqual(feature7428);
    });
    //#endregion

    //#region calculateTotalRemainingWorkByWorkItems
    it("calculateTotalRemainingWorkByWorkItems: returns total remaining work hours of the work items given", () => {
        const result = calculateTotalRemainingWorkByWorkItems(workItems);

        expect(result).toEqual(12);
    });
    //#endregion
});

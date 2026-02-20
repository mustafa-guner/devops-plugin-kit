import { Icon } from "@fluentui/react/lib/Icon";
import { Button } from "azure-devops-ui/Button";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { Config } from "core/config";
import { IterationInfoType } from "features/iterations/types/IterationInfoType";
import { formatIteration } from "features/iterations/utils/iteration";
import FieldConstant from "features/work-items/constants/FieldConstant";
import TypeConstant from "features/work-items/constants/TypeConstant";
import { AdoWorkItemType } from "features/work-items/types/AdoWorkItemType";
import { getEpicByWorkItem, getFeatureByWorkItem, isTask } from "features/work-items/utils/workItem";
import React from "react";
import { WORK_ITEM_STATE_COLORS, WORK_ITEM_TYPE_ICON } from "../constants/DefaultConsant";
import { WorkItemMenu } from "./WorkItemMenu";

export function RenderCell(item: AdoWorkItemType, colKey: string, filteredIterations?: IterationInfoType[],
    context?: {
        canExpand?: boolean;
        isExpanded?: boolean;
        handleExpand?: (item: any) => void;
        orgFromItem?: string;
        projectFromItem?: string;
        topLevelParentWorkItems?: AdoWorkItemType[];
        remainingWorkTotalsByParent?: Map<number, number>;
    }
) {
    switch (colKey) {
        case "order":
            return <div className="text-center order-value">{item.displayOrder ?? item.order ?? ""}</div>;

        case "id":
            return <div className="text-center">{item.id || "-"}</div>;

        case "title": {
            const title = item.fields[FieldConstant.WORK_ITEM_FIELD_TITLE];
            const wiType = item.fields[FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE];
            const iconDef = WORK_ITEM_TYPE_ICON[wiType] || WORK_ITEM_TYPE_ICON["Default"];

            return (
                <span
                    className="backlog-title-cell"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        paddingLeft: 16,
                        minWidth: 0,
                    }}
                >
                    {context?.canExpand ? (

                        <>
                            <Button
                                subtle
                                iconProps={{ iconName: context?.isExpanded ? "ChevronDown" : "ChevronRight" }}
                                onClick={() => context?.handleExpand?.(item)}
                                ariaLabel={context?.isExpanded ? "Collapse" : "Expand"}
                                style={{ marginRight: 2, padding: 0, width: 16, height: 16 }}
                            />
                        </>
                    ) : null}

                    <Tooltip text={title} overflowOnly={true}>
                        <a
                            className="workitem-link"
                            onClick={() =>
                                window.open(
                                    `${Config.baseUrl}/${context?.orgFromItem}/${context?.projectFromItem}/_workitems/edit/${item.id}`,
                                    "_blank"
                                )
                            }
                            style={{ display: "flex", alignItems: "center", minWidth: 0 }}
                        >
                            <Icon
                                iconName={iconDef.iconName}
                                style={{
                                    color: iconDef.color,
                                    fontSize: 16,
                                    width: 18,
                                    height: 18,
                                    marginRight: 8,
                                    flex: "0 0 auto",
                                }}
                            />

                            <span
                                className="backlog-title-text"
                                style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                            >
                                {title}
                            </span>
                        </a>
                    </Tooltip>

                    <WorkItemMenu isTaskboardView={false} workItem={item} />
                </span>
            );
        }

        case "state":
            return (
                <span style={{ paddingLeft: "1.1rem", display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon
                        iconName="CircleShapeSolid"
                        style={{
                            color:
                                WORK_ITEM_STATE_COLORS[item.fields[FieldConstant.WORK_ITEM_FIELD_STATE]] ||
                                WORK_ITEM_STATE_COLORS["Default"],
                            fontSize: 12,
                            width: 12,
                            height: 12,
                        }}
                    />
                    {item.fields[FieldConstant.WORK_ITEM_FIELD_STATE]}
                </span>
            );

        case "type":
            return (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Tooltip text={item.fields[FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE]} overflowOnly={true}>
                        <span className="type-text">{item.fields[FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE]}</span>
                    </Tooltip>
                </span>
            );

        case "assignedTo":
            return (
                <span className="assigned-to-flex">
                    {item.fields[FieldConstant.WORK_ITEM_FIELD_ASSIGNED_TO]?.imageUrl && (
                        <img
                            src={item.fields[FieldConstant.WORK_ITEM_FIELD_ASSIGNED_TO].imageUrl}
                            alt={item.fields[FieldConstant.WORK_ITEM_FIELD_ASSIGNED_TO].displayName ?? ""}
                            style={{ width: 24, height: 24, borderRadius: "50%" }}
                        />
                    )}
                    <Tooltip text={item.fields[FieldConstant.WORK_ITEM_FIELD_ASSIGNED_TO]?.displayName || ""} overflowOnly={true}>
                        <span className="assigned-to-text">
                            {item.fields[FieldConstant.WORK_ITEM_FIELD_ASSIGNED_TO]?.displayName ?? ""}
                        </span>
                    </Tooltip >
                </span >
            );

        case "effort":
            return <div className="text-center">
                {!isNaN(Number(item.fields[FieldConstant.WORK_ITEM_FIELD_EFFORT]))
                    ? item.fields[FieldConstant.WORK_ITEM_FIELD_EFFORT] + " h"
                    : ""}
            </div>

        case "remainingWork":
            const wiType = String(item.fields[FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE] || "");
            const isPbiOrBug = wiType.toLowerCase() === TypeConstant.PRODUCT_BACKLOG_ITEM_TYPE.toLowerCase() || wiType.toLowerCase() === TypeConstant.BUG_TYPE.toLowerCase();
            const parentTotal = context?.remainingWorkTotalsByParent?.get(Number(item.id));
            const displayRemaining = !isTask(item) && isPbiOrBug && typeof parentTotal === "number" ? parentTotal : Number(item.fields[FieldConstant.WORK_ITEM_FIELD_REMAINING_WORK]);

            return <div className="text-center">
                {!isNaN(Number(displayRemaining))
                    ? displayRemaining + " h"
                    : ""}
            </div>

        case "timeSpent":
            return <div className="text-center">
                {!isNaN(Number(item.fields[FieldConstant.WORK_ITEM_FIELD_TIME_SPENT]))
                    ? item.fields[FieldConstant.WORK_ITEM_FIELD_TIME_SPENT] + " h"
                    : ""}
            </div>
        case "createdDate":
            return item.fields[FieldConstant.WORK_ITEM_FIELD_CREATED_DATE]
                ? new Date(item.fields[FieldConstant.WORK_ITEM_FIELD_CREATED_DATE]).toLocaleDateString()
                : "";

        case "closedDate":
            return item.fields[FieldConstant.WORK_ITEM_FIELD_CLOSED_DATE]
                ? new Date(item.fields[FieldConstant.WORK_ITEM_FIELD_CLOSED_DATE]).toLocaleDateString()
                : "";

        case "priority":
            return item.fields[FieldConstant.WORK_ITEM_FIELD_PRIORITY] || "";

        case "tags":
            return (
                <Tooltip text={item.fields[FieldConstant.WORK_ITEM_FIELD_TAGS] || ""} overflowOnly={false}>
                    <span>{item.fields[FieldConstant.WORK_ITEM_FIELD_TAGS] || ""}</span>
                </Tooltip>
            );

        case "changedDate":
            return item.fields[FieldConstant.WORK_ITEM_FIELD_CHANGED_DATE]
                ? new Date(item.fields[FieldConstant.WORK_ITEM_FIELD_CHANGED_DATE]).toLocaleDateString()
                : "";

        case "changedBy":
            return (
                <span className="assigned-to-flex">
                    {item.fields[FieldConstant.WORK_ITEM_FIELD_CHANGED_BY]?._links?.avatar?.href && (
                        <img
                            src={item.fields[FieldConstant.WORK_ITEM_FIELD_CHANGED_BY]._links.avatar.href}
                            alt={item.fields[FieldConstant.WORK_ITEM_FIELD_CHANGED_BY].displayName ?? ""}
                            style={{ width: 24, height: 24, borderRadius: "50%" }}
                        />
                    )}
                    <Tooltip text={item.fields[FieldConstant.WORK_ITEM_FIELD_CHANGED_BY]?.displayName || ""} overflowOnly={true}>
                        <span className="assigned-to-text">
                            {item.fields[FieldConstant.WORK_ITEM_FIELD_CHANGED_BY]?.displayName ?? ""}
                        </span>
                    </Tooltip>
                </span>
            );

        case "iterationPath": {
            const fullPath = item.fields[FieldConstant.WORK_ITEM_FIELD_ITERATION_PATH] || "";
            const iteration = filteredIterations?.find((it) => it.path === fullPath);
            return `${fullPath.split("\\").pop()}${iteration ? ` - ${formatIteration(iteration)}` : ""}`;
        }

        case "epics": {
            const epic = getEpicByWorkItem(item, context?.topLevelParentWorkItems ?? []);
            if (!epic) return "-";

            return (
                <a
                    className="workitem-link"
                    onClick={() => window.open(`${Config.baseUrl}/${context?.orgFromItem}/${context?.projectFromItem}/_workitems/edit/${epic.id}`, "_blank")}
                >
                    <Icon
                        iconName={"CrownSolid"}
                        style={{ color: "rgb(224,108,0)", fontSize: 16, width: 18, height: 18, marginRight: 8 }}
                    />
                    <span>{epic.fields[FieldConstant.WORK_ITEM_FIELD_TITLE]}</span>
                </a>
            );
        }

        case "features": {
            const feature = getFeatureByWorkItem(item, context?.topLevelParentWorkItems ?? []);
            if (!feature) return "-";

            return (
                <a
                    className="workitem-link"
                    onClick={() => window.open(`${Config.baseUrl}/${context?.orgFromItem}/${context?.projectFromItem}/_workitems/edit/${feature.id}`, "_blank")}
                >
                    <Icon
                        iconName={"Trophy"}
                        style={{ color: "rgb(119,59,147)", fontSize: 16, width: 18, height: 18, marginRight: 8 }}
                    />
                    <span>{feature.fields[FieldConstant.WORK_ITEM_FIELD_TITLE]}</span>
                </a>
            );
        }

        default:
            return "";
    }
}

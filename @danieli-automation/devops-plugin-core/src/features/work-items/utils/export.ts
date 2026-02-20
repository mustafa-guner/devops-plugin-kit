import FieldConstant from "features/work-items/constants/FieldConstant";
import TypeConstant from "features/work-items/constants/TypeConstant";
import { AdoWorkItemType } from "features/work-items/types/AdoWorkItemType";
import { getParentIdFromTask } from "features/work-items/utils/taskOrder";
import { getEpicByWorkItem, getFeatureByWorkItem, isTask } from "features/work-items/utils/workItem";
import { ColumnOptionInterface } from "src/app/interfaces/ColumnOptionInterface";
import { formatDate } from "src/app/utils/date";
import { normalizeString } from "src/app/utils/global";

type Props = {
    fileName: string;
    workItems: AdoWorkItemType[];
    orderedColumns: string[];
    columnLabels: ColumnOptionInterface[];
    topLevelParentWorkItems?: AdoWorkItemType[];
};

/**
 * Exports backlog rows into an XLSX file using the current column order/labels.
 *
 * @param options Export options and source rows.
 * @returns `true` when export succeeds, `false` when export is skipped.
 */
export async function exportBacklogToExcel(options: Props): Promise<boolean> {
    const { fileName, workItems, orderedColumns, columnLabels, topLevelParentWorkItems = [] } = options;
    if (!orderedColumns?.length) return false;

    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Backlog", {
        views: [{ state: "frozen", ySplit: 1 }],
    });

    const labelByKey = new Map(columnLabels.map((c) => [c.key, c.label]));
    const headerLabels = orderedColumns.map((k) => labelByKey.get(k) || k);

    worksheet.columns = orderedColumns.map((k, i) => ({
        key: k,
        width: getColumnWidth(k, String(headerLabels[i])),
    }));

    const headerRow = worksheet.addRow(headerLabels);
    styleHeaderRow(headerRow);

    //make the header row filterable
    worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: orderedColumns.length },
    };
    const parentRemainingWorkTotals = buildParentRemainingWorkTotals(workItems);

    let prevArea = "";
    for (const item of workItems) {
        const currentArea = normalizeString(item.fields?.[FieldConstant.WORK_ITEM_FIELD_AREA_PATH]);
        if (currentArea !== prevArea) {
            const area = String(item.fields?.[FieldConstant.WORK_ITEM_FIELD_AREA_PATH] || "");
            const sepRow = worksheet.addRow([area]);
            if (orderedColumns.length > 1) {
                worksheet.mergeCells(sepRow.number, 1, sepRow.number, orderedColumns.length);
            }
            styleAreaSeparatorRow(sepRow);
            prevArea = currentArea;
        }

        const values = orderedColumns.map((colKey) =>
            getExportCellValue(item, colKey, topLevelParentWorkItems, parentRemainingWorkTotals)
        );
        const row = worksheet.addRow(values);

        const isTask = String(item.fields?.[FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE] || "").toLowerCase() ===
            TypeConstant.TASK_TYPE.toLowerCase();
        styleDataRow(row, isTask);
    }

    applyBordersAndAlignment(worksheet, orderedColumns.length);

    const buffer = await workbook.xlsx.writeBuffer();
    downloadBufferAsXlsx(buffer, fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`);
    return true;
}

//#region Private Functions
/**
 * Applies header styling to the first row of the worksheet.
 *
 * @param row ExcelJS row instance.
 */
function styleHeaderRow(row: any) {
    row.height = 22;
    row.eachCell((cell: any) => {
        cell.font = { bold: true, color: { argb: "FF111111" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F3F3" } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
    });
}

/**
 * Applies visual styling to area-path separator rows.
 *
 * @param row ExcelJS row instance.
 */
function styleAreaSeparatorRow(row: any) {
    row.height = 20;
    row.getCell(1).font = { bold: true, color: { argb: "FF111111" } };
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7F7F7" } };
    row.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
}

/**
 * Applies standard data-row styles, with slightly smaller text for task rows.
 *
 * @param row ExcelJS row instance.
 * @param isTask Indicates whether the row represents a task.
 */
function styleDataRow(row: any, isTask: boolean) {
    row.height = 20;
    row.eachCell((cell: any) => {
        cell.font = {
            color: { argb: "FF111111" },
            size: isTask ? 10 : 11,
        };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
    });
}

/**
 * Applies borders and default alignment to all cells in the worksheet.
 *
 * @param worksheet ExcelJS worksheet instance.
 * @param columnCount Number of visible export columns.
 */
function applyBordersAndAlignment(worksheet: any, columnCount: number) {
    const thin = { style: "thin", color: { argb: "FFD6D6D6" } };
    worksheet.eachRow((row: any) => {
        for (let c = 1; c <= columnCount; c++) {
            const cell = row.getCell(c);
            cell.border = { top: thin, left: thin, bottom: thin, right: thin };
            if (!cell.alignment) {
                cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
            } else {
                cell.alignment = { ...cell.alignment, vertical: "middle", wrapText: true };
            }
        }
    });
}

/**
 * Triggers browser download for an XLSX buffer.
 *
 * @param buffer XLSX file content.
 * @param fileName Download file name.
 */
function downloadBufferAsXlsx(buffer: ArrayBuffer, fileName: string) {
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}

/**
 * Resolves export cell value for a given work item and column key.
 *
 * @param item Source work item.
 * @param colKey Column key.
 * @param topLevelParentWorkItems Top-level hierarchy used for epic/feature resolution.
 * @param parentRemainingWorkTotals Precomputed parent remaining-work totals.
 * @returns Display-ready value for a spreadsheet cell.
 */
function getExportCellValue(item: AdoWorkItemType, colKey: string, topLevelParentWorkItems: AdoWorkItemType[], parentRemainingWorkTotals: Map<number, number>): string | number {
    switch (colKey) {
        case "order":
            return Number(item.displayOrder ?? item.order ?? "");
        case "id":
            return Number(item.id ?? "");
        case "title": {
            const title = String(item.fields?.[FieldConstant.WORK_ITEM_FIELD_TITLE] ?? "");
            return isTask(item) ? `  ${title}` : title;
        }
        case "state":
            return String(item.fields?.[FieldConstant.WORK_ITEM_FIELD_STATE] ?? "");
        case "type":
            return String(item.fields?.[FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE] ?? "");
        case "assignedTo": {
            const v = item.fields?.[FieldConstant.WORK_ITEM_FIELD_ASSIGNED_TO];
            if (v && typeof v === "object") return String(v.displayName ?? "");
            return String(v ?? "");
        }
        case "effort":
            return item.fields?.[FieldConstant.WORK_ITEM_FIELD_EFFORT]
        case "remainingWork":
            return getRemainingWorkForExport(item, parentRemainingWorkTotals);
        case "timeSpent":
            return item.fields?.[FieldConstant.WORK_ITEM_FIELD_TIME_SPENT]
        case "createdDate":
            return formatDate(item.fields?.[FieldConstant.WORK_ITEM_FIELD_CREATED_DATE]);
        case "closedDate":
            return formatDate(item.fields?.[FieldConstant.WORK_ITEM_FIELD_CLOSED_DATE]);
        case "priority":
            return String(item.fields?.[FieldConstant.WORK_ITEM_FIELD_PRIORITY] ?? "");
        case "tags":
            return String(item.fields?.[FieldConstant.WORK_ITEM_FIELD_TAGS] ?? "");
        case "changedDate":
            return formatDate(item.fields?.[FieldConstant.WORK_ITEM_FIELD_CHANGED_DATE]);
        case "changedBy": {
            const v = item.fields?.[FieldConstant.WORK_ITEM_FIELD_CHANGED_BY];
            if (v && typeof v === "object") return String(v.displayName ?? "");
            return String(v ?? "");
        }
        case "iterationPath": {
            const path = String(item.fields?.[FieldConstant.WORK_ITEM_FIELD_ITERATION_PATH] ?? "");
            return path ? path.split("\\").pop() || path : "";
        }
        case "epics": {
            const epic = getEpicByWorkItem(item, topLevelParentWorkItems);
            return epic ? String(epic.fields?.[FieldConstant.WORK_ITEM_FIELD_TITLE] ?? "") : "-";
        }
        case "features": {
            const feature = getFeatureByWorkItem(item, topLevelParentWorkItems);
            return feature ? String(feature.fields?.[FieldConstant.WORK_ITEM_FIELD_TITLE] ?? "") : "-";
        }
        default: {
            const raw = item.fields?.[colKey];
            return raw == null ? "" : String(raw);
        }
    }
}

/**
 * Returns remaining-work value for export, aggregating parent totals for non-task rows.
 *
 * @param item Source work item.
 * @param parentRemainingWorkTotals Precomputed totals keyed by parent id.
 * @returns Remaining-work display value.
 */
function getRemainingWorkForExport(item: AdoWorkItemType, parentRemainingWorkTotals: Map<number, number>): number | string {

    if (isTask(item)) {
        return item.fields?.[FieldConstant.WORK_ITEM_FIELD_REMAINING_WORK];
    }

    const total = parentRemainingWorkTotals.get(Number(item.id));
    if (typeof total === "number") {
        return total;
    }

    return item.fields?.[FieldConstant.WORK_ITEM_FIELD_REMAINING_WORK];
}

/**
 * Aggregates remaining work of task items by parent id.
 *
 * @param workItems Ordered backlog items.
 * @returns Map of parent work item id to summed remaining work.
 */
function buildParentRemainingWorkTotals(workItems: AdoWorkItemType[]): Map<number, number> {
    const totals = new Map<number, number>();

    for (const wi of workItems) {

        if (!isTask(wi)) continue;

        const parentId = getParentIdFromTask(wi);
        if (parentId == null || Number.isNaN(parentId)) continue;

        const remaining = Number(wi.fields?.[FieldConstant.WORK_ITEM_FIELD_REMAINING_WORK]);
        if (!Number.isFinite(remaining)) continue;

        totals.set(parentId, (totals.get(parentId) ?? 0) + remaining);
    }

    return totals;
}

/**
 * Resolves export column width for a known column key.
 *
 * @param colKey Column key.
 * @param headerLabel Header label used as fallback sizing hint.
 * @returns Width value used by ExcelJS column config.
 */
function getColumnWidth(colKey: string, headerLabel: string): number {
    const defaults: Record<string, number> = {
        order: 12,
        id: 10,
        title: 44,
        state: 16,
        type: 22,
        assignedTo: 24,
        effort: 12,
        remainingWork: 16,
        timeSpent: 14,
        createdDate: 16,
        tags: 24,
        iterationPath: 24,
        epics: 28,
        features: 28,
    };
    return defaults[colKey] ?? Math.max(14, Math.min(40, headerLabel.length + 6));
}

//#endregion

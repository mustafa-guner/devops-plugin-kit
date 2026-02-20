import { AdoWorkItemType } from "./AdoWorkItemType";

export type WorkItemRowContextMenuType = {
    handleRowContextMenu: (e: React.MouseEvent<HTMLTableRowElement>, wi: AdoWorkItemType) => void;
    ContextMenuPortal: JSX.Element | null;
    DeleteDialog: JSX.Element | null;
    CancelChildrenDialog: JSX.Element | null;
};
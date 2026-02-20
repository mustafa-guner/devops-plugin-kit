import { Icon } from "@fluentui/react/lib/Icon";
import { Dropdown } from "azure-devops-ui/Dropdown";
import { useIterationStore } from "features/iterations/stores/useIterationStore";
import { getWorkItemStates } from "features/work-items/api/states";
import { WORK_ITEM_STATE_COLORS } from "features/work-items/constants/DefaultConsant";
import FieldConstant from "features/work-items/constants/FieldConstant";
import { useUpdateWorkItemData } from "features/work-items/hooks/useData/useUpdateWorkItemData";
import { AdoWorkItemType } from "features/work-items/types/AdoWorkItemType";
import * as React from "react";
import QueryKeyConstant from "src/app/constants/QueryKeyConstant";
import { WorkItemStoreKeyConstant } from "src/app/constants/StoreKeyConstant";

type Props = {
    workItem: AdoWorkItemType;
    errorHandlers?: {
        setCardError: (msg: string | null) => void;
        clearCardError: () => void;
    };
};

export function WorkItemState({ workItem, errorHandlers }: Props) {
    const { currentIteration, selectedIteration } = useIterationStore();
    const updateFields = useUpdateWorkItemData();
    const currentState: string = workItem?.fields?.[FieldConstant.WORK_ITEM_FIELD_STATE] ?? "Unknown";
    const dropdownRef = React.useRef<any>(null);
    const isMountedRef = React.useRef(true);

    const [isEditEnabled, setIsEditEnabled] = React.useState(false);
    const [selectedItem, setSelectedItem] = React.useState<string>(currentState);
    const [states, setStates] = React.useState<{ id: string; text: string }[]>([]);

    const color = WORK_ITEM_STATE_COLORS[currentState] ?? WORK_ITEM_STATE_COLORS["Default"];
    const project = workItem.fields[FieldConstant.WORK_ITEM_FIELD_TEAM_PROJECT];
    const type = workItem.fields[FieldConstant.WORK_ITEM_FIELD_WORK_ITEM_TYPE];

    React.useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // fetch states only while editing
    React.useEffect(() => {
        if (!isEditEnabled) return;

        let cancelled = false;

        (async () => {
            try {
                const fetched = await getWorkItemStates(project, type);
                if (!cancelled && isMountedRef.current) {
                    const normalized =
                        (fetched || []).map((s: any) => ({
                            id: String(s.id ?? s.name ?? s.text),
                            text: String(s.text ?? s.name ?? s.id),
                        })) ?? [];

                    setStates(normalized);

                    if (dropdownRef.current?.expand) {
                        dropdownRef.current.expand();
                    }
                }
            } catch (err: any) {
                if (!cancelled && isMountedRef.current) {
                    errorHandlers?.setCardError?.(
                        err?.message || "Failed to load states"
                    );
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [project, type, isEditEnabled, errorHandlers?.setCardError]);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest?.(".tb-state-dropdown")) {
                setIsEditEnabled(false);
            }
        };

        if (isEditEnabled) {
            document.addEventListener("click", handleClickOutside);
            if (dropdownRef.current?.expand) {
                dropdownRef.current.expand();
            }
        }

        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, [isEditEnabled]);

    const saveState = (newState: string) => {
        if (!newState || newState === currentState) return;

        const project = String(workItem.fields[FieldConstant.WORK_ITEM_FIELD_TEAM_PROJECT]);
        const parentId = Number(workItem.fields[FieldConstant.WORK_ITEM_FIELD_PARENT]);
        const childrenKey = [QueryKeyConstant.CHILDREN_QUERY_KEY, project, parentId];

        updateFields.mutate({
            workItemId: workItem.id,
            project: project,
            queryKeys: [childrenKey] as const,
            fieldUpdates: { [FieldConstant.WORK_ITEM_FIELD_STATE]: newState },
            storeKeys: [WorkItemStoreKeyConstant.workItems],
            storeIteration: selectedIteration ?? currentIteration ?? undefined,
        });

        if (!isMountedRef.current) return;
    };

    const onSelectState = async (_: any, item: any) => {
        const next = (item?.id as string) ?? currentState;
        setSelectedItem(next);
        setIsEditEnabled(false);
        saveState(next);
    };

    return (
        <div className="tb-card-state">
            {isEditEnabled ? (
                <Dropdown
                    ref={dropdownRef}
                    showFilterBox={true}
                    ariaLabel="State"
                    className="tb-state-dropdown"
                    placeholder={currentState}
                    items={states}
                    filterByText={true}
                    onSelect={onSelectState}
                />
            ) : (
                <div
                    className="editable-data"
                    title="Click to edit state"
                    onClick={() => setIsEditEnabled(true)}
                >
                    <Icon iconName="CircleShapeSolid"
                        style={{
                            color,
                            fontSize: 8,
                            width: 8,
                            height: 8,
                            marginRight: 6,
                        }}
                    />
                    {currentState || selectedItem}
                </div>
            )}
        </div>
    );
}

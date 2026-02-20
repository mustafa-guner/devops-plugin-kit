import { Avatar } from "app/components/Avatar";
import { Dropdown } from "azure-devops-ui/Dropdown";
import { PersonaSize } from "azure-devops-ui/Persona";
import { useIterationStore } from "features/iterations/stores/useIterationStore";
import { getCurrentTeamMembers } from "features/teams/api/users";
import { useProjectStore } from "features/teams/stores/useProjectStore";
import { TeamMember } from "features/teams/types/TeamMemberType";
import FieldConstant from "features/work-items/constants/FieldConstant";
import { useUpdateWorkItemData } from "features/work-items/hooks/useData/useUpdateWorkItemData";
import { AdoWorkItemType } from "features/work-items/types/AdoWorkItemType";
import { getAssigneeFromWorkItem } from "features/work-items/utils/workItem";
import React, { useEffect, useMemo, useState } from "react";
import { WorkItemStoreKeyConstant } from "src/app/constants/StoreKeyConstant";
import Helper from "src/app/utils/column";
import { getCurrentUser } from "src/app/utils/global";
import { getChildrenQueryKey } from "src/app/utils/queryKey";

type Props = {
    workItem: AdoWorkItemType;
    onUpdated?: (w: any) => void;
    errorHandlers?: {
        setCardError: (msg: string | null) => void;
        clearCardError: () => void;
    };
};

export function WorkItemAssignee({ workItem, onUpdated, errorHandlers }: Props) {
    // Remote
    const updateFields = useUpdateWorkItemData();
    const { selectedProjects } = useProjectStore();
    const { currentIteration, selectedIteration } = useIterationStore();

    // Local
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [selectedAssignee, setSelectedAssignee] = useState<TeamMember>(getAssigneeFromWorkItem(workItem));
    const [isEditEnabled, setIsEditEnabled] = useState(false);
    const [loadingMembers, setLoadingMembers] = useState<boolean>(false);

    const dropdownRef = React.useRef<any>(null);
    const isMountedRef = React.useRef(true);

    // Keep local display in sync with prop changes
    useEffect(() => {
        if (isEditEnabled) return;
        setSelectedAssignee(getAssigneeFromWorkItem(workItem));
    }, [
        isEditEnabled,
        workItem.id,
        workItem.fields?.[FieldConstant.WORK_ITEM_FIELD_ASSIGNED_TO],
    ]);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const onDropdownOpen = async () => {
        setIsEditEnabled(true);

        if (members.length === 0 && !loadingMembers) {
            setLoadingMembers(true);
            try {
                const project = workItem.fields[FieldConstant.WORK_ITEM_FIELD_TEAM_PROJECT];
                const fetched = await getCurrentTeamMembers(project, selectedProjects);
                if (!isMountedRef.current) return;

                const fetchedMembers: TeamMember[] = (fetched || []).map((m: any, idx: number) => ({
                    id: (m.descriptor ?? m.uniqueName ?? `member-${workItem.id ?? "0"}-${idx}`).toString(),
                    descriptor: m.descriptor,
                    displayName: m.displayName ?? m.uniqueName ?? `Member ${idx + 1}`,
                    uniqueName: m.uniqueName ?? "",
                    imageUrl: m.imageUrl ?? "",
                }));

                const currentUser = await getCurrentUser();
                const currentLogin = (currentUser.name || "").toLowerCase();
                const currentDescriptor = (currentUser.descriptor || "").toLowerCase();

                const exists = fetchedMembers.some((m) => {
                    const memberLogin = (m.uniqueName || "").toLowerCase();
                    const memberDescriptor = (m.descriptor || "").toLowerCase();
                    return (
                        (memberLogin && memberLogin === currentLogin) ||
                        (memberDescriptor && memberDescriptor === currentDescriptor)
                    );
                });

                if (!exists && currentUser) {
                    fetchedMembers.unshift({
                        id: currentUser.id,
                        descriptor: currentUser.descriptor,
                        displayName: currentUser.displayName || currentUser.name || "Me",
                        uniqueName: currentUser.name,
                        imageUrl: currentUser.imageUrl || "",
                    } as TeamMember);
                }

                setMembers(fetchedMembers);
            } catch (err: any) {
                if (!isMountedRef.current) return;
                errorHandlers?.setCardError(err?.message || "Failed to load team members");
            } finally {
                setLoadingMembers(false);
            }
        }
    };

    // Ensure dropdown opens after members are loaded
    useEffect(() => {
        if (isEditEnabled && dropdownRef.current?.expand) {
            dropdownRef.current.expand();
        }
    }, [isEditEnabled, members, loadingMembers]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest?.(".tb-assignee-dropdown")) {
                setIsEditEnabled(false);
            }
        };

        if (isEditEnabled) {
            document.addEventListener("click", handleClickOutside);
        }

        return () => document.removeEventListener("click", handleClickOutside);
    }, [isEditEnabled]);

    function updateAssignedTo(newMember: TeamMember) {
        const project = String(workItem.fields?.[FieldConstant.WORK_ITEM_FIELD_TEAM_PROJECT] ?? "");
        const parentId = Number(workItem.fields?.[FieldConstant.WORK_ITEM_FIELD_PARENT] ?? 0);

        if (!project || !workItem.id) return;
        if (!isMountedRef.current) return;

        const isUnassigned = !newMember || newMember.id === "";
        const serverAssignedTo = isUnassigned ? "" : (newMember.uniqueName || newMember.displayName);
        const optimisticAssignedTo = isUnassigned ? null : newMember;

        // Update BOTH query caches that can contain this work item.
        const childFields = Helper.getColumnFields();
        const childrenKey = getChildrenQueryKey(project, parentId, childFields)

        updateFields.mutate({
            workItemId: workItem.id,
            project,
            queryKeys: [childrenKey],
            fieldUpdates: {
                [FieldConstant.WORK_ITEM_FIELD_ASSIGNED_TO]: serverAssignedTo,
            },
            optimisticFieldUpdates: {
                [FieldConstant.WORK_ITEM_FIELD_ASSIGNED_TO]: optimisticAssignedTo,
            },
            storeKeys: [WorkItemStoreKeyConstant.childrenWorkItems, WorkItemStoreKeyConstant.workItems],
            storeIteration: selectedIteration ?? currentIteration ?? undefined,
        });

        onUpdated?.(workItem.id);
    }

    const renderDropdownItem = (_rowIndex: number, _columnIndex: number, _tableColumn: any, item: any) => {
        const data: TeamMember = item?.data ?? {
            id: "",
            displayName: "Unassigned",
            uniqueName: "",
            imageUrl: "",
        };

        const imgUrl = data.imageUrl ?? "";
        const match = imgUrl ? imgUrl.match(/id=([0-9a-fA-F-]+)/) : null;
        const idFromImage = match ? match[1] : null;

        const isSelected =
            data.id === selectedAssignee.id ||
            (idFromImage && idFromImage === selectedAssignee.id);

        return (
            <div className={`assignee-dropdown-item ${isSelected ? "selected" : ""}`} key={`dropdown-item-${data.id}`}>
                <div className="assignee-info">
                    <Avatar person={item?.data} size={PersonaSize.size32} />
                    <div className="assignee-display-info">
                        <p className="assignee-name">{data.displayName}</p>
                        {data.uniqueName && <small className="assignee-email">{data.uniqueName}</small>}
                    </div>
                </div>
            </div>
        );
    };

    const dropdownItems = useMemo(() => {
        if (loadingMembers) return [];

        const unassignedId = `unassigned-${workItem.id ?? "0"}`;
        const defaultImage = "static/images/default-unassigned.png";

        return [
            {
                id: unassignedId,
                text: "Unassigned",
                data: { id: "", displayName: "Unassigned", uniqueName: "", imageUrl: defaultImage },
            },
            ...members.map((m, idx) => ({
                id: (m.id ?? m.uniqueName ?? `member-${workItem.id ?? "0"}-${idx}`).toString(),
                text: m.displayName,
                data: m,
            })),
        ];
    }, [members, loadingMembers, workItem.id]);

    const onSelectAssignee = async (_: any, item: any) => {
        if (!item?.data) return;

        // show immediately
        setSelectedAssignee(item.data);

        setIsEditEnabled(false);
        updateAssignedTo(item.data);
    };

    return (
        <div className="tb-card-meta">
            {isEditEnabled ? (
                <Dropdown
                    ref={dropdownRef}
                    showFilterBox={true}
                    ariaLabel="Assign person"
                    width={300}
                    className="tb-assignee-dropdown"
                    placeholder={selectedAssignee.displayName}
                    items={dropdownItems}
                    filterByText={true}
                    onSelect={onSelectAssignee}
                    loading={loadingMembers}
                    renderItem={renderDropdownItem}
                />
            ) : (
                <div className="editable-data assignee-display">
                    <div className="tb-card-avatar">
                        <Avatar size={PersonaSize.size20} person={selectedAssignee} />
                    </div>
                    <div
                        className="tb-card-assignee-title"
                        title={`${selectedAssignee.uniqueName}`}
                        onClick={onDropdownOpen}
                    >
                        {selectedAssignee.displayName}
                    </div>
                </div>
            )}
        </div>
    );
}

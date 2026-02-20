import type { CapacityMemberType } from "features/capacity/types/CapacityMemberType";

export type CapacityPerDayEntry = {
    input: string;
    value: number;
    error: string | null;
};

export type CapacityStoreType = {
    capacityPerDay: Record<string, CapacityPerDayEntry>;

    members: Record<string, CapacityMemberType[]>;

    updateCapacityPerDay: (entryId: string, inputValue: string) => void;
    setCapacityPerDay: (entryId: string, value: number) => void;
    removeCapacityPerDay: (entryId: string) => void;
    clearAll: () => void;
    getCapacityValues: () => Record<string, number>;

    addMembers: (teamKey: string, newMembers: CapacityMemberType[]) => void;
    removeMember: (teamKey: string, memberId: string) => void;
    updateMember: (teamKey: string, memberId: string, updates: Partial<CapacityMemberType>) => void;
    setMembers: (teamKey: string, membersList: CapacityMemberType[]) => void;
    getMembers: (teamKey: string) => CapacityMemberType[];

    addActivity: (teamKey: string, memberId: string) => void;
    removeActivity: (teamKey: string, memberId: string, activityId: string) => void;
    updateActivity: (teamKey: string, memberId: string, activityId: string, activity: string) => void;
};

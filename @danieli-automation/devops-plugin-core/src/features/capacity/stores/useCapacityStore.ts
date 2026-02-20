import type { CapacityStoreType } from "features/capacity/stores/types/CapacityStoreType";
import type { ActivityEntry, CapacityMemberType } from "features/capacity/types/CapacityMemberType";
import { parseCapacityValue, validateCapacityInput } from "features/capacity/utils/capacity";
import { create } from "zustand";

let activityCounter = 0;
function generateActivityId(): string {
    activityCounter += 1;
    return `activity_${Date.now()}_${activityCounter}`;
}

export const useCapacityStore = create<CapacityStoreType>((set, get) => ({
    capacityPerDay: {},
    members: {},

    updateCapacityPerDay: (entryId: string, inputValue: string) => {
        const error = validateCapacityInput(inputValue);
        const value = error ? 0 : parseCapacityValue(inputValue);

        set((state) => ({
            capacityPerDay: {
                ...state.capacityPerDay,
                [entryId]: { input: inputValue, value, error },
            },
        }));
    },

    setCapacityPerDay: (entryId: string, value: number) => {
        set((state) => ({
            capacityPerDay: {
                ...state.capacityPerDay,
                [entryId]: { input: String(value), value, error: null },
            },
        }));
    },

    removeCapacityPerDay: (entryId: string) => {
        set((state) => {
            const next = { ...state.capacityPerDay };
            delete next[entryId];
            return { capacityPerDay: next };
        });
    },

    clearAll: () => set({ capacityPerDay: {}, members: {} }),

    getCapacityValues: () => {
        const entries = get().capacityPerDay;
        const result: Record<string, number> = {};
        for (const [id, entry] of Object.entries(entries)) {
            if (!entry.error) {
                result[id] = entry.value;
            }
        }
        return result;
    },

    addMembers: (teamKey: string, newMembers: CapacityMemberType[]) => {
        set((state) => {
            const existing = state.members[teamKey] ?? [];
            const existingIds = new Set(existing.map((m) => m.descriptor));
            const toAdd = newMembers.filter((m) => !existingIds.has(m.descriptor));
            return {
                members: {
                    ...state.members,
                    [teamKey]: [...existing, ...toAdd],
                },
            };
        });
    },

    removeMember: (teamKey: string, memberId: string) => {
        set((state) => {
            const existing = state.members[teamKey] ?? [];
            return {
                members: {
                    ...state.members,
                    [teamKey]: existing.filter((m) => m.id !== memberId),
                },
            };
        });
    },

    updateMember: (teamKey: string, memberId: string, updates: Partial<CapacityMemberType>) => {
        set((state) => {
            const existing = state.members[teamKey] ?? [];
            return {
                members: {
                    ...state.members,
                    [teamKey]: existing.map((m) =>
                        m.id === memberId ? { ...m, ...updates } : m
                    ),
                },
            };
        });
    },

    setMembers: (teamKey: string, membersList: CapacityMemberType[]) => {
        set((state) => ({
            members: {
                ...state.members,
                [teamKey]: membersList,
            },
        }));
    },

    getMembers: (teamKey: string) => {
        return get().members[teamKey] ?? [];
    },

    addActivity: (teamKey: string, memberId: string) => {
        set((state) => {
            const existing = state.members[teamKey] ?? [];
            const newEntry: ActivityEntry = {
                id: generateActivityId(),
                activity: "",
            };
            return {
                members: {
                    ...state.members,
                    [teamKey]: existing.map((m) =>
                        m.id === memberId
                            ? { ...m, activities: [...m.activities, newEntry] }
                            : m
                    ),
                },
            };
        });
    },

    removeActivity: (teamKey: string, memberId: string, activityId: string) => {
        set((state) => {
            const existing = state.members[teamKey] ?? [];
            const newCapacity = { ...state.capacityPerDay };
            delete newCapacity[activityId];
            return {
                capacityPerDay: newCapacity,
                members: {
                    ...state.members,
                    [teamKey]: existing.map((m) => {
                        if (m.id !== memberId) return m;
                        const filtered = m.activities.filter((a) => a.id !== activityId);
                        return { ...m, activities: filtered.length > 0 ? filtered : m.activities };
                    }),
                },
            };
        });
    },

    updateActivity: (teamKey: string, memberId: string, activityId: string, activity: string) => {
        set((state) => {
            const existing = state.members[teamKey] ?? [];
            return {
                members: {
                    ...state.members,
                    [teamKey]: existing.map((m) => {
                        if (m.id !== memberId) return m;
                        return {
                            ...m,
                            activities: m.activities.map((a) =>
                                a.id === activityId ? { ...a, activity } : a
                            ),
                        };
                    }),
                },
            };
        });
    },
}));

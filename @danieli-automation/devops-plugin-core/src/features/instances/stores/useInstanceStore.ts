import { CrossSprintInstanceType } from "core/types/instance/CrossSprintInstanceType";
import { InstanceStoreType } from "features/instances/stores/types/InstanceStoreType";
import { create } from "zustand";

export const useInstanceStore = create<InstanceStoreType>((set) => ({
    currentInstance: null,

    setCurrentInstance: (instance: CrossSprintInstanceType | null) => set({ currentInstance: instance }),
}));

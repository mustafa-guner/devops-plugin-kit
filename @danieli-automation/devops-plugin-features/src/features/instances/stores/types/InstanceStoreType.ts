import { CrossSprintInstanceType } from "features/instances/types/CrossSprintInstanceType";

export type InstanceStoreType = {
    currentInstance: CrossSprintInstanceType | null;

    setCurrentInstance: (instance: CrossSprintInstanceType | null) => void;
};
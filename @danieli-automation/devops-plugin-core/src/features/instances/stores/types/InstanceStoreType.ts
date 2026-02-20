import { CrossSprintInstanceType } from "core/types/instance/CrossSprintInstanceType";

export type InstanceStoreType = {
    currentInstance: CrossSprintInstanceType | null;

    setCurrentInstance: (instance: CrossSprintInstanceType | null) => void;
};
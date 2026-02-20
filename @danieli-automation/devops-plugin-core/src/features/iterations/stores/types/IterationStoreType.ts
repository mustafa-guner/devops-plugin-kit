import { IterationInfoType } from "../../types/IterationInfoType";

export type IterationStoreType = {
    iterations: IterationInfoType[];
    isLoading: boolean;
    currentIteration: IterationInfoType | undefined;
    selectedIteration: IterationInfoType | undefined;

    setIterations: (iterations: IterationInfoType[]) => void;
    setIsLoading: (isLoading: boolean) => void;
    setCurrentIteration: (iteration: IterationInfoType | undefined) => void;
    setSelectedIteration: (iteration: IterationInfoType | undefined) => void;
}
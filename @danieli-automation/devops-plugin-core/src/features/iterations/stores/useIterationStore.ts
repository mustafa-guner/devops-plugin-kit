import { IterationStoreType } from "features/iterations/stores/types/IterationStoreType";
import { IterationInfoType } from "features/iterations/types/IterationInfoType";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useIterationStore = create<IterationStoreType>()(
    persist(
        (set, get) => ({
            iterations: [],
            isLoading: false,
            currentIteration: undefined,
            selectedIteration: undefined,

            setIterations: (iterations: IterationInfoType[]) => set({ iterations }),
            setIsLoading: (isLoading: boolean) => set({ isLoading }),
            setCurrentIteration: (iteration: IterationInfoType | undefined) => set({ currentIteration: iteration }),
            setSelectedIteration: (iteration: IterationInfoType | undefined) => set({ selectedIteration: iteration }),
        }),
        {
            name: "iteration-store",
            storage: createJSONStorage(() => localStorage),

            partialize: (state) => ({
                iterations: state.iterations,
                // currentIteration: state.currentIteration,
            }),
        }
    )
);
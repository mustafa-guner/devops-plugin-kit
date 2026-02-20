import { describe, expect, it } from "vitest";
import { useIterationStore } from "../../../iterations/stores/useIterationStore.js";

describe("useIterationStore", () => {
    //#region currentInstance
    it("currentInstance: has correct initial state", () => {
        expect(useIterationStore.getState().currentIteration).toEqual(null);
    });

    it("setCurrentInstance: sets instance as current iteration.", () => {
        const iteration = {
            id: "1",
            name: "Iteration Name",
            path: "Iteration Path",
            startDate: "2025-01-01",
            finishDate: "2025-01-15",
            projectId: "project-id-1",
            teamId: "team-id-1",
            paths: ["Path A", "Path B", "Path C"]
        }
        useIterationStore.getState().setCurrentIteration(iteration);
        expect(useIterationStore.getState().currentIteration).toEqual(iteration);
    });
    //#endregion
});
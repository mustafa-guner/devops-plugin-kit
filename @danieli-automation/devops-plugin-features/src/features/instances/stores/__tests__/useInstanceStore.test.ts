import { describe, expect, it } from "vitest";
import { useInstanceStore } from "../useInstanceStore";

describe("useInstanceStore", () => {
    //#region currentInstance
    it("currentInstance: has correct initial state", () => {
        expect(useInstanceStore.getState().currentInstance).toEqual(null);
    });

    it("setCurrentInstance: sets instance as current iteration.", () => {
        const instance = {
            id: "1",
            name: "Instance Name",
            org: "demo-org",
            createdBy: { id: "u1" },
            owners: [],
            projectTeamPairs: [],
            createdAt: "2025-01-01T00:00:00.000Z",
            updatedAt: "2025-01-01T00:00:00.000Z"
        };
        useInstanceStore.getState().setCurrentInstance(instance);
        expect(useInstanceStore.getState().currentInstance).toEqual(instance);
    });
    //#endregion
});

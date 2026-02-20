import { useUIStore } from "app/stores/useUIStore";
import { describe, expect, it } from "vitest";

describe("useUIStore", () => {
    it("has correct initial state", () => {
        expect(useUIStore.getState().areAllExpanded).toEqual(false);
    });

    it("expandRow marks id as expanded", () => {
        useUIStore.getState().setExpandAll(true);
        expect(useUIStore.getState().areAllExpanded).toBe(true);
    });
});
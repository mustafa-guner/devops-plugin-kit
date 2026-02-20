import { IterationInfoType } from "features/iterations/types/IterationInfoType";
import { describe, expect, it } from "vitest";
import { formatIteration } from "../iteration";

describe("Utils: Iteration Helper Tests: ", () => {

    //#endregion formatIteration
    it("formatIteration: returns formatted iteration in specified format if there is any provided iteration", () => {

        const iteration: IterationInfoType = {
            id: "1",
            name: "Iteration Name",
            path: "Iteration Path",
            startDate: "2026-01-15T00:00:00.000Z",
            finishDate: "2026-01-31T23:59:00.000Z",
            projectId: "ProjectId",
            teamId: "TeamId"
        }

        expect(formatIteration(iteration)).toBe("2026 Jan (15-31)");
    });

    it("formatIteration: returns empty string if startDate is invalid", () => {

        const iteration: IterationInfoType = {
            id: "1",
            name: "Iteration Name",
            path: "Iteration Path",
            startDate: "2026-01-15",
            finishDate: "not-a-date",
            projectId: "ProjectId",
            teamId: "TeamId",
        };

        expect(formatIteration(iteration as any)).toBe("");
    });

    //#endregion
})
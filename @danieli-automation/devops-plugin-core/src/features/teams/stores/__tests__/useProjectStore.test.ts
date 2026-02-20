import { describe, expect, it } from "vitest";
import { useProjectStore } from "../useProjectStore";

describe("useProjectStore", () => {

    //#region projects
    it("projects: has correct initial state", () => {
        expect(useProjectStore.getState().projects).toEqual([]);
    });

    it("setProjects: sets new projects", () => {
        expect(useProjectStore.getState().setProjects).toEqual([]);
    });
    //#endregion

    //#region selectedProjects
    it("selectedProjects: has correct initial state", () => {
        expect(useProjectStore.getState().selectedProjects).toBe([]);
    });

    it("selectedProjects: sets selected projects", () => {
        useProjectStore.getState().setSelectedProjects([{
            projectId: "project-id",
            projectName: "project-name",
            teamName: "team-name",
            teamId: "team-id",
            teams: [],
            selectedTeamKey: "selected-team-key",
        }]);

        expect(useProjectStore.getState().selectedProjects).toHaveLength(1);
        expect(useProjectStore.getState().selectedProjects[0].projectName).toBe("project-name");
        expect(useProjectStore.getState().selectedProjects[0].teams?.length).toHaveLength(0);
    });
    //#endregion

    //#region personalSelectedProjects
    it("personalSelectedProjects: has correct initial state", () => {
        expect(useProjectStore.getState().personalSelectedProjects).toEqual(null);
    });

    it("personalSelectedProjects: sets personal selected projects", () => {
        useProjectStore.getState().setSelectedProjects([{
            projectId: "project-id-for-personal",
            projectName: "project-name-personal",
            teamName: "team-name-personal",
            teamId: "team-id-personal",
            teams: [],
            selectedTeamKey: "selected-team-key-personal",
        }]);
        expect(useProjectStore.getState().personalSelectedProjects[0].projectId).toEqual("project-id-for-personal");
    });
    //#endregion

    //#region isLoading
    it("isLoading: has correct initial state", () => {
        expect(useProjectStore.getState().isLoading).toEqual(false);
    });

    it("isLoading: sets loading state.", () => {

        useProjectStore.getState().setIsLoading(false);
        expect(useProjectStore.getState().isLoading).toEqual(false);
    });
    //#endregion
});
import { workClient } from "core/azureClients";
import { fetchProjectById } from "features/teams/api/projects";
import { SelectedProjectType } from "features/teams/types/SelectedProjectType";
import { fetchTeamById } from "../api/teams.js";

export type AreaGroup = {
    projectId: string;
    projectName: string;
    teamId: string;
    teamName?: string;
    areaPaths: string[];
};

const areaPathCache = new Map<string, AreaGroup>();

export const ProjectService = {
    getAreaPaths: async (projectTeamPairs?: SelectedProjectType[]): Promise<AreaGroup[]> => {
        if (!projectTeamPairs || projectTeamPairs.length === 0) return [];

        const results = await Promise.all(
            projectTeamPairs.map(async (pair) => {

                const { projectId, teamId } = pair;

                const cacheKey = `${projectId}:${teamId}`;

                const cached = areaPathCache.get(cacheKey);

                if (cached) return cached;

                try {
                    const [project, team] = await Promise.all([fetchProjectById(projectId), fetchTeamById(projectId, teamId)]);
                    const teamName = team?.name ?? "";

                    const teamContext = {
                        project: project?.name ?? "",
                        projectId,
                        team: teamName,
                        teamId,
                    };

                    const teamFieldValues = await workClient().getTeamFieldValues(teamContext);

                    const collected: string[] = [];

                    if (Array.isArray(teamFieldValues?.values)) {
                        for (const v of teamFieldValues.values) {
                            if (!v?.value) continue;
                            collected.push(v.value);
                        }
                    }

                    if (collected.length === 0) {
                        console.warn("[getAreaPaths] Team has no area paths configured");
                    }

                    const projectName = project?.name ?? "";

                    const clean = Array.from(new Set(collected.filter(p => typeof p === "string" && p.length > 0)
                        .map(p => p.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim()))
                    );

                    const specificAreaPaths = clean.filter(p => p === projectName || p.startsWith(projectName + "\\"));

                    const result = { projectId, projectName, teamId, teamName, areaPaths: specificAreaPaths } as AreaGroup;
                    areaPathCache.set(cacheKey, result);
                    return result;

                } catch (err) {
                    //console.error("[getAreaPaths] Failed to fetch area paths");

                    const result = { projectId, projectName: "", teamId, teamName: undefined, areaPaths: [] } as AreaGroup;
                    areaPathCache.set(cacheKey, result);
                    return result;
                }
            })
        );
        return results;
    },
};

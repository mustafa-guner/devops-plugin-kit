import { TeamProjectReference, WebApiTeam } from "azure-devops-extension-api/Core";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { coreClient } from "core/azureClients";
import { SelectedProjectType } from "features/teams/types/SelectedProjectType";

/**
 * Fetches all projects and maps them to IListBoxItem objects.
 * 
 * @description This function retrieves all projects using the Core REST client
 * and maps them to an array of IListBoxItem for UI representation.
 * 
 * @returns An object containing an array of IListBoxItem and an array of TeamProjectReference
 */
export async function fetchProjects() {
    const core = coreClient();
    const projects: TeamProjectReference[] = await core.getProjects();
    const projectItems = projects.map((project) => ({ text: project.name, id: project.id, })) as IListBoxItem[];
    return { projectItems, projects };
}

/**
 * Fetches a single project by its ID.
 * @description This function retrieves a specific project using the Core REST client
 * and returns its TeamProjectReference.
 * 
 * @param projectId - The unique identifier of the project to fetch
 * @returns A promise resolving to the TeamProjectReference of the project, or null if not found
 */
export async function fetchProjectById(projectId: string): Promise<any | null> {
    const core = coreClient();
    const project = await core.getProject(projectId);
    return project;
}

/**
 * Fetches project and team IDs based on team project name, selected projects, and area path.
 * 
 * @param teamProjectName The name of the team project
 * @param selectedProjects An array of selected projects
 * @param areaPath The area path within the project
 * @returns Promise resolving to an object containing projectId and teamId
 * 
 */
export async function getProjectAndTeamIds(teamProjectName: string, selectedProjects: SelectedProjectType[], areaPath?: string) {
    const core = coreClient();

    const project = await core.getProject(teamProjectName);
    const projectId = project.id;

    const parts = (areaPath ?? "").split("\\");
    const candidateTeamName = parts.length > 1 ? parts[1] : undefined;
    const teams: WebApiTeam[] = await core.getTeams(projectId, undefined, 200, 0);

    teams.filter(t => {
        return selectedProjects.some(p => {
            return p.teamId === t.id;
        });
    });

    let team = (candidateTeamName && teams.find(t => t.name?.toLowerCase() === candidateTeamName.toLowerCase())) ||
        (teams as any[]).find(t => t.isDefault) ||
        teams[0];

    if (!team?.id) {
        throw new Error(`No team found in project ${project.name}`);
    }

    return {
        projectId,
        teamId: team.id,
        projectName: project.name,
        teamName: team.name,
    };
}
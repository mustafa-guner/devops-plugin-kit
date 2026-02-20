import { coreClient } from "core/azureClients";

/**
 * Fetches teams for a given project.
 * @description This function retrieves all teams within the specified project
 * using the Core REST client and maps them to IListBoxItem format.
 * 
 * @param projectId - The ID of the project to fetch teams for
 * @returns  - A promise resolving to an array of teams in IListBoxItem format
 */
export async function fetchTeams(projectId: string): Promise<any[]> {
    const core = coreClient();
    const teams = await core.getTeams(projectId);
    return teams.map((team) => ({ text: team.name, id: team.id }));
}

/**
 * Fetches a team by its ID within a project.
 * @description This function retrieves a specific team using the Core REST client
 * and returns its details.
 * 
 * @param projectId - Project ID
 * @param teamId - Team ID
 * @returns - A promise resolving to the team details
 */
export function fetchTeamById(projectId: string, teamId: string): Promise<any> {
    const core = coreClient();
    return core.getTeam(projectId, teamId);
}
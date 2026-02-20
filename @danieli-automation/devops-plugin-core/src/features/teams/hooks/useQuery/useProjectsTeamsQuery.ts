import { useQuery } from '@tanstack/react-query';
import { fetchProjects } from 'features/teams/api/projects';
import { fetchTeams } from 'features/teams/api/teams';
import { useProjectStore } from 'features/teams/stores/useProjectStore';
import { useTeamStore } from 'features/teams/stores/useTeamStore';
import { getProjectsTeamsQueryKey } from 'src/app/utils/queryKey';

export function useProjectsTeamsQuery(isMounted: boolean) {
    return useQuery({
        queryKey: getProjectsTeamsQueryKey(),
        queryFn: async () => await fetchProjects(),
        enabled: isMounted,
        onSuccess: async (data) => {
            useProjectStore.getState().setProjects(data.projectItems);
            const projectsArr = data?.projects || [];

            if (projectsArr.length > 0) {
                // fill my teams
                const myTeams = await Promise.all(
                    projectsArr.map(async (project) => {
                        const teams = await fetchTeams(project.id);
                        return { projectId: project.id, teams, teamId: teams[0]?.id };
                    })
                );

                useTeamStore.getState().setMyTeams(myTeams);
            }

            return data.projectItems;
        },
    });
}

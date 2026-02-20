import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { TeamStoreType } from "features/teams/stores/types/TeamStoreType";
import { SelectedProjectType } from "features/teams/types/SelectedProjectType";
import { RowStateInterface } from "src/app/interfaces/RowStateInterface";
import { create } from "zustand";

export const useTeamStore = create<TeamStoreType>((set, get) => ({
    teams: new ObservableValue<RowStateInterface[]>([]),
    myTeams: [] as SelectedProjectType[],
    selectedTeams: [],
    isLoading: false,

    setTeams: (teams: any[]) => set({ teams: new ObservableValue<RowStateInterface[]>(teams) }),
    setMyTeams: (myTeams: SelectedProjectType[]) => set({ myTeams }),
    setSelectedTeams: (teams: any[]) => set({ selectedTeams: teams }),
    setIsLoading: (isLoading: boolean) => set({ isLoading })
}));

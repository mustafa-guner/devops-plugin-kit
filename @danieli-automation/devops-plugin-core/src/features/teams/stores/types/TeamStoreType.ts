import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { SelectedProjectType } from "features/teams/types/SelectedProjectType";
import { RowStateInterface } from "src/app/interfaces/RowStateInterface";

export type TeamStoreType = {
    teams: ObservableValue<RowStateInterface[]>;
    myTeams: SelectedProjectType[];
    selectedTeams: any[];
    isLoading: boolean;

    setTeams: (teams: any[]) => void;
    setMyTeams: (myTeams: SelectedProjectType[]) => void;
    setSelectedTeams: (teams: any[]) => void;
    setIsLoading: (isLoading: boolean) => void;
}
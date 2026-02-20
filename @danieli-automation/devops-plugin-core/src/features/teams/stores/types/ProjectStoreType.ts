import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { SelectedProjectType } from "../../types/SelectedProjectType";

export type ProjectStoreType = {
    projects: ObservableValue<IListBoxItem[]>;
    selectedProjects: SelectedProjectType[];
    personalSelectedProjects: SelectedProjectType[];
    isLoading: boolean;

    setProjects: (projects: IListBoxItem[]) => void;
    setSelectedProjects: (projects: SelectedProjectType[]) => void;
    setPersonalSelectedProjects: (projects: SelectedProjectType[]) => void;
    setIsLoading: (isLoading: boolean) => void;
};
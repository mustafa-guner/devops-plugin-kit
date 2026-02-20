import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { ProjectStoreType } from "features/teams/stores/types/ProjectStoreType";
import { SelectedProjectType } from "features/teams/types/SelectedProjectType";
import { create } from "zustand";

export const useProjectStore = create<ProjectStoreType>((set, get) => ({
    projects: new ObservableValue<IListBoxItem[]>([]),
    selectedProjects: [],
    personalSelectedProjects: [] as SelectedProjectType[],
    isLoading: false,

    setProjects: (projects: IListBoxItem[]) => set({ projects: new ObservableValue<IListBoxItem[]>(projects) }),
    setSelectedProjects: (projects: SelectedProjectType[]) => set({ selectedProjects: projects }),
    setPersonalSelectedProjects: (projects: SelectedProjectType[]) => set({ personalSelectedProjects: projects }),
    setIsLoading: (isLoading: boolean) => set({ isLoading })
}));

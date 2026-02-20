type ListBoxItem = {
    id?: string;
    text?: string;
    [key: string]: unknown;
};

type DropdownSelection = unknown;

export type InstanceRowType = {
    id: string;
    selectedProjectKey?: string;
    projectName?: string;
    selectedTeamKey?: string;
    teamName?: string;
    teams: ListBoxItem[];
    projectSelection: DropdownSelection;
    teamSelection: DropdownSelection;
};

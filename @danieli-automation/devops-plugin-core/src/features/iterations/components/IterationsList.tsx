import { useQueryClient } from "@tanstack/react-query";
import { TimeFrame } from "azure-devops-extension-api/Work";
import { Dropdown } from "azure-devops-ui/Dropdown";
import { ListSelection } from "azure-devops-ui/List";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { IterationService } from "features/iterations/services/IterationService";
import { useIterationStore } from "features/iterations/stores/useIterationStore";
import { IterationInfoType } from "features/iterations/types/IterationInfoType";
import { getFormattedIterationTitle } from "features/iterations/utils/iteration";
import { useProjectStore } from "features/teams/stores/useProjectStore";
import * as React from "react";
import QueryKeyConstant from "src/app/constants/QueryKeyConstant";

type Props = {
    isIterationsLoading?: boolean;
};

export default function IterationsList({ isIterationsLoading }: Props) {
    const queryClient = useQueryClient();
    const { iterations, setSelectedIteration, setCurrentIteration } = useIterationStore();
    const { selectedProjects } = useProjectStore();

    const groupedIterations = React.useMemo(
        () => IterationService.groupIterationsByStartEnd(iterations),
        [iterations, selectedProjects]
    );

    const items: IListBoxItem<IterationInfoType>[] = React.useMemo(
        () => groupedIterations.filter(iter => iter.startDate && iter.finishDate)
            .map((iteration: IterationInfoType) => ({
                id: iteration.id,
                text: getFormattedIterationTitle(iteration),
                data: iteration,
            })),
        [groupedIterations]
    );

    // persistent selection instance
    const selectionRef = React.useRef<ListSelection | null>(null);
    if (!selectionRef.current) {
        selectionRef.current = new ListSelection({ multiSelect: false });
    }
    const selection = selectionRef.current;

    const onIterationChange = React.useCallback(
        (_e: React.SyntheticEvent<HTMLElement> | Event, item?: IListBoxItem<IterationInfoType>) => {
            if (!item) return;
            const selectedIteration = item.data;
            setSelectedIteration(selectedIteration);
            queryClient.invalidateQueries({ queryKey: [QueryKeyConstant.WORK_ITEMS_QUERY_KEY] });
        },
        [queryClient, setSelectedIteration]
    );

    React.useEffect(() => {
        if (items.length === 0) return;

        const activeIndex = items.findIndex(i => i.data!.timeFrame === TimeFrame.Current);

        //check if there is a iteration that is set as the current one. If there is, set it as current iteration
        if (items[activeIndex]?.data?.timeFrame == TimeFrame.Current) {
            setCurrentIteration(items[activeIndex]?.data);
        }

        if (activeIndex >= 0) {
            selection.select(activeIndex);
            onIterationChange(new Event("init"), items[activeIndex]);
            return;
        }

        if (items.length === 1) {
            selection.select(0);
            onIterationChange(new Event("init"), items[0]);
            return;
        }

    }, [items, onIterationChange, selection]);

    return (
        items.length > 0 ? (
            <Dropdown
                showFilterBox={true}
                ariaLabel="Iterations"
                dismissOnSelect={true}
                className="iterations-list"
                items={items}
                loading={isIterationsLoading}
                filterByText={true}
                onSelect={onIterationChange}
                placeholder="Select Iteration"
                selection={selection}
            />
        ) : <h3>No Iterations Available</h3>
    );
}
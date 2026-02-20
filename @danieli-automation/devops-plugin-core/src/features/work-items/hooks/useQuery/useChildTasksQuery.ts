import { useQuery } from '@tanstack/react-query';
import { canonicalIterationPath } from 'features/iterations/api/iterations';
import { useIterationStore } from 'features/iterations/stores/useIterationStore';
import { fetchChildren } from 'features/work-items/api/workItems';
import FieldConstant from 'features/work-items/constants/FieldConstant';
import { filterChildrenWorkItemsByParentId } from 'features/work-items/utils/filter';
import Helper from 'src/app/utils/column';
import { getChildrenQueryKey } from 'src/app/utils/queryKey';

export function useChildTasksQuery(projectId: string, parentId: number, selectedAssignedTo?: string[], fields?: string[]) {

    const { selectedIteration } = useIterationStore();

    if (fields === undefined || fields.length === 0) {
        fields = Helper.getColumnFields();
    }

    return useQuery({
        queryKey: getChildrenQueryKey(projectId, parentId, fields),
        queryFn: ({ signal }) => fetchChildren(projectId, parentId, fields, signal),
        /* refetchInterval: 10_000,
        refetchIntervalInBackground: true,*/
        enabled: !!projectId && !!parentId, //enabled only if projectId and parentId are valid
        select: (children) => {
            const allowedPathsRaw = selectedIteration?.paths?.length ? selectedIteration.paths : selectedIteration?.path ? [selectedIteration.path] : null;

            const allowedCanonical = allowedPathsRaw ? new Set(allowedPathsRaw.map((p) => canonicalIterationPath(String(p)))) : null;

            return filterChildrenWorkItemsByParentId(children, parentId, selectedAssignedTo).filter((wi) => {
                if (!allowedCanonical) return true;
                const wiPath = String(wi?.fields?.[FieldConstant.WORK_ITEM_FIELD_ITERATION_PATH] ?? "");
                return allowedCanonical.has(canonicalIterationPath(wiPath));
            });
        }
    });
}

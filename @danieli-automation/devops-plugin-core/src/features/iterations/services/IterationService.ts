import { fetchIterations } from "features/iterations/api/iterations";
import { IterationInfoType } from "features/iterations/types/IterationInfoType";
import { SelectedProjectType } from "features/teams/types/SelectedProjectType";
import { toIsoDate } from "src/app/utils/date";
import { extractProjectFromPath } from "src/app/utils/global";

export const IterationService = {

    /**
    * @description Filters iterations for the current year (Azure DevOps-like),
    * scoped to the provided project-team pairs.
    *
    * It assumes iteration paths contain the year as a folder segment, e.g.:
    *   "MustafaTeamPath/2026/Sprint 1"
    *
    * Rules:
    * - Only iterations that belong to selected project-team pairs
    * - Only iterations whose path includes `/<currentYear>/`
    * - Missing start/finish dates are skipped
    * - Results are sorted by start date ascending
    * - Deduplicated by id (fallback to project/team + dates)
    */
    getIterationsInScope: (iterations: IterationInfoType[], projectTeamPairs: SelectedProjectType[]): IterationInfoType[] => {

        const year = new Date().getFullYear();
        const yearSegment = `\\${year}\\`;

        const inCurrentYearFolder = (iter: IterationInfoType) => typeof iter.path === "string" && iter.path.includes(yearSegment);
        const belongsToSelectedPair = (iter: IterationInfoType) => projectTeamPairs.some(p => p.projectId === iter.projectId && p.teamId === iter.teamId);

        const filtered = iterations.filter(iter => {
            if (!iter.startDate || !iter.finishDate) return false;
            if (!belongsToSelectedPair(iter)) return false;
            if (!inCurrentYearFolder(iter)) return false;
            return true;
        });

        filtered.sort((a, b) => Date.parse(a.startDate!) - Date.parse(b.startDate!));

        // Deduplicate
        const seen = new Set<string>();
        const deduped: IterationInfoType[] = [];
        for (const it of filtered) {
            const key = (it.id ? String(it.id) : `${it.projectId}:${it.teamId}:${it.startDate}:${it.finishDate}`) + `@${it.projectId}:${it.teamId}`;
            if (!seen.has(key)) {
                seen.add(key);
                deduped.push(it);
            }
        }

        return deduped;
    },


    /**
     * Gets allowed iteration paths for the selected project-team pairs based on the chosen iteration group's dates.
     * 
     * Uses fetchIterations to retrieve iterations for each project-team pair, then filters them to find those
     * that match the start and finish dates of the chosen iteration group.
     * 
     * @param selectedProjectPairs - Array of selected project and team ID pairs
     * @param chosenIterationGroup  - The iteration group with startDate and finishDate to match against
     * @returns A promise resolving to an array of allowed iteration paths
     */
    getAllowedIterationPathsForSelection: async (selectedProjectPairs: SelectedProjectType[], chosenIterationGroup: { startDate: string; finishDate: string }): Promise<string[]> => {
        if (!Array.isArray(selectedProjectPairs) || selectedProjectPairs.length === 0) return [];

        const { startDate: chosenStartRaw, finishDate: chosenFinishRaw } = chosenIterationGroup || {};

        const results = await Promise.all(
            selectedProjectPairs.map(p => fetchIterations(p.projectId, p.teamId))
        );

        if (!chosenStartRaw || !chosenFinishRaw) return [];
        const chosenStart = Date.parse(chosenStartRaw);
        const chosenFinish = Date.parse(chosenFinishRaw);
        const allIterations = results.flat().filter(Boolean);

        // pick only iterations whose start/finish match chosenIterationGroup
        const allowed = allIterations
            .filter(iter => iter && iter.startDate && iter.finishDate)
            .filter(iter => {
                const s = Date.parse(iter.startDate!);
                const f = Date.parse(iter.finishDate!);

                // skip invalid iteration dates
                if (isNaN(s) || isNaN(f)) return false;

                return s === chosenStart && f === chosenFinish;
            })
            .map(iter => iter.path);

        return Array.from(new Set(allowed));
    },

    /**
     * Filters a list of iterations to include only future iterations
     * starting from the **first day of the next month** up to the **end of the current year**.
     *
     * The lower bound is calculated as **00:00 (local time)** on the **1st day of the next month**.
     * The upper bound is calculated as **23:59:59.999 (local time)** on **December 31st of the current year**.
     *
     * An iteration is included if its **startDate** falls within this time window.
     *
     * Invalid iterations are excluded:
     * - Missing startDate or finishDate
     * - Unparseable dates (Date.parse returns NaN)
     * - The current iteration (if provided), matched by id
     *
     * @param iterations - Array of iterations to filter
     * @param currentIteration - The currently active iteration to exclude from the results (optional)
     * @returns A filtered array containing future iterations from next month until the end of the year
     */
    filterFutureIterations: (iterations: IterationInfoType[], currentIteration: IterationInfoType | undefined | null) => {
        const now = new Date();

        // Start at 00:00 on the 1st day of NEXT month (local time)
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();

        // End at 23:59:59.999 on Dec 31 of THIS year (local time)
        const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999).getTime();

        return iterations.filter(({ id, startDate, finishDate }) => {
            if (!startDate || !finishDate) return false;

            const start = Date.parse(startDate);
            const end = Date.parse(finishDate);
            if (Number.isNaN(start) || Number.isNaN(end)) return false;

            // exclude current iteration (if provided)
            if (currentIteration?.id != null && String(currentIteration.id) === String(id)) return false;

            // include iterations that START between next month start and end of year
            return start >= startOfNextMonth && start <= endOfYear;
        });
    },

    /**
     * Groups iterations by their start and end dates.
     * Iterations with the same start and end dates are combined into a single entry,
     * with their paths and included projects aggregated.
     * 
     * @param iterations Array of IterationInfoType objects
     * @returns Array of grouped IterationInfoType objects
     */
    groupIterationsByStartEnd: (iterations: IterationInfoType[]): IterationInfoType[] => {
        const map = new Map<string, IterationInfoType>();

        for (const iter of iterations) {
            const projectFromPath = extractProjectFromPath(iter.path);

            if (iter.startDate && iter.finishDate) {
                const startDate = toIsoDate(iter.startDate);
                const finishDate = toIsoDate(iter.finishDate);
                const key = `DATED__${startDate}__${finishDate}`;

                const existing = map.get(key);
                if (!existing) {
                    map.set(key, {
                        ...iter,
                        startDate,
                        finishDate,
                        paths: [iter.path],
                        projectsIncludedInIteration: [projectFromPath],
                    });
                } else {
                    existing.paths = Array.from(new Set([...(existing.paths ?? []), iter.path]));
                    existing.projectsIncludedInIteration = Array.from(
                        new Set([...(existing.projectsIncludedInIteration ?? []), projectFromPath])
                    );
                }

                continue;
            }

            const key = `UNDATED__${iter.path}`;

            const existing = map.get(key);
            if (!existing) {
                map.set(key, {
                    ...iter,
                    paths: [iter.path],
                    projectsIncludedInIteration: [projectFromPath],
                });
            } else {
                existing.paths = Array.from(new Set([...(existing.paths ?? []), iter.path]));
                existing.projectsIncludedInIteration = Array.from(
                    new Set([...(existing.projectsIncludedInIteration ?? []), projectFromPath])
                );
            }
        }

        return Array.from(map.values()).sort((a, b) => {

            const aHas = a.startDate && a.finishDate;
            const bHas = b.startDate && b.finishDate;
            if (aHas && !bHas) return -1;
            if (!aHas && bHas) return 1;

            if (aHas && bHas) return String(a.startDate).localeCompare(String(b.startDate));

            return String(a.path).localeCompare(String(b.path));
        });
    },

    /**
     * Gets iteration paths from an array of iterations.
     * 
     * @param iterations Array of IterationInfoType objects
     * @returns Array of iteration paths as strings
     */
    getIterationPaths: (iterations: IterationInfoType[]): string[] => {
        return iterations.map(iter => iter.path);
    }
};
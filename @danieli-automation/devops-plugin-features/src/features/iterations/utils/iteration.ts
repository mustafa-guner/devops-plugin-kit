import { TimeFrame } from "azure-devops-extension-api/Work";
import type { IterationInfoType } from "../types/IterationInfoType.js";

/**
 * Formats an iteration into a short, human-readable label.
 *
 * Output format:
 *   YYYY Mon (DD-DD)
 * Example:
 *   2025 Jan (01-14)
 *
 * Notes:
 * - Dates are interpreted and formatted in UTC to avoid timezone-related shifts.
 * - Returns an empty string if the iteration or its start/end dates are missing
 *   or invalid.
 *
 * @param iter The iteration information to format.
 * @returns A formatted iteration label or an empty string if invalid.
 */
export function formatIteration(iter?: IterationInfoType | null) {
    const start = toDate(iter?.startDate);
    const end = toDate(iter?.finishDate);
    if (!start || !end) return "";

    const year = start.getUTCFullYear();
    const month = start.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
    const pad = (n: number) => n.toString().padStart(2, "0");

    return `${year} ${month} (${pad(start.getUTCDate())}-${pad(end.getUTCDate())})`;
}

/**
 * Finds the first iteration path whose root segment matches
 * the root segment of the given area path.
 *
 * Root segment definition:
 * - The first path component before the `\` character.
 *
 * Example:
 *   areaPath:        "Web\\Frontend"
 *   iterationPaths:  ["Web\\Sprint 1", "Mobile\\Sprint 1"]
 *   result:          "Web\\Sprint 1"
 *
 * @param iterationPaths A list of iteration paths to search within.
 * @param areaPath       The area path used to determine the root segment.
 * @returns The first matching iteration path, or `undefined` if none match.
 */
export function findByAreaRoot<T extends string>(iterationPaths?: T[] | null, areaPath?: string | null): T | undefined {
    if (!iterationPaths?.length) return undefined;
    if (!areaPath) return undefined;

    const areaRoot = areaPath.split("\\")[0]?.trim().toLowerCase();
    if (!areaRoot) return undefined;

    return iterationPaths.find((p) => {
        const root = p.split("\\")[0]?.trim().toLowerCase();
        return root === areaRoot;
    });
}

/**
 * Resolves a stable string key for an iteration.
 *
 * Priority:
 * 1. Iteration ID (most stable across renames)
 * 2. Iteration path (fallback)
 *
 * This key is typically used for:
 * - React Query cache keys
 * - Memoization
 * - Store indexing
 *
 * @param iteration The iteration to derive a key from.
 * @returns A stable iteration key, or `null` if unavailable.
 */
export function getIterationKey(iteration?: IterationInfoType): string | null {
    return iteration?.id ?? iteration?.path ?? null;
}

/**
 * Builds a user-facing iteration title that includes:
 * - Formatted date range (via `formatIteration`)
 * - Time frame label (Past/Current/Future/Unknown)
 *
 * Example output:
 *   " 2025 Jan (01-14) (Current)"
 *
 * @param iteration The iteration to build a display title for.
 * @returns A formatted iteration title string.
 */
export function getFormattedIterationTitle(iteration: IterationInfoType) {
    return `${formatIteration(iteration)} (${resolveIterationTimeFrame(iteration)})`;
}

//#region Private Functions
/**
 * Safely converts a date string into a `Date` object.
 *
 * @param v A date string value.
 * @returns A valid `Date` object, or `undefined` if the value is null, undefined,
 *          or cannot be parsed into a valid date.
 */
function toDate(v?: string | null): Date | undefined {
    if (v == null) return undefined;
    const date = new Date(v);
    return isNaN(date.getTime()) ? undefined : date;
}

/**
 * Converts an iteration's `TimeFrame` value into a user-friendly label.
 *
 * Notes:
 * - Treats `undefined` the same as `Past` (common when the API omits the field).
 * - Returns "Unknown" for unexpected enum values.
 *
 * @param iteration The iteration containing the `timeFrame` value.
 * @returns The normalized time frame label ("Past", "Current", "Future", or "Unknown").
 */
function resolveIterationTimeFrame(iteration: IterationInfoType): string {
    switch (iteration.timeFrame) {
        case TimeFrame.Past:
        case undefined:
            return "Past";
        case TimeFrame.Current:
            return "Current";
        case TimeFrame.Future:
            return "Future";
        default:
            return "Unknown";
    }
}
//#endregion

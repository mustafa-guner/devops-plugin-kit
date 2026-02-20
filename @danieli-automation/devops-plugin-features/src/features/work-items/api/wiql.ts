/**
 * Fetches child work items for a given parent work item within a project.
 * 
 * @param pbiIds - Array of parent work item IDs (PBIs or Bugs)
 * @returns WIQL string to fetch child work items
 * 
 */
export function wiqlForParentWorkItems(pbiIds: number[]) {
    if (pbiIds.length === 0) return null;

    const idsClause = pbiIds.length === 1 ? `[Target].[System.Id] = ${pbiIds[0]}` : `[Target].[System.Id] IN (${pbiIds.join(',')})`;

    const wiql = `
        SELECT [Source].[System.Id]
        FROM WorkItemLinks
        WHERE
        (
            [Source].[System.WorkItemType] IN ('Epic','Feature')
            AND [Source].[System.State] <> 'Removed'
        )
        AND ([System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward')
        AND (
            [Target].[System.WorkItemType] IN ('Product Backlog Item','Bug')
            AND [Target].[System.State] <> 'Removed'
            AND ${idsClause}
        )
        MODE (Recursive) `;

    return wiql;
}

/**
 * @description: Generates WIQL queries to fetch PBIs/Bugs and Tasks that belong to a single iteration,
 * and optionally restricted to one or more area path roots (UNDER clauses).
 * @param iterationPath The selected iteration path (e.g. "Project\\2026\\Sprint 02").
 * @param areaPaths Optional list of area paths to scope results (uses UNDER).
 * @returns An object containing WIQL strings for parent items and tasks.
 */
export function wiqlForSingleIteration(iterationPath: string, areaPaths?: (string | null)[]) {
    const safeAreaPaths = (areaPaths ?? []).filter((p): p is string => typeof p === "string" && p.length > 0);

    const areaClause = safeAreaPaths.length
        ? `AND (${safeAreaPaths.map(p => `[System.AreaPath] UNDER '${escapeWiqlString(p)}'`).join(" OR ")})`
        : "";

    const iterClause = `[System.IterationPath] = '${escapeWiqlString(sanitizeForWiql(iterationPath))}'`;

    const parentsQuery = `
    SELECT [System.Id]
    FROM WorkItems
    WHERE
      [System.WorkItemType] IN ('Product Backlog Item','Bug')
      AND [System.State] <> 'Removed'
      AND ${iterClause}
      ${areaClause}
  `;

    const tasksQuery = `
    SELECT [System.Id]
    FROM WorkItems
    WHERE
      [System.WorkItemType] = 'Task'
      AND [System.State] <> 'Removed'
      AND ${iterClause}
      ${areaClause}
  `;

    return { parentsQuery, tasksQuery };
}

/**
 * @description: Generates WIQL queries to fetch PBIs/Bugs and Tasks that belong to multiple iterations,
 * optionally restricted to one or more area path roots (UNDER clauses).
 * @param iterationPaths The selected iteration paths.
 * @param areaPaths Optional list of area paths to scope results (uses UNDER).
 * @returns An object containing WIQL strings for parent items and tasks.
 */
export function wiqlForMultipleIterations(iterationPaths: string[], areaPaths?: (string | null)[]) {
    const safeAreaPaths = (areaPaths ?? []).filter((p): p is string => typeof p === "string" && p.length > 0);

    const areaClause = safeAreaPaths.length
        ? `AND (${safeAreaPaths.map(p => `[System.AreaPath] UNDER '${escapeWiqlString(p)}'`).join(" OR ")})`
        : "";

    const iterClause = iterationPaths && iterationPaths.length
        ? buildUnderOrClause('[System.IterationPath]', iterationPaths)
        : "";

    const parentsQuery = `
    SELECT [System.Id]
    FROM WorkItems
    WHERE
      [System.WorkItemType] IN ('Product Backlog Item','Bug')
      AND [System.State] <> 'Removed'
      ${iterClause ? 'AND ' + iterClause : ''}
      ${areaClause}
  `;

    const tasksQuery = `
    SELECT [System.Id]
    FROM WorkItems
    WHERE
      [System.WorkItemType] = 'Task'
      AND [System.State] <> 'Removed'
      ${iterClause ? 'AND ' + iterClause : ''}
      ${areaClause}
  `;

    return { parentsQuery, tasksQuery };
}

//#region Private Functions
/**
 * Builds a WIQL clause joining multiple `UNDER` path checks with `OR`.
 *
 * @param field WIQL field name (e.g. `[System.IterationPath]`).
 * @param paths Path list to include.
 * @returns A WIQL condition string, or empty string when no paths are provided.
 */
function buildUnderOrClause(field: string, paths?: string[]) {
    if (!paths || paths.length === 0) return '';
    const cleanPaths = paths.map(p => escapeWiqlString(sanitizeForWiql(p)));
    if (cleanPaths.length === 1) return `${field} UNDER '${cleanPaths[0]}'`;
    return '(' + cleanPaths.map(p => `${field} UNDER '${p}'`).join(' OR ') + ')';
}

/**
 * Escapes string values for safe embedding in WIQL string literals.
 *
 * @param str Raw string value.
 * @returns Escaped WIQL-safe string.
 */
function escapeWiqlString(str: string) {
    return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

/**
 * Removes control characters and trims whitespace before WIQL interpolation.
 *
 * @param s Raw input string.
 * @returns Sanitized string suitable for WIQL.
 */
function sanitizeForWiql(s: string) {
    return s ? s.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim() : s;
}
//#endregion

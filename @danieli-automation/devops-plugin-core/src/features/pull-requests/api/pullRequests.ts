import { gitClient } from "core/azureClients";

/**
 * Fetches Pull Request details given a PR URL or Artifact ID.
 * @description This function parses the provided PR URL or Artifact ID,
 * then uses the Git REST client to retrieve the Pull Request details.
 * 
 * @param prUrl - Pull Request URL or Artifact ID
 * @returns - A promise resolving to the Pull Request details, or null if not found
 */
export async function fetchPullRequestDetails(prUrl: string) {
    const parsed = parsePrArtifactId(prUrl);
    if (!parsed) return null;

    const git = await gitClient();
    return git.getPullRequest(parsed.repositoryId, parsed.prId, parsed.projectId);
}

//#region Private Functions
/**
 * Parses a pull request artifact URL into project/repository/pull-request ids.
 *
 * @param artifactUrl Artifact URL or encoded artifact id string.
 * @returns Parsed identifiers, or `null` when format is invalid.
 */
function parsePrArtifactId(artifactUrl: string) {
    const decoded = decodeURIComponent(artifactUrl);
    const m = decoded.match(/vstfs:\/\/\/Git\/PullRequestId\/([^/]+)\/([^/]+)\/(\d+)/);
    if (!m) return null;
    const [_, projectId, repositoryId, prId] = m;
    return { projectId, repositoryId, prId: Number(prId) };
}
//#endregion

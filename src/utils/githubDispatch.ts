/**
 * Shared GitHub Dispatch Utility
 * Used by Orbit workers to dispatch actions to GitHub
 */

const GITHUB_TOKEN = process.env.GITHUB_BSU_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'LexBANK/BSM';

/**
 * Dispatch actions to GitHub repository
 * @param actions - Array of actions to dispatch
 */
export async function dispatchToGitHub(actions: string[]): Promise<void> {
  await fetch(`https://api.github.com/repos/${GITHUB_REPO}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json'
    },
    body: JSON.stringify({
      event_type: 'orbit_actions',
      client_payload: { actions }
    })
  });
}

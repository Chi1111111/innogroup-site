export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization || '';
  const tokenFromHeader = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : '';
  const triggerSecret = process.env.JPAUC_SYNC_TRIGGER_SECRET || 'innogroup2026';

  if (!triggerSecret || tokenFromHeader !== triggerSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const repoOwner = process.env.GITHUB_REPO_OWNER || '';
  const repoName = process.env.GITHUB_REPO_NAME || '';
  const githubToken = process.env.GITHUB_ACTIONS_TRIGGER_TOKEN || '';

  if (!repoOwner || !repoName || !githubToken) {
    return res.status(500).json({ error: 'Server env not configured' });
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/jpauc-feed-refresh.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${githubToken}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            sync_mode: 'full',
          },
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({
        error: 'GitHub dispatch failed',
        detail: text.slice(0, 500),
      });
    }

    return res.status(200).json({
      ok: true,
      message: 'Full sync started',
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Unexpected error',
      detail: error instanceof Error ? error.message : 'unknown',
    });
  }
}

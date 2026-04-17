/** Fire a GitHub Actions workflow_dispatch event. */
export async function dispatchWorkflow(
  workflow: string,
  inputs: Record<string, string> = {},
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const repo = process.env.GITHUB_REPO; // e.g. "eytan/idf-video"
  const ref = process.env.GITHUB_REF ?? "main";
  const token = process.env.GITHUB_DISPATCH_TOKEN;

  if (!repo || !token) {
    return {
      ok: false,
      status: 500,
      message:
        "Missing GITHUB_REPO or GITHUB_DISPATCH_TOKEN in the Vercel project env.",
    };
  }

  const url = `https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ref, inputs }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    return {
      ok: false,
      status: resp.status,
      message: text.slice(0, 300),
    };
  }

  return { ok: true };
}

interface DevinSessionResponse {
  session_id: string;
  url: string;
  is_new_session: boolean;
}



export async function createDevinSession(prompt: string, title?: string): Promise<DevinSessionResponse> {
  const response = await fetch('/api/devin/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      title,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<DevinSessionResponse>;
}

export async function sendImplementationMessage(sessionId: string): Promise<void> {
  const response = await fetch(`/api/devin/sessions/${sessionId}/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Now that you have scoped the issue, please implement the solution by making the necessary code changes to complete this GitHub issue.'
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
  }
}

export function generateIssueScopingPrompt(issue: {
  title: string;
  body?: string;
  number: number;
  html_url: string;
  labels: Array<{ name: string }>;
}): string {
  const labelsText = issue.labels.length > 0 
    ? `Labels: ${issue.labels.map(l => l.name).join(', ')}`
    : 'No labels';

  return `Without implementing any changes, please scope this GitHub issue.

**Issue #${issue.number}: ${issue.title}**
**URL**: ${issue.html_url}
**${labelsText}**

**Description:**
${issue.body || 'No description provided'}

Please DO NOT implement any changes to the codebase yet. Once you have finished scoping, simply stop and wait for futher instructions.`;
}

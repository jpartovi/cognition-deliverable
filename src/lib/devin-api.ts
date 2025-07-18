interface DevinSessionResponse {
  session_id: string;
  url: string;
  is_new_session: boolean;
}



export async function createDevinSession(prompt: string): Promise<DevinSessionResponse> {
  const response = await fetch('/api/devin/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
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

  return `Please analyze and scope this GitHub issue. Provide a detailed assessment of what would be required to implement this feature/fix.

**Issue #${issue.number}: ${issue.title}**
**URL**: ${issue.html_url}
**${labelsText}**

**Description:**
${issue.body || 'No description provided'}

Please provide:
1. **Technical Scope**: What areas of the codebase would be affected?
2. **Implementation Approach**: High-level strategy for implementing this
3. **Complexity Assessment**: How complex is this issue to implement?
4. **Key Challenges**: What are the main technical challenges?
5. **Dependencies**: What prerequisites or dependencies exist?
6. **Confidence Score**: Rate your confidence (1-10) for successful completion

Focus on providing a thorough scoping analysis that will help with implementation planning.`;
}

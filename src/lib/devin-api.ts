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

  return `Please analyze this GitHub issue and provide a detailed scope assessment with a confidence score (1-10):

**Issue #${issue.number}: ${issue.title}**
**URL**: ${issue.html_url}
**${labelsText}**

**Description:**
${issue.body || 'No description provided'}

Please provide:
1. A detailed technical scope breakdown
2. Estimated complexity and effort required
3. Key technical challenges and considerations
4. Dependencies and prerequisites
5. A confidence score (1-10) for successful completion
6. Recommended approach and implementation strategy

Focus on providing actionable insights for a software engineer who would work on this issue.`;
}

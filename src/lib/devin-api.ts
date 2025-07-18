interface DevinSessionResponse {
  session_id: string;
  url: string;
  is_new_session: boolean;
}

interface CreateSessionRequest {
  prompt: string;
  unlisted?: boolean;
  idempotent?: boolean;
}

export async function createDevinSession(prompt: string): Promise<DevinSessionResponse> {
  const apiKey = process.env.DEVIN_API_KEY;
  const baseUrl = process.env.DEVIN_API_BASE_URL || 'https://api.devin.ai/v1';

  if (!apiKey) {
    throw new Error('DEVIN_API_KEY environment variable is not set');
  }

  const response = await fetch(`${baseUrl}/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      unlisted: true,
      idempotent: true,
    } as CreateSessionRequest),
  });

  if (!response.ok) {
    throw new Error(`Devin API error: ${response.status} ${response.statusText}`);
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

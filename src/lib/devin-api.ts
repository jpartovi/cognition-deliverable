interface DevinSessionResponse {
  session_id: string;
  url: string;
  is_new_session: boolean;
}

interface DevinSessionDetails {
  session_id: string;
  status: 'working' | 'blocked' | 'expired' | 'finished' | 'suspend_requested' | 'suspend_requested_frontend' | 'resume_requested' | 'resume_requested_frontend' | 'resumed';
  title?: string;
  created_at: string;
  updated_at: string;
  structured_output?: unknown;
  messages: Array<{
    type: string;
    message: string;
    timestamp: string;
    username?: string;
    origin?: string;
  }>;
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

export async function getDevinSessionDetails(sessionId: string): Promise<DevinSessionDetails> {
  const response = await fetch(`/api/devin/sessions/${sessionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<DevinSessionDetails>;
}

export async function pollDevinSessionUntilComplete(
  sessionId: string,
  onProgress?: (status: string) => void,
  maxWaitTime: number = 300000
): Promise<DevinSessionDetails> {
  const startTime = Date.now();
  const pollInterval = 3000;

  while (Date.now() - startTime < maxWaitTime) {
    const details = await getDevinSessionDetails(sessionId);
    
    if (onProgress) {
      onProgress(details.status);
    }

    if (details.status === 'finished' || details.status === 'expired') {
      return details;
    }

    if (details.status === 'blocked') {
      throw new Error('Devin session is blocked and waiting for user input');
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Session polling timed out');
}

export function extractAnalysisFromSession(sessionDetails: DevinSessionDetails): {
  scope: string;
  confidenceScore: number | null;
  fullAnalysis: string;
} {
  let fullAnalysis = '';
  let scope = '';
  let confidenceScore: number | null = null;

  if (sessionDetails.structured_output) {
    fullAnalysis = JSON.stringify(sessionDetails.structured_output, null, 2);
  }

  const analysisMessages = sessionDetails.messages
    .filter(msg => msg.type === 'devin_message' || msg.type === 'user_message')
    .map(msg => msg.message)
    .join('\n\n');

  if (analysisMessages) {
    fullAnalysis = analysisMessages;
  }

  const confidenceMatch = fullAnalysis.match(/confidence\s*(?:score)?[:\s]*(\d+(?:\.\d+)?)/i);
  if (confidenceMatch) {
    confidenceScore = parseFloat(confidenceMatch[1]);
  }

  const scopeMatch = fullAnalysis.match(/(?:scope|technical\s+scope)[:\s]*([^]*?)(?:\n\n|\d+\.|$)/i);
  if (scopeMatch) {
    scope = scopeMatch[1].trim();
  } else {
    const paragraphs = fullAnalysis.split('\n\n').filter(p => p.trim().length > 50);
    if (paragraphs.length > 0) {
      scope = paragraphs[0].trim();
    }
  }

  return {
    scope: scope || 'Analysis completed - see full details below',
    confidenceScore,
    fullAnalysis: fullAnalysis || 'No analysis content found'
  };
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

interface DevinSessionResponse {
  session_id: string;
  url: string;
  is_new_session: boolean;
}

interface DevinSessionDetails {
  session_id: string;
  status: string;
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

function getDevinApiKeyHeader(): Record<string, string> {
  if (typeof window !== 'undefined') {
    const key = sessionStorage.getItem('devinApiKey');
    if (key) return { 'x-devin-api-key': key };
  }
  return {};
}

export async function createDevinSession(prompt: string, title?: string): Promise<DevinSessionResponse> {
  const response = await fetch('/api/devin/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getDevinApiKeyHeader(),
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

export async function sendMessageToSession(sessionId: string, message: string): Promise<void> {
  const response = await fetch(`/api/devin/sessions/${sessionId}/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getDevinApiKeyHeader(),
    },
    body: JSON.stringify({
      message
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
  }
}

export async function getSessionDetails(sessionId: string): Promise<DevinSessionDetails> {
  const response = await fetch(`/api/devin/sessions/${sessionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getDevinApiKeyHeader(),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<DevinSessionDetails>;
}

export async function pollSessionUntilComplete(
  sessionId: string,
  onStatusUpdate?: (status: string) => void
): Promise<DevinSessionDetails> {
  const maxAttempts = 120;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const sessionDetails = await getSessionDetails(sessionId);
    console.log('sessionDetails', sessionDetails);
    
    if (onStatusUpdate) {
      onStatusUpdate(sessionDetails.status);
    }

    if (sessionDetails.messages && sessionDetails.messages.length > 0) {
      const lastMessage = sessionDetails.messages[sessionDetails.messages.length - 1];
      if (lastMessage.origin === 'user' || sessionDetails.status === 'completed') {
        return sessionDetails;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
  }

  throw new Error('Session polling timed out');
}

export async function archiveDevinSession(sessionId: string): Promise<void> {
  const response = await fetch(`/api/devin/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getDevinApiKeyHeader(),
    },
    body: JSON.stringify({ archived: true }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
  }
}

export function generateIssueScopingPrompt(issue?: {
  title: string;
  body?: string;
  number: number;
  html_url: string;
  labels: Array<{ name: string }>;
}): string {
  if (!issue) {
    return `Without implementing any changes, please scope this GitHub issue.\n\nPlease DO NOT implement any changes to the codebase yet. Once you have finished scoping, simply stop and wait for further instructions.`;
  }
  return `Without implementing any changes, please scope this GitHub issue.\n\n${stringifyIssue(issue)}\n\nPlease DO NOT implement any changes to the codebase yet. Once you have finished scoping, simply stop and wait for further instructions.`;
}

export function generateIssueCompletingPrompt(issue?: {
  title: string;
  body?: string;
  number: number;
  html_url: string;
  labels: Array<{ name: string }>;
}): string {
  if (!issue) {
    return `Please implement a solution for the described GitHub issue.`;
  }
  return `Please implement a solution for the following GitHub issue.\n\n${stringifyIssue(issue)}`;
}

export function stringifyIssue(issue: {
  title: string;
  body?: string;
  number: number;
  html_url: string;
  labels: Array<{ name: string }>;
}): string {
  const labelsText = issue.labels.length > 0 
    ? `Labels: ${issue.labels.map(l => l.name).join(', ')}`
    : 'No labels';

  return `**Issue #${issue.number}: ${issue.title}**
**URL**: ${issue.html_url}
**${labelsText}**

**Description:**
${issue.body || 'No description provided'}`;
}

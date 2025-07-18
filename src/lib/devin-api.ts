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

export async function getSessionDetails(sessionId: string): Promise<DevinSessionDetails> {
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

export async function pollSessionUntilComplete(
  sessionId: string,
  onStatusUpdate?: (status: string) => void
): Promise<DevinSessionDetails> {
  const maxAttempts = 60; // 5 minutes with 5-second intervals
  let attempts = 0;

  while (attempts < maxAttempts) {
    const sessionDetails = await getSessionDetails(sessionId);
    
    if (onStatusUpdate) {
      onStatusUpdate(sessionDetails.status);
    }

    // Check if the session has completed the initial scoping
    // We consider it complete when there are messages and the status indicates completion
    if (sessionDetails.messages && sessionDetails.messages.length > 0) {
      const lastMessage = sessionDetails.messages[sessionDetails.messages.length - 1];
      // Check if the last message is from the user (indicating scoping is done and waiting for next instruction)
      if (lastMessage.origin === 'user' || sessionDetails.status === 'completed') {
        return sessionDetails;
      }
    }

    // Wait 5 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
  }

  throw new Error('Session polling timed out');
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

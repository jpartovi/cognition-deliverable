import { NextRequest, NextResponse } from 'next/server';

interface SendMessageRequest {
  message: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const apiKey = request.headers.get('x-devin-api-key');
    const baseUrl = process.env.DEVIN_API_BASE_URL || 'https://api.devin.ai/v1';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Devin API key must be provided in the x-devin-api-key header.' },
        { status: 401 }
      );
    }

    const { sessionId } = await params;
    const body: SendMessageRequest = await request.json();

    const response = await fetch(`${baseUrl}/session/${sessionId}/message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: body.message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Devin API error: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error sending message to Devin session:', error);
    return NextResponse.json(
      { error: 'Failed to send message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

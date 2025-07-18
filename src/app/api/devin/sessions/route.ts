import { NextRequest, NextResponse } from 'next/server';

interface CreateSessionRequest {
  prompt: string;
  title?: string;
  unlisted?: boolean;
  idempotent?: boolean;
}

interface DevinSessionResponse {
  session_id: string;
  url: string;
  is_new_session: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-devin-api-key');
    const baseUrl = process.env.DEVIN_API_BASE_URL || 'https://api.devin.ai/v1';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Devin API key must be provided in the x-devin-api-key header.' },
        { status: 401 }
      );
    }

    const body: CreateSessionRequest = await request.json();

    const response = await fetch(`${baseUrl}/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: body.prompt,
        title: body.title,
        unlisted: true,
        idempotent: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Devin API error: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data: DevinSessionResponse = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error creating Devin session:', error);
    return NextResponse.json(
      { error: 'Failed to create Devin session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

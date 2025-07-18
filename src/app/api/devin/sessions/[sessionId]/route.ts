import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(
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

    const response = await fetch(`${baseUrl}/session/${sessionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Devin API error: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data: DevinSessionDetails = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching Devin session details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session details', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

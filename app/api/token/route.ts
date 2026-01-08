/**
 * API route for generating client JWT tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSDKInstance } from '@/lib/sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'userId is required and must be a string' },
        { status: 400 }
      );
    }

    const sdk = getSDKInstance();
    const token = sdk.createChatUserJwtToken(userId);

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating token:', error);
    
    // Check if it's a configuration error
    if (error instanceof Error && error.message.includes('Missing required')) {
      return NextResponse.json(
        {
          error: 'SDK not configured. Please check your .env.local file with ETHORA_CHAT_API_URL, ETHORA_CHAT_APP_ID, and ETHORA_CHAT_APP_SECRET',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate token',
      },
      { status: 500 }
    );
  }
}


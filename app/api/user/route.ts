/**
 * API route for user operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSDKInstance } from '@/lib/sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userData } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'userId is required and must be a string' },
        { status: 400 }
      );
    }

    const sdk = getSDKInstance();
    const result = await sdk.createUser(userId, userData || {});

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create user',
      },
      { status: 500 }
    );
  }
}


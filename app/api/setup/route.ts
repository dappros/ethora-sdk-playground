/**
 * API route for setting up chat room and user in one call
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSDKInstance } from '@/lib/sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, chatId, userData } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'userId is required and must be a string' },
        { status: 400 }
      );
    }

    if (!chatId || typeof chatId !== 'string') {
      return NextResponse.json(
        { error: 'chatId is required and must be a string' },
        { status: 400 }
      );
    }

    const sdk = getSDKInstance();

    // Create user (idempotent - safe to call multiple times)
    try {
      await sdk.createUser(userId, {
        firstName: userData?.firstName || 'Playground',
        lastName: userData?.lastName || 'User',
        email: userData?.email || 'yukiraze9@gmail.com',
        password: userData?.password || 'Qwerty123',
        ...userData,
      });
    } catch (userError) {
      // User might already exist, continue
      console.warn('User creation warning (may already exist):', userError);
    }

    // Create chat room (idempotent - safe to call multiple times)
    try {
      await sdk.createChatRoom(chatId, {
        title: `Chat Room ${chatId}`,
        uuid: chatId,
        type: 'group',
      });
    } catch (roomError) {
      // Room might already exist, continue
      console.warn('Room creation warning (may already exist):', roomError);
    }

    // Grant user access (idempotent)
    try {
      await sdk.grantUserAccessToChatRoom(chatId, userId);
    } catch (accessError) {
      // Access might already be granted, continue
      console.warn('Access grant warning (may already have access):', accessError);
    }

    // Generate token
    const token = sdk.createChatUserJwtToken(userId);

    // Get room JID
    const roomJID = sdk.createChatName(chatId, true);

    return NextResponse.json({
      success: true,
      token,
      roomJID,
    });
  } catch (error) {
    console.error('Error setting up chat:', error);
    
    // Check if it's a configuration error
    if (error instanceof Error && error.message.includes('Missing required')) {
      return NextResponse.json(
        {
          error: 'SDK not configured. Please check your .env.local file with ETHORA_CHAT_APP_ID and ETHORA_CHAT_APP_SECRET',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to setup chat',
      },
      { status: 500 }
    );
  }
}


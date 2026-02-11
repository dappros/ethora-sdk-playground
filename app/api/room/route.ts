/**
 * API route for chat room operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSDKInstance } from '@/lib/sdk';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json(
        { error: 'chatId query parameter is required' },
        { status: 400 }
      );
    }

    const sdk = getSDKInstance();
    const roomJID = sdk.createChatName(chatId, true);

    return NextResponse.json({ roomJID });
  } catch (error) {
    console.error('Error getting room JID:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get room JID',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatId, title, type } = body;

    if (!chatId || typeof chatId !== 'string') {
      return NextResponse.json(
        { error: 'chatId is required and must be a string' },
        { status: 400 }
      );
    }

    const sdk = getSDKInstance();
    const result = await sdk.createChatRoom(chatId, {
      title: title || `Chat Room ${chatId}`,
      uuid: chatId,
      type: type || 'group',
    });

    const roomJID = sdk.createChatName(chatId, true);

    return NextResponse.json({
      success: true,
      roomJID,
      result,
    });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create room',
      },
      { status: 500 }
    );
  }
}


/**
 * API route for chat room operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSDKInstance } from '@/lib/sdk';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId query parameter is required' },
        { status: 400 }
      );
    }

    const sdk = getSDKInstance();
    const roomJID = sdk.createChatName(workspaceId, true);

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
    const { workspaceId, title, type } = body;

    if (!workspaceId || typeof workspaceId !== 'string') {
      return NextResponse.json(
        { error: 'workspaceId is required and must be a string' },
        { status: 400 }
      );
    }

    const sdk = getSDKInstance();
    const result = await sdk.createChatRoom(workspaceId, {
      title: title || `Chat Room ${workspaceId}`,
      uuid: workspaceId,
      type: type || 'group',
    });

    const roomJID = sdk.createChatName(workspaceId, true);

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


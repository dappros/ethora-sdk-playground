/**
 * API route for SDK method execution
 */

import { NextRequest, NextResponse } from "next/server";
import { getSDKInstance } from "@/lib/sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { method, params } = body;

    if (!method || typeof method !== "string") {
      return NextResponse.json(
        { error: "method is required and must be a string" },
        { status: 400 }
      );
    }

    const sdk = getSDKInstance();

    let result: any;

    switch (method) {
      case "createChatRoom":
        if (!params.workspaceId) {
          return NextResponse.json(
            { error: "workspaceId is required" },
            { status: 400 }
          );
        }
        result = await sdk.createChatRoom(
          params.workspaceId,
          params.roomData || {}
        );
        break;

      case "createUser":
        if (!params.userId) {
          return NextResponse.json(
            { error: "userId is required" },
            { status: 400 }
          );
        }
        result = await sdk.createUser(params.userId, params.userData || {});
        break;

      case "grantUserAccessToChatRoom":
        if (!params.workspaceId || !params.userId) {
          return NextResponse.json(
            { error: "workspaceId and userId are required" },
            { status: 400 }
          );
        }
        result = await sdk.grantUserAccessToChatRoom(
          params.workspaceId,
          params.userId
        );
        break;

      case "grantChatbotAccessToChatRoom":
        if (!params.workspaceId) {
          return NextResponse.json(
            { error: "workspaceId is required" },
            { status: 400 }
          );
        }
        result = await sdk.grantChatbotAccessToChatRoom(params.workspaceId);
        break;

      case "createChatUserJwtToken":
        if (!params.userId) {
          return NextResponse.json(
            { error: "userId is required" },
            { status: 400 }
          );
        }
        result = { token: sdk.createChatUserJwtToken(params.userId) };
        break;

      case "createChatName":
        if (!params.workspaceId) {
          return NextResponse.json(
            { error: "workspaceId is required" },
            { status: 400 }
          );
        }
        result = {
          chatName: sdk.createChatName(
            params.workspaceId,
            params.full !== false
          ),
        };
        break;

      case "deleteChatRoom":
        if (!params.workspaceId) {
          return NextResponse.json(
            { error: "workspaceId is required" },
            { status: 400 }
          );
        }
        result = await sdk.deleteChatRoom(params.workspaceId);
        break;

      case "deleteUsers":
        if (
          !params.userIds ||
          !Array.isArray(params.userIds) ||
          params.userIds.length === 0
        ) {
          return NextResponse.json(
            { error: "userIds must be a non-empty array" },
            { status: 400 }
          );
        }
        result = await sdk.deleteUsers(params.userIds);
        break;

      case "getUsers":
        result = await sdk.getUsers(
          params.chatName || params.xmppUsername
            ? {
                ...(params.chatName && { chatName: params.chatName }),
                ...(params.xmppUsername && {
                  xmppUsername: params.xmppUsername,
                }),
              }
            : undefined
        );
        break;

      case "updateUsers":
        if (
          !params.users ||
          !Array.isArray(params.users) ||
          params.users.length === 0
        ) {
          return NextResponse.json(
            { error: "users must be a non-empty array" },
            { status: 400 }
          );
        }
        if (params.users.length > 100) {
          return NextResponse.json(
            { error: "Maximum 100 users allowed per request" },
            { status: 400 }
          );
        }
        result = await sdk.updateUsers(params.users);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown method: ${method}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      method,
      result,
    });
  } catch (error) {
    console.error("Error executing SDK method:", error);

    // Check if it's a configuration error
    if (error instanceof Error && error.message.includes("Missing required")) {
      return NextResponse.json(
        {
          error:
            "SDK not configured. Please check your .env.local file with ETHORA_CHAT_APP_ID and ETHORA_CHAT_APP_SECRET",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to execute SDK method",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

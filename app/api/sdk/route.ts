/**
 * API route for SDK method execution
 */

import { NextRequest, NextResponse } from "next/server";
import { getSDKInstance } from "@/lib/sdk";
import {
  validateUserData,
  validateUpdateUsers,
  validateFileUploads,
} from "@/lib/user-validation";

export async function POST(request: NextRequest) {
  try {
    // Check if request is FormData (for file uploads) or JSON
    const contentType = request.headers.get("content-type") || "";
    let body: any = {};
    let files: File[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const method = formData.get("method") as string;
      const paramsJson = formData.get("params") as string;
      
      if (paramsJson) {
        body = { method, params: JSON.parse(paramsJson) };
      } else {
        body = { method, params: {} };
      }

      // Extract files from FormData
      const fileEntries = Array.from(formData.entries()).filter(
        ([key]) => key.startsWith("file_")
      );
      files = fileEntries.map(([, value]) => value as File);
    } else {
      body = await request.json().catch(() => ({}));
    }

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

        // Validate user data
        if (params.userData) {
          const validation = validateUserData(params.userData);
          if (!validation.valid) {
            return NextResponse.json(
              { error: `Validation error: ${validation.error}` },
              { status: 400 }
            );
          }

          // Validate file uploads if files are provided
          if (files.length > 0) {
            const fileValidation = validateFileUploads([params.userData], files);
            if (!fileValidation.valid) {
              return NextResponse.json(
                { error: fileValidation.error },
                { status: 400 }
              );
            }
          }

          // Prepare userData with validated values
          params.userData = validation.value;
        }

        // Prepare userData with validated values
        const userData = params.userData || {};

        // Convert files to buffers for SDK if files are provided
        let createUserFileBuffers: Buffer[] = [];
        if (files.length > 0) {
          createUserFileBuffers = await Promise.all(
            files.map(async (file) => {
              const arrayBuffer = await file.arrayBuffer();
              return Buffer.from(arrayBuffer);
            })
          );
        }

        // Call SDK - try with files parameter first, fall back if not supported
        // The SDK backend should handle files via profileImageFileIndex in userData
        try {
          if (createUserFileBuffers.length > 0) {
            // Try calling with files parameter (if SDK supports it)
            try {
              result = await (sdk.createUser as any)(params.userId, userData, createUserFileBuffers);
            } catch (fileError: any) {
              // If files parameter not supported, call without it
              // SDK backend will use profileImageFileIndex from userData
              result = await sdk.createUser(params.userId, userData);
            }
          } else {
            result = await sdk.createUser(params.userId, userData);
          }
        } catch (sdkError) {
          throw sdkError;
        }
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

        // Validate users array
        const validation = validateUpdateUsers(params.users);
        if (!validation.valid) {
          return NextResponse.json(
            { error: `Validation error: ${validation.error}` },
            { status: 400 }
          );
        }

        // Validate file uploads if files are provided
        if (files.length > 0) {
          const fileValidation = validateFileUploads(validation.value || params.users, files);
          if (!fileValidation.valid) {
            return NextResponse.json(
              { error: fileValidation.error },
              { status: 400 }
            );
          }
        }

        // Prepare users with validated values
        const users = validation.value || params.users;

        // Convert files to buffers for SDK if files are provided
        let updateUsersFileBuffers: Buffer[] = [];
        if (files.length > 0) {
          updateUsersFileBuffers = await Promise.all(
            files.map(async (file) => {
              const arrayBuffer = await file.arrayBuffer();
              return Buffer.from(arrayBuffer);
            })
          );
        }

        // Call SDK - try with files parameter first, fall back if not supported
        // The SDK backend should handle files via profileImageFileIndex in userData
        try {
          if (updateUsersFileBuffers.length > 0) {
            // Try calling with files parameter (if SDK supports it)
            try {
              result = await (sdk.updateUsers as any)(users, updateUsersFileBuffers);
            } catch (fileError: any) {
              // If files parameter not supported, call without it
              // SDK backend will use profileImageFileIndex from userData
              result = await sdk.updateUsers(users);
            }
          } else {
            result = await sdk.updateUsers(users);
          }
        } catch (sdkError) {
          throw sdkError;
        }
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

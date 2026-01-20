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
import type {
  SDKMethodName,
  CreateChatRoomParams,
  CreateUserParams,
  GrantUserAccessParams,
  GrantChatbotAccessParams,
  CreateChatUserJwtTokenParams,
  CreateChatNameParams,
  DeleteChatRoomParams,
  DeleteUsersParams,
  GetUsersParams,
  UpdateUsersParams,
} from "@/lib/sdk-types";
import {
  isCreateChatRoomParams,
  isCreateUserParams,
  isGrantUserAccessParams,
  isGrantChatbotAccessParams,
  isCreateChatUserJwtTokenParams,
  isCreateChatNameParams,
  isDeleteChatRoomParams,
  isDeleteUsersParams,
  isGetUsersParams,
  isUpdateUsersParams,
  createSDKError,
  ERROR_SUGGESTIONS,
} from "@/lib/sdk-types";

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
      const error = createSDKError(
        "method is required and must be a string",
        "MISSING_METHOD",
        ["Ensure the method parameter is provided", "Check that method is a valid SDK method name"]
      );
      return NextResponse.json(
        { error: error.message, suggestions: error.suggestions, code: error.code },
        { status: 400 }
      );
    }

    const sdk = getSDKInstance();

    let result: any;

    switch (method) {
      case "createChatRoom": {
        if (!isCreateChatRoomParams(params)) {
          const error = createSDKError(
            "Invalid parameters for createChatRoom: workspaceId and roomData are required",
            "INVALID_PARAMS",
            ERROR_SUGGESTIONS.MISSING_WORKSPACE_ID,
            "workspaceId"
          );
          return NextResponse.json(
            { error: error.message, suggestions: error.suggestions, code: error.code, field: error.field },
            { status: 400 }
          );
        }
        result = await sdk.createChatRoom(
          params.workspaceId,
          (params.roomData || {}) as Record<string, unknown>
        );
        break;
      }

      case "createUser": {
        if (!isCreateUserParams(params)) {
          const error = createSDKError(
            "Invalid parameters for createUser: userId and userData are required",
            "INVALID_PARAMS",
            ERROR_SUGGESTIONS.MISSING_USER_ID,
            "userId"
          );
          return NextResponse.json(
            { error: error.message, suggestions: error.suggestions, code: error.code, field: error.field },
            { status: 400 }
          );
        }

        // Validate user data
        if (params.userData) {
          const validation = validateUserData(params.userData);
          if (!validation.valid) {
            const error = createSDKError(
              `Validation error: ${validation.error}`,
              "VALIDATION_ERROR",
              ERROR_SUGGESTIONS.INVALID_USER_DATA
            );
            return NextResponse.json(
              { error: error.message, suggestions: error.suggestions, code: error.code },
              { status: 400 }
            );
          }

          // Validate file uploads if files are provided
          if (files.length > 0) {
            const fileValidation = validateFileUploads([params.userData], files);
            if (!fileValidation.valid) {
              const error = createSDKError(
                fileValidation.error || "File validation failed",
                "FILE_VALIDATION_ERROR",
                ["Check that profileImageFileIndex values are within the range of uploaded files", "Ensure files are valid image formats"]
              );
              return NextResponse.json(
                { error: error.message, suggestions: error.suggestions, code: error.code },
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
              result = await sdk.createUser(params.userId, userData as Record<string, unknown>);
            }
          } else {
            result = await sdk.createUser(params.userId, userData as Record<string, unknown>);
          }
        } catch (sdkError) {
          throw sdkError;
        }
        break;
      }

      case "grantUserAccessToChatRoom": {
        if (!isGrantUserAccessParams(params)) {
          const error = createSDKError(
            "Invalid parameters for grantUserAccessToChatRoom: workspaceId and userId are required",
            "INVALID_PARAMS",
            [...ERROR_SUGGESTIONS.MISSING_WORKSPACE_ID, ...ERROR_SUGGESTIONS.MISSING_USER_ID]
          );
          return NextResponse.json(
            { error: error.message, suggestions: error.suggestions, code: error.code },
            { status: 400 }
          );
        }
        result = await sdk.grantUserAccessToChatRoom(
          params.workspaceId,
          params.userId
        );
        break;
      }

      case "grantChatbotAccessToChatRoom": {
        if (!isGrantChatbotAccessParams(params)) {
          const error = createSDKError(
            "Invalid parameters for grantChatbotAccessToChatRoom: workspaceId is required",
            "INVALID_PARAMS",
            ERROR_SUGGESTIONS.MISSING_WORKSPACE_ID,
            "workspaceId"
          );
          return NextResponse.json(
            { error: error.message, suggestions: error.suggestions, code: error.code, field: error.field },
            { status: 400 }
          );
        }
        result = await sdk.grantChatbotAccessToChatRoom(params.workspaceId);
        break;
      }

      case "createChatUserJwtToken": {
        if (!isCreateChatUserJwtTokenParams(params)) {
          const error = createSDKError(
            "Invalid parameters for createChatUserJwtToken: userId is required",
            "INVALID_PARAMS",
            ERROR_SUGGESTIONS.MISSING_USER_ID,
            "userId"
          );
          return NextResponse.json(
            { error: error.message, suggestions: error.suggestions, code: error.code, field: error.field },
            { status: 400 }
          );
        }
        result = { token: sdk.createChatUserJwtToken(params.userId) };
        break;
      }

      case "createChatName": {
        if (!isCreateChatNameParams(params)) {
          const error = createSDKError(
            "Invalid parameters for createChatName: workspaceId is required",
            "INVALID_PARAMS",
            ERROR_SUGGESTIONS.MISSING_WORKSPACE_ID,
            "workspaceId"
          );
          return NextResponse.json(
            { error: error.message, suggestions: error.suggestions, code: error.code, field: error.field },
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
      }

      case "deleteChatRoom": {
        if (!isDeleteChatRoomParams(params)) {
          const error = createSDKError(
            "Invalid parameters for deleteChatRoom: workspaceId is required",
            "INVALID_PARAMS",
            ERROR_SUGGESTIONS.MISSING_WORKSPACE_ID,
            "workspaceId"
          );
          return NextResponse.json(
            { error: error.message, suggestions: error.suggestions, code: error.code, field: error.field },
            { status: 400 }
          );
        }
        result = await sdk.deleteChatRoom(params.workspaceId);
        break;
      }

      case "deleteUsers": {
        if (!isDeleteUsersParams(params)) {
          const error = createSDKError(
            "Invalid parameters for deleteUsers: userIds must be a non-empty array of strings",
            "INVALID_PARAMS",
            ["Ensure userIds is an array", "Check that all userIds are non-empty strings", "Verify the array is not empty"]
          );
          return NextResponse.json(
            { error: error.message, suggestions: error.suggestions, code: error.code },
            { status: 400 }
          );
        }
        result = await sdk.deleteUsers(params.userIds);
        break;
      }

      case "getUsers": {
        // getUsers is optional, so we don't need strict validation
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
      }

      case "updateUsers": {
        if (!isUpdateUsersParams(params)) {
          const error = createSDKError(
            "Invalid parameters for updateUsers: users must be a non-empty array",
            "INVALID_PARAMS",
            ["Ensure users is an array", "Check that the array contains at least one user object", "Verify the JSON format is correct"]
          );
          return NextResponse.json(
            { error: error.message, suggestions: error.suggestions, code: error.code },
            { status: 400 }
          );
        }
        if (params.users.length > 100) {
          const error = createSDKError(
            "Maximum 100 users allowed per request",
            "MAX_USERS_EXCEEDED",
            ["Split the request into multiple batches", "Process users in chunks of 100 or less"]
          );
          return NextResponse.json(
            { error: error.message, suggestions: error.suggestions, code: error.code },
            { status: 400 }
          );
        }

        // Validate users array
        const validation = validateUpdateUsers(params.users);
        if (!validation.valid) {
          const error = createSDKError(
            `Validation error: ${validation.error}`,
            "VALIDATION_ERROR",
            ERROR_SUGGESTIONS.INVALID_USER_DATA
          );
          return NextResponse.json(
            { error: error.message, suggestions: error.suggestions, code: error.code },
            { status: 400 }
          );
        }

        // Validate file uploads if files are provided
        if (files.length > 0) {
          const fileValidation = validateFileUploads(validation.value || params.users, files);
          if (!fileValidation.valid) {
            const error = createSDKError(
              fileValidation.error || "File validation failed",
              "FILE_VALIDATION_ERROR",
              ["Check that profileImageFileIndex values are within the range of uploaded files", "Ensure files are valid image formats"]
            );
            return NextResponse.json(
              { error: error.message, suggestions: error.suggestions, code: error.code },
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
      }

      default: {
        const error = createSDKError(
          `Unknown method: ${method}`,
          "UNKNOWN_METHOD",
          ["Check the method name spelling", "Verify the method is supported by the SDK", "Review available SDK methods"]
        );
        return NextResponse.json(
          { error: error.message, suggestions: error.suggestions, code: error.code },
          { status: 400 }
        );
      }
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
      const sdkError = createSDKError(
        "SDK not configured. Please check your .env.local file with ETHORA_CHAT_APP_ID and ETHORA_CHAT_APP_SECRET",
        "SDK_NOT_CONFIGURED",
        ERROR_SUGGESTIONS.SDK_NOT_CONFIGURED
      );
      return NextResponse.json(
        {
          error: sdkError.message,
          suggestions: sdkError.suggestions,
          code: sdkError.code,
        },
        { status: 500 }
      );
    }

    // Check for network errors
    if (error instanceof Error && (
      error.message.includes("fetch") ||
      error.message.includes("network") ||
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("ETIMEDOUT")
    )) {
      const sdkError = createSDKError(
        error.message,
        "NETWORK_ERROR",
        ERROR_SUGGESTIONS.NETWORK_ERROR
      );
      return NextResponse.json(
        {
          error: sdkError.message,
          suggestions: sdkError.suggestions,
          code: sdkError.code,
        },
        { status: 500 }
      );
    }

    const sdkError = createSDKError(
      error instanceof Error
        ? error.message
        : "Failed to execute SDK method",
      "SDK_EXECUTION_ERROR",
      ["Check the SDK method parameters", "Verify the SDK is properly configured", "Review the error details for more information"]
    );

    return NextResponse.json(
      {
        error: sdkError.message,
        suggestions: sdkError.suggestions,
        code: sdkError.code,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

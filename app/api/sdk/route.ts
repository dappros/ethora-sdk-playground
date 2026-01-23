/**
 * API route for SDK method execution
 */

import { NextRequest, NextResponse } from "next/server";
import { getSDKInstance, generateServerToken } from "@/lib/sdk";
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
import { SDKErrorCode, createErrorResponse } from "@/lib/error-codes";

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
      const error = createErrorResponse(SDKErrorCode.MISSING_METHOD);
      return NextResponse.json(
        { error: error.message, suggestions: error.suggestions, code: error.code },
        { status: error.httpStatus || 400 }
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
        // NOTE: The @ethora/sdk-backend createUser method signature is:
        // createUser(userId: string, userData: Record<string, unknown>, files?: Buffer[]): Promise<any>
        // Files are passed as the third parameter (optional array of Buffers)
        // The userData should contain profileImageFileIndex to reference files by index
        let createUserFileBuffers: Buffer[] = [];
        if (files.length > 0) {
          createUserFileBuffers = await Promise.all(
            files.map(async (file) => {
              const arrayBuffer = await file.arrayBuffer();
              return Buffer.from(arrayBuffer);
            })
          );
        }

        // Call SDK with files parameter if files are provided
        // The SDK backend expects files as Buffer[] in the third parameter
        if (createUserFileBuffers.length > 0) {
          result = await (sdk.createUser as any)(params.userId, userData, createUserFileBuffers);
        } else {
          result = await sdk.createUser(params.userId, userData as Record<string, unknown>);
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
        // Convert page and pageSize to numbers if they are strings
        if (params.page !== undefined) {
          params.page = typeof params.page === 'string' ? Number(params.page) : params.page;
        }
        if (params.pageSize !== undefined) {
          params.pageSize = typeof params.pageSize === 'string' ? Number(params.pageSize) : params.pageSize;
        }

        // Validate pageSize if provided (max 500)
        if (params.pageSize !== undefined && params.pageSize !== null) {
          if (typeof params.pageSize !== 'number' || isNaN(params.pageSize) || params.pageSize <= 0 || params.pageSize > 500) {
            const error = createSDKError(
              "Invalid pageSize: must be a number between 1 and 500",
              "INVALID_PARAMS",
              ["pageSize must be between 1 and 500", "Default pageSize is 100 if not provided"]
            );
            return NextResponse.json(
              { error: error.message, suggestions: error.suggestions, code: error.code },
              { status: 400 }
            );
          }
        }

        // Validate page if provided
        if (params.page !== undefined && params.page !== null) {
          if (typeof params.page !== 'number' || isNaN(params.page) || params.page <= 0) {
            const error = createSDKError(
              "Invalid page: must be a positive number",
              "INVALID_PARAMS",
              ["page must be a positive number (1, 2, 3, ...)"]
            );
            return NextResponse.json(
              { error: error.message, suggestions: error.suggestions, code: error.code },
              { status: 400 }
            );
          }
        }

        // Build filter object with pagination
        const filter: any = {};
        if (params.chatName) filter.chatName = params.chatName;
        if (params.xmppUsername) filter.xmppUsername = params.xmppUsername;
        if (params.page !== undefined && params.page !== null) filter.page = params.page;
        if (params.pageSize !== undefined && params.pageSize !== null) filter.pageSize = params.pageSize;

        console.log('getUsers filter:', JSON.stringify(filter, null, 2));

        result = await sdk.getUsers(
          Object.keys(filter).length > 0 ? filter : undefined
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

        // Log the request details (x-custom-token is automatically added by SDK backend)
        console.log(`[updateUsers] Preparing to update ${users.length} user(s)`);
        console.log(`[updateUsers] Request payload:`, JSON.stringify({ users }, null, 2));
        console.log(`[updateUsers] Note: x-custom-token header is automatically added by SDK backend using ETHORA_CHAT_APP_ID and ETHORA_CHAT_APP_SECRET`);

        // Convert files to buffers for SDK if files are provided
        // NOTE: The @ethora/sdk-backend updateUsers method signature is:
        // updateUsers(users: UpdateUserData[], files?: Buffer[]): Promise<any>
        // Files are passed as the second parameter (optional array of Buffers)
        // The userData should contain profileImageFileIndex to reference files by index
        let updateUsersFileBuffers: Buffer[] = [];
        if (files.length > 0) {
          updateUsersFileBuffers = await Promise.all(
            files.map(async (file) => {
              const arrayBuffer = await file.arrayBuffer();
              return Buffer.from(arrayBuffer);
            })
          );
        }

        // Call SDK with files parameter if files are provided
        // The SDK backend automatically generates and sends x-custom-token header
        // using ETHORA_CHAT_APP_ID and ETHORA_CHAT_APP_SECRET from environment variables
        if (updateUsersFileBuffers.length > 0) {
          result = await (sdk.updateUsers as any)(users, updateUsersFileBuffers);
        } else {
          result = await sdk.updateUsers(users);
        }
        
        console.log(`[updateUsers] Successfully updated ${users.length} user(s)`);
        break;
      }

      default: {
        const error = createErrorResponse(
          SDKErrorCode.UNKNOWN_METHOD,
          `Unknown method: ${method}`
        );
        return NextResponse.json(
          { error: error.message, suggestions: error.suggestions, code: error.code },
          { status: error.httpStatus || 400 }
        );
      }
    }

    // Generate server token for logging purposes
    const serverToken = generateServerToken();

    return NextResponse.json({
      success: true,
      method,
      result,
      serverToken, // Include the actual x-custom-token value
    });
  } catch (error) {
    console.error("Error executing SDK method:", error);

    // Extract actual API error message from Axios errors
    let actualErrorMessage = error instanceof Error ? error.message : "Failed to execute SDK method";
    let httpStatus = 500;
    
    // Check if it's an AxiosError with response data
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      if (axiosError.response?.data?.error) {
        actualErrorMessage = axiosError.response.data.error;
        httpStatus = axiosError.response.status || 500;
      } else if (axiosError.response?.status) {
        httpStatus = axiosError.response.status;
      }
    }

    // Check if it's a configuration error
    if (error instanceof Error && error.message.includes("Missing required")) {
      const sdkError = createErrorResponse(SDKErrorCode.SDK_NOT_CONFIGURED);
      return NextResponse.json(
        {
          error: sdkError.message,
          suggestions: sdkError.suggestions,
          code: sdkError.code,
        },
        { status: sdkError.httpStatus || 500 }
      );
    }

    // Check for network errors
    if (error instanceof Error && (
      error.message.includes("fetch") ||
      error.message.includes("network") ||
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("ETIMEDOUT")
    )) {
      const sdkError = createErrorResponse(
        SDKErrorCode.NETWORK_ERROR,
        error.message
      );
      return NextResponse.json(
        {
          error: sdkError.message,
          suggestions: sdkError.suggestions,
          code: sdkError.code,
        },
        { status: sdkError.httpStatus || 500 }
      );
    }

    // Check for timeout errors
    if (error instanceof Error && error.message.includes("timeout")) {
      const sdkError = createErrorResponse(
        SDKErrorCode.TIMEOUT_ERROR,
        error.message
      );
      return NextResponse.json(
        {
          error: sdkError.message,
          suggestions: sdkError.suggestions,
          code: sdkError.code,
        },
        { status: sdkError.httpStatus || 504 }
      );
    }

    const sdkError = createErrorResponse(
      SDKErrorCode.SDK_EXECUTION_ERROR,
      actualErrorMessage
    );

    return NextResponse.json(
      {
        error: sdkError.message,
        suggestions: sdkError.suggestions,
        code: sdkError.code,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: httpStatus || sdkError.httpStatus || 500 }
    );
  }
}

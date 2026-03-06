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
  DeleteChatRoomParams,
  DeleteUsersParams,
  GetUsersParams,
  UpdateUsersParams,
} from "@/lib/sdk-types";
import {
  isCreateChatRoomParams,
  isCreateUserParams,
  isGrantUserAccessParams,
  isDeleteChatRoomParams,
  isDeleteUsersParams,
  isGetUsersParams,
  isUpdateUsersParams,
  isUpdateChatRoomParams,
  isGetUserChatsParams,
  isGrantChatbotAccessParams,
  isDeleteUsersAccessParams,
  isRemoveUserAccessFromChatRoomParams,
  isSendPushToUserParams,
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
    const appId = process.env.ETHORA_CHAT_APP_ID || "";
    console.log(`[SDK Proxy] Method: ${method}, appId: ${appId ? '(set)' : '(not set)'}`);
    
    if (!method || typeof method !== "string") {
      const error = createErrorResponse(SDKErrorCode.MISSING_METHOD);
      return NextResponse.json(
        { error: error.message, suggestions: error.suggestions, code: error.code },
        { status: error.httpStatus || 400 }
      );
    }

    const sdk = getSDKInstance();
    (sdk as any).lastUrl = undefined;
    
    const apiBaseUrl = (process.env.ETHORA_CHAT_API_URL || 'https://api.ethoradev.com').replace(/\/$/, '');

    let result: any;

    switch (method) {
      case "createChatRoom": {
        if (!isCreateChatRoomParams(params)) {
          const error = createSDKError(
            "Invalid parameters for createChatRoom: chatId and roomData are required",
            "INVALID_PARAMS",
            ERROR_SUGGESTIONS.MISSING_chat_ID,
            "chatId"
          );
          return NextResponse.json(
            { error: error.message, suggestions: error.suggestions, code: error.code, field: error.field },
            { status: 400 }
          );
        }
        (sdk as any).lastUrl = `${apiBaseUrl}/v2/chats`;
        result = await sdk.createChatRoom(
          params.chatId,
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
        if (createUserFileBuffers.length > 0) {
          result = await (sdk.createUser as any)(params.userId, userData, createUserFileBuffers);
        } else {
          // Prepare user object for API
          if (!userData.lastName || (userData.lastName as string).length < 2) {
            userData.lastName = (userData.lastName as string) || 'User';
          }

          // Use SDK if it correctly handles createUser, else fallback to direct API
          (sdk as any).lastUrl = `${apiBaseUrl}/v2/users/batch`;
          const userObj = {
            uuid: params.userId,
            email: userData.email || `${params.userId}@example.com`,
            firstName: userData.firstName || 'User',
            lastName: userData.lastName || 'User',
            password: userData.password || `password_${params.userId}`,
            ...Object.fromEntries(
              Object.entries(userData).filter(
                ([key]) => !['email', 'firstName', 'lastName', 'password', 'uuid', 'displayName', 'role'].includes(key)
              )
            ),
          };

          const baseUrl = (process.env.ETHORA_CHAT_API_URL || 'https://api.ethoradev.com').replace(/\/$/, '');
          const token = generateServerToken();
          const endpoint = `${baseUrl}/v2/users/batch`;
          (sdk as any).lastUrl = endpoint;

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-custom-token': token || '',
            },
            body: JSON.stringify({
              bypassEmailConfirmation: true,
              usersList: [userObj],
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API error: ${response.status}`);
          }
          result = await response.json();
        }
        break;
      }

      case "grantUserAccessToChatRoom": {
        if (!isGrantUserAccessParams(params)) {
          const error = createSDKError(
            "Invalid parameters for grantUserAccessToChatRoom: chatId and userId are required",
            "INVALID_PARAMS",
            [...ERROR_SUGGESTIONS.MISSING_chat_ID, ...ERROR_SUGGESTIONS.MISSING_USER_ID]
          );
          return NextResponse.json(
            { error: error.message, suggestions: error.suggestions, code: error.code },
            { status: 400 }
          );
        }
        // SDK handles prefixing internally per docs
        (sdk as any).lastUrl = `${apiBaseUrl}/v2/chats/users-access`;
        result = await sdk.grantUserAccessToChatRoom(
          params.chatId,
          params.userId
        );
        break;
      }



      case "deleteChatRoom": {
        if (!isDeleteChatRoomParams(params)) {
          const error = createSDKError(
            "Invalid parameters for deleteChatRoom: chatId is required",
            "INVALID_PARAMS",
            ERROR_SUGGESTIONS.MISSING_chat_ID,
            "chatId"
          );
          return NextResponse.json(
            { error: error.message, suggestions: error.suggestions, code: error.code, field: error.field },
            { status: 400 }
          );
        }
        (sdk as any).lastUrl = `${apiBaseUrl}/v1/chats`;
        result = await sdk.deleteChatRoom(params.chatId);
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
        (sdk as any).lastUrl = `${apiBaseUrl}/v1/users/batch`;
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

        // Auto-prefix xmppUsername if appId is available and prefix is missing
        if (appId && params.xmppUsername && typeof params.xmppUsername === 'string' && !params.xmppUsername.startsWith(appId)) {
          console.log(`[SDK Proxy] Auto-prefixing xmppUsername: ${params.xmppUsername} -> ${appId}_${params.xmppUsername}`);
          params.xmppUsername = `${appId}_${params.xmppUsername}`;
        }

        // Build filter object with pagination
        const filter: any = {};
        if (params.chatName) filter.chatName = params.chatName;
        if (params.xmppUsername) filter.xmppUsername = params.xmppUsername;
        if (params.page !== undefined && params.page !== null) filter.page = params.page;
        if (params.pageSize !== undefined && params.pageSize !== null) filter.pageSize = params.pageSize;

        console.log('getUsers filter:', JSON.stringify(filter, null, 2));

        (sdk as any).lastUrl = `${apiBaseUrl}/v2/chats/users`;
        result = await sdk.getUsers(
          Object.keys(filter).length > 0 ? filter : undefined
        );
        break;
      }

      case "updateUsers": {
        // Auto-prefix xmppUsername if missing before validation
        if (appId) {
          params.users.forEach((user: any) => {
            if (user.userId && !user.xmppUsername) {
              user.xmppUsername = `${appId}_${user.userId}`;
            } else if (user.xmppUsername && !user.xmppUsername.startsWith(appId)) {
              user.xmppUsername = `${appId}_${user.xmppUsername}`;
            }
          });
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

        // Filter allowed fields for updateUsers per documentation
        const cleanedUsers = users.map((user: any) => {
          const allowedFields: any = {};
          if (user.xmppUsername) allowedFields.xmppUsername = user.xmppUsername;
          if (user.firstName) allowedFields.firstName = user.firstName;
          if (user.lastName) allowedFields.lastName = user.lastName;
          if (user.username) allowedFields.username = user.username;
          if (user.profileImage) allowedFields.profileImage = user.profileImage;
          return allowedFields;
        });

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
        (sdk as any).lastUrl = `${apiBaseUrl}/v2/chats/users`;
        if (updateUsersFileBuffers.length > 0) {
          result = await (sdk.updateUsers as any)(users, updateUsersFileBuffers);
        } else {
          result = await sdk.updateUsers(users);
        }
        
        console.log(`[updateUsers] Successfully updated ${users.length} user(s)`);
        break;
      }

      case "deleteUsersAccess": {
        if (!isDeleteUsersAccessParams(params)) {
          const error = createSDKError(
            "Invalid parameters for deleteUsersAccess: chatName and members are required",
            "INVALID_PARAMS",
            ["Ensure chatName is a string", "Members must be an array of strings"]
          );
          return NextResponse.json(
            { error: error.message, suggestions: error.suggestions, code: error.code, field: error.field },
            { status: 400 }
          );
        }
        (sdk as any).lastUrl = `${apiBaseUrl}/v2/chats/users-access`;
        // In the new types, grant access and delete access use the same structure
        result = await (sdk as any).deleteUsersAccess(params.chatName, params.members);
        break;
      }

      case "removeUserAccessFromChatRoom": {
        if (!isRemoveUserAccessFromChatRoomParams(params)) {
          return NextResponse.json(
            { error: "chatId and userId are required" },
            { status: 400 }
          );
        }
        
        // Try SDK method first, fallback to direct API call if not a function
        if (typeof (sdk as any).removeUserAccessFromChatRoom === 'function') {
          (sdk as any).lastUrl = `${apiBaseUrl}/v2/chats/users-access`;
          result = await (sdk as any).removeUserAccessFromChatRoom(params.chatId, params.userId);
        } else {
          const baseUrl = (process.env.ETHORA_CHAT_API_URL || 'https://api.ethoradev.com').replace(/\/$/, '');
          const appId = process.env.ETHORA_CHAT_APP_ID || '';
          const token = generateServerToken();
          
          const chatName = params.chatId;
          const members = Array.isArray(params.userId) ? params.userId : [params.userId];

          const endpoint = `${baseUrl}/v2/chats/users-access`;
          (sdk as any).lastUrl = endpoint;
          const response = await fetch(endpoint, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'x-custom-token': token || '',
            },
            body: JSON.stringify({
              chatName,
              members,
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const err = new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
            (err as any).status = response.status;
            (err as any).data = errorData;
            (err as any).url = endpoint;
            throw err;
          }
          
          result = await response.json();
        }
        break;
      }

      case "sendPushToUser": {
        if (!isSendPushToUserParams(params)) {
          const error = createSDKError(
            "Invalid parameters for sendPushToUser: userId and data are required",
            "INVALID_PARAMS",
            ERROR_SUGGESTIONS.MISSING_USER_ID,
            "userId"
          );
          return NextResponse.json(
            { error: error.message, suggestions: error.suggestions, code: error.code, field: error.field },
            { status: 400 }
          );
        }

        // Use SDK method if available, otherwise direct API call
        if (typeof (sdk as any).sendPushToUser === 'function') {
          (sdk as any).lastUrl = `${apiBaseUrl}/v1/push/user/${params.userId}`;
          result = await (sdk as any).sendPushToUser(params.userId, params.data);
        } else {
          const baseUrl = (process.env.ETHORA_CHAT_API_URL || 'https://api.ethoradev.com').replace(/\/$/, '');
          const token = generateServerToken();
          const endpoint = `${baseUrl}/v1/push/user/${params.userId}`;
          (sdk as any).lastUrl = endpoint;
          
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-custom-token': token || '',
            },
            body: JSON.stringify(params.data),
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const err = new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
            (err as any).status = response.status;
            (err as any).data = errorData;
            (err as any).url = endpoint;
            throw err;
          }
          
          result = await response.json();
        }
        break;
      }

      case "updateChatRoom": {
        if (!isUpdateChatRoomParams(params)) {
          return NextResponse.json(
            { error: "chatId and updateData are required" },
            { status: 400 }
          );
        }
        
        // Auto-prefix chatId if appId is available and prefix is missing
        if (appId && typeof params.chatId === 'string' && !params.chatId.startsWith(appId)) {
          params.chatId = `${appId}_${params.chatId}`;
        }
        
        if (typeof (sdk as any).updateChatRoom === 'function') {
          (sdk as any).lastUrl = `${apiBaseUrl}/v2/apps/${appId}/chats/${params.chatId}`;
          result = await (sdk as any).updateChatRoom(params.chatId, params.updateData);
        } else {
          const baseUrl = (process.env.ETHORA_CHAT_API_URL || 'https://api.ethoradev.com').replace(/\/$/, '');
          const token = generateServerToken();
          const endpoint = `${baseUrl}/v2/apps/${appId}/chats/${params.chatId}`;
          (sdk as any).lastUrl = endpoint;
          
          const response = await fetch(endpoint, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'x-custom-token': token || '',
            },
            body: JSON.stringify(params.updateData),
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API error: ${response.status}`);
          }
          result = await response.json();
        }
        break;
      }

      case "getUserChats": {
        if (!isGetUserChatsParams(params)) {
          return NextResponse.json(
            { error: "userId is required" },
            { status: 400 }
          );
        }
        
        // Use plain userId for /users/{userId} paths per documentation
        const targetUserId = params.userId;
        
        if (typeof (sdk as any).getUserChats === 'function') {
          (sdk as any).lastUrl = `${apiBaseUrl}/v2/apps/${appId}/users/${targetUserId}/chats`;
          result = await (sdk as any).getUserChats(targetUserId, params.params);
        } else {
          const baseUrl = (process.env.ETHORA_CHAT_API_URL || 'https://api.ethoradev.com').replace(/\/$/, '');
          const token = generateServerToken();
          const query = new URLSearchParams();
          if (params.params?.limit) query.set('limit', params.params.limit.toString());
          if (params.params?.offset) query.set('offset', params.params.offset.toString());
          if (params.params?.includeMembers) query.set('includeMembers', 'true');
          
          const endpoint = `${baseUrl}/v2/apps/${appId}/users/${targetUserId}/chats?${query.toString()}`;
          (sdk as any).lastUrl = endpoint;
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'x-custom-token': token || '',
            },
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API error: ${response.status}`);
          }
          result = await response.json();
        }
        break;
      }

      case "grantChatbotAccessToChatRoom": {
        if (!isGrantChatbotAccessParams(params)) {
          return NextResponse.json(
            { error: "chatId is required" },
            { status: 400 }
          );
        }
        
        const botJid = process.env.ETHORA_CHAT_BOT_JID;
        if (!botJid) {
          throw new Error("Chatbot JID not configured. Set ETHORA_CHAT_BOT_JID environment variable.");
        }

        // Extract username from JID per documentation
        const chatbotUsername = botJid.split('@')[0];
        
        // Auto-prefix chatId if missing
        let targetId = params.chatId;
        
        if (typeof (sdk as any).grantChatbotAccessToChatRoom === 'function') {
          (sdk as any).lastUrl = `${apiBaseUrl}/v2/chats/users-access`;
          result = await (sdk as any).grantChatbotAccessToChatRoom(targetId);
        } else {
          // Fallback logic using grantUserAccessToChatRoom pattern
          const baseUrl = (process.env.ETHORA_CHAT_API_URL || 'https://api.ethoradev.com').replace(/\/$/, '');
          const token = generateServerToken();
          
          // Prefix chatbot username with appId
          const prefixedBotUsername = chatbotUsername.startsWith(appId) 
            ? chatbotUsername 
            : `${appId}_${chatbotUsername}`;

          // Use short name for chat room
          const shortChatName = targetId.startsWith(appId) 
            ? targetId 
            : `${appId}_${targetId}`;

          const endpoint = `${baseUrl}/v2/chats/users-access`;
          (sdk as any).lastUrl = endpoint;
          
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-custom-token': token || '',
            },
            body: JSON.stringify({
              chatName: shortChatName,
              members: [prefixedBotUsername],
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API error: ${response.status}`);
          }
          result = await response.json();
        }
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

    // Return the SDK result with metadata
    const serverToken = generateServerToken();
    
    // Check if the result is already an object we can add to, or if we should wrap it
    let finalResultData: any = result;
    const requestUrl = (sdk as any).lastUrl || apiBaseUrl;

    // We wrap it in a standard structure that our playground understands
    // { result: SDK_DATA, url: URL }
    const responsePayload = {
      result: result,
      url: requestUrl,
      success: true
    };

    const response = NextResponse.json(responsePayload);
    
    if (serverToken) {
      response.headers.set('x-server-token', serverToken);
    }
    
    return response;
  } catch (error: any) {
    console.error("Error executing SDK method:", error);

    // Log the full error object for server-side debugging
    console.log("DEBUG: Catch block error structure:", {
      message: error.message,
      status: error.status,
      hasResponse: !!error.response,
      responseData: error.response?.data
    });

    // Consolidate information from SDK message and backend response
    const sdkMessage = error instanceof Error ? error.message : "Failed to execute SDK method";
    const responseData = error.response?.data || error.data || (error.data?.response?.data);
    const requestUrl = error.config?.url || error.url || error.data?.url;

    return NextResponse.json(
      { 
        error: sdkMessage,
        message: sdkMessage,
        url: requestUrl,
        requestUrl: requestUrl,
        responseData: responseData,
        backendResponse: responseData,
        status: error.response?.status || error.status || 500,
        requestId: responseData?.requestId || error.response?.headers?.['x-request-id']
      },
      { status: error.response?.status || error.status || 500 }
    );
  }
}

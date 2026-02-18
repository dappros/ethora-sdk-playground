/**
 * TypeScript type definitions for SDK methods
 * Based on ChatRepository interface from @ethora/sdk-backend
 */

// User data types
export interface UserData extends Record<string, unknown> {
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  uuid?: string;
  profileImage?: string;
  profileImageFileIndex?: number;
  displayName?: string;
}

export interface UpdateUserData extends UserData {
  xmppUsername?: string;
}

// Room data types
export interface RoomData extends Record<string, unknown> {
  title?: string;
  uuid: string;
  type?: 'group' | 'direct' | string;
}

// Get users filter types
export interface GetUsersFilter {
  chatName?: string;
  xmppUsername?: string;
  page?: number;
  pageSize?: number;
}

// SDK Method Parameter Types
export interface CreateChatRoomParams {
  chatId: string;
  roomData: RoomData;
}

export interface CreateUserParams {
  userId: string;
  userData: UserData;
}

export interface GrantUserAccessParams {
  chatId: string;
  userId: string;
}

export interface GrantChatbotAccessParams {
  chatId: string;
}

export interface CreateChatUserJwtTokenParams {
  userId: string;
}

export interface CreateChatNameParams {
  chatId: string;
  full?: boolean;
}

export interface DeleteChatRoomParams {
  chatId: string;
}

export interface DeleteUsersParams {
  userIds: string[];
}

export interface GetUsersParams {
  chatName?: string;
  xmppUsername?: string;
  page?: number;
  pageSize?: number;
}

export interface UpdateUsersParams {
  users: UpdateUserData[];
}

export interface DeleteUsersAccessParams {
  chatName: string;
  members: string[];
}

export interface RemoveUserAccessFromChatRoomParams {
  chatId: string;
  userId: string | string[];
}

export interface SendPushToUserParams {
  userId: string;
  data: Record<string, any>;
}

// SDK Method Result Types
export type CreateChatRoomResult = any;
export type CreateUserResult = any;
export type GrantUserAccessResult = any;
export type GrantChatbotAccessResult = any;
export type CreateChatUserJwtTokenResult = { token: string };
export type CreateChatNameResult = { chatName: string };
export type DeleteChatRoomResult = any;
export type DeleteUsersResult = any;
export type GetUsersResult = any[];
export type UpdateUsersResult = any;
export type DeleteUsersAccessResult = any;
export type SendPushToUserResult = any;

// Union type for all SDK method names
export type SDKMethodName =
  | 'createChatRoom'
  | 'createUser'
  | 'grantUserAccessToChatRoom'
  | 'grantChatbotAccessToChatRoom'
  | 'createChatUserJwtToken'
  | 'createChatName'
  | 'deleteChatRoom'
  | 'deleteUsers'
  | 'getUsers'
  | 'updateUsers'
  | 'removeUserAccessFromChatRoom'
  | 'deleteUsersAccess'
  | 'sendPushToUser';

// Union type for all SDK method parameters
export type SDKMethodParams =
  | CreateChatRoomParams
  | CreateUserParams
  | GrantUserAccessParams
  | GrantChatbotAccessParams
  | CreateChatUserJwtTokenParams
  | CreateChatNameParams
  | DeleteChatRoomParams
  | DeleteUsersParams
  | GetUsersParams
  | UpdateUsersParams
  | RemoveUserAccessFromChatRoomParams
  | DeleteUsersAccessParams
  | SendPushToUserParams;

// Type guard functions
export function isCreateChatRoomParams(params: any): params is CreateChatRoomParams {
  return (
    params &&
    typeof params === 'object' &&
    typeof params.chatId === 'string' &&
    params.chatId.length > 0 &&
    params.roomData &&
    typeof params.roomData === 'object' &&
    typeof params.roomData.uuid === 'string'
  );
}

export function isCreateUserParams(params: any): params is CreateUserParams {
  return params && typeof params.userId === 'string' && params.userData;
}

export function isGrantUserAccessParams(params: any): params is GrantUserAccessParams {
  return params && typeof params.chatId === 'string' && typeof params.userId === 'string';
}

export function isGrantChatbotAccessParams(params: any): params is GrantChatbotAccessParams {
  return params && typeof params.chatId === 'string';
}

export function isCreateChatUserJwtTokenParams(params: any): params is CreateChatUserJwtTokenParams {
  return params && typeof params.userId === 'string';
}

export function isCreateChatNameParams(params: any): params is CreateChatNameParams {
  return params && typeof params.chatId === 'string';
}

export function isDeleteChatRoomParams(params: any): params is DeleteChatRoomParams {
  return params && typeof params.chatId === 'string';
}

export function isDeleteUsersParams(params: any): params is DeleteUsersParams {
  return params && Array.isArray(params.userIds) && params.userIds.every((id: any) => typeof id === 'string');
}

export function isGetUsersParams(params: any): params is GetUsersParams {
  return params && 
    (params.chatName === undefined || typeof params.chatName === 'string') &&
    (params.xmppUsername === undefined || typeof params.xmppUsername === 'string') &&
    (params.page === undefined || (typeof params.page === 'number' && params.page > 0)) &&
    (params.pageSize === undefined || (typeof params.pageSize === 'number' && params.pageSize > 0 && params.pageSize <= 500));
}

export function isUpdateUsersParams(params: any): params is UpdateUsersParams {
  return params && Array.isArray(params.users) && params.users.length > 0;
}

export function isDeleteUsersAccessParams(params: any): params is DeleteUsersAccessParams {
  return (
    params &&
    typeof params.chatName === 'string' &&
    params.chatName.length > 0 &&
    Array.isArray(params.members) &&
    params.members.every((m: any) => typeof m === 'string')
  );
}

export function isRemoveUserAccessFromChatRoomParams(
  params: any
): params is RemoveUserAccessFromChatRoomParams {
  return (
    params &&
    typeof params.chatId === 'string' &&
    params.chatId.length > 0 &&
    (typeof params.userId === 'string' ||
      (Array.isArray(params.userId) &&
        params.userId.every((id: any) => typeof id === 'string')))
  );
}

export function isSendPushToUserParams(params: any): params is SendPushToUserParams {
  return (
    params &&
    typeof params.userId === 'string' &&
    params.userId.length > 0 &&
    params.data &&
    typeof params.data === 'object'
  );
}

// Error types with suggestions
export interface SDKError {
  message: string;
  code?: string;
  suggestions?: string[];
  field?: string;
}

export function createSDKError(
  message: string,
  code?: string,
  suggestions?: string[],
  field?: string
): SDKError {
  return { message, code, suggestions, field };
}

// Common error suggestions
export const ERROR_SUGGESTIONS = {
  MISSING_chat_ID: [
    'Ensure chatId is provided and is a non-empty string',
    'Check that the chatId matches your chat identifier',
  ],
  MISSING_USER_ID: [
    'Ensure userId is provided and is a non-empty string',
    'Verify the userId format matches your user identification system',
  ],
  INVALID_USER_DATA: [
    'Check that email is a valid email address',
    'Ensure firstName and lastName are at least 3 and 2 characters respectively',
    'Verify all required fields are provided',
  ],
  INVALID_JSON: [
    'Ensure the JSON is properly formatted with matching brackets and quotes',
    'Use a JSON validator to check for syntax errors',
    'Make sure all string values are properly quoted',
  ],
  SDK_NOT_CONFIGURED: [
    'Check your .env.local file has ETHORA_CHAT_APP_ID set',
    'Verify ETHORA_CHAT_APP_SECRET is configured',
    'Ensure ETHORA_CHAT_API_URL is correct (defaults to https://api.ethoradev.com)',
  ],
  NETWORK_ERROR: [
    'Check your internet connection',
    'Verify the API endpoint is accessible',
    'Check if there are any firewall or proxy issues',
  ],
  VALIDATION_ERROR: [
    'Review the error message for specific field issues',
    'Ensure all required fields are provided',
    'Check data types match expected formats',
  ],
};

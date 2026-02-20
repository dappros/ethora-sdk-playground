/**
 * Type definitions for the Ethora SDK
 */

/**
 * UUID type - can be a string or UUID object
 */
export type UUID = string;

/**
 * Chat room name format options
 */
export interface ChatNameOptions {
  /** Whether to include the full JID domain */
  full?: boolean;
}

/**
 * JWT token payload for server authentication
 */
export interface ServerTokenPayload {
  data: {
    appId: string;
    type: "server";
  };
}

/**
 * JWT token payload for client authentication
 */
export interface ClientTokenPayload {
  data: {
    type: "client";
    userId: string;
    appId: string;
  };
}

/**
 * API response structure
 */
export interface ApiResponse {
  ok?: boolean;
  reason?: string;
  url?: string;
  [key: string]: unknown;
}

/**
 * Chat room creation request payload
 */
export interface CreateChatRoomRequest {
  title: string; // Chat room title
  uuid: string; // Chat ID
  type: string; // Room type (e.g., "group")
  [key: string]: unknown;
}

/**
 * Delete chat room request payload
 */
export interface DeleteChatRoomRequest {
  name: string;
}

/**
 * Grant access request payload
 */
export interface GrantAccessRequest {
  chatName: string; // Chat room name (short format: appId_chatId)
  members: string[]; // Array of user IDs to grant access
  [key: string]: unknown;
}

/**
 * User data for batch update
 */
export interface UpdateUserData {
  userId?: string; // User ID (optional - API might use xmppUsername instead)
  xmppUsername?: string; // XMPP username (optional - used to identify user)
  firstName?: string; // First name (optional)
  lastName?: string; // Last name (optional)
  username?: string; // Username (optional)
  profileImage?: string; // Profile image URL (optional)
  description?: string; // User description (optional)
  token?: string; // Token (optional)
  email?: string; // Email address (optional)
  appId?: string; // Application ID (optional)
  homeScreen?: string; // Home screen setting (optional)
  registrationChannelType?: string; // Registration channel type (optional)
  updatedAt?: string; // Last update timestamp (optional)
  authMethod?: string; // Authentication method (optional)
  resetPasswordExpires?: string; // Password reset expiration (optional)
  resetPasswordToken?: string; // Password reset token (optional)
  roles?: string[]; // User roles array (optional)
  tags?: string[]; // User tags array (optional)
  __v?: number; // Version number (optional)
  isProfileOpen?: boolean; // Profile visibility setting (optional)
  isAssetsOpen?: boolean; // Assets visibility setting (optional)
  isAgreeWithTerms?: boolean; // Terms agreement status (optional)
  bypassEmailConfirmation?: boolean; // Added for alignment with logs
  // Allow additional string properties
  [key: string]: string | string[] | number | boolean | undefined;
}

/**
 * Batch update users request payload
 */
export interface UpdateUsersRequest {
  users: UpdateUserData[]; // Array of users to update
}

/**
 * Get users query parameters
 */
export interface GetUsersQueryParams {
  chatName?: string; // Chat name (appId_chatId for group chats, xmppUsernameA-xmppUsernameB for 1-on-1)
  xmppUsername?: string; // XMPP username for getting a specific user
  page?: number; // Added for alignment with playground
  pageSize?: number; // Added for alignment with playground
}

/**
 * Chat repository interface
 */
export interface ChatRepository {
  /**
   * Creates a user in the chat service
   */
  createUser(
    userId: UUID,
    userData?: Record<string, unknown>
  ): Promise<ApiResponse>;

  /**
   * Creates a chat room for a chat
   */
  createChatRoom(
    chatId: UUID,
    roomData?: Record<string, unknown>
  ): Promise<ApiResponse>;

  /**
   * Grants a user access to a chat room
   */
  grantUserAccessToChatRoom(
    chatId: UUID,
    userId: UUID | UUID[]
  ): Promise<ApiResponse>;

  /**
   * Removes a user's access to a chat room
   *
   * @param chatId - The unique identifier of the chat
   * @param userId - The unique identifier of the user (or users)
   */
  removeUserAccessFromChatRoom(
    chatId: UUID,
    userId: UUID | UUID[]
  ): Promise<ApiResponse>;

  /**
   * Deletes users from the chat service
   */
  deleteUsers(userIds: UUID[]): Promise<ApiResponse>;

  /**
   * Deletes a chat room by chat ID
   */
  deleteChatRoom(chatId: UUID): Promise<ApiResponse>;

  /**
   * Updates multiple users in the chat service
   *
   * Sends PATCH request to /v2/chats/users with array of users.
   * Only provided fields will be updated.
   * Limits: 1-100 users per request.
   *
   * Response contains results array with status for each user:
   * - updated: user was successfully updated (includes updated user data)
   * - not-found: user was not found
   * - skipped: user update was skipped
   *
   * @param users - Array of user data to update (1-100 users)
   * @returns The API response with results array containing status for each user
   */
  updateUsers(users: UpdateUserData[]): Promise<ApiResponse>;

  /**
   * Gets users from the chat service
   *
   * Query parameters:
   * - No params: returns all users of the app
   * - chatName: returns all users of the chat (appId_uuId for group chats, xmppUsernameA-xmppUsernameB for 1-on-1)
   * - xmppUsername: returns a specific user by XMPP username
   *
   * @param params - Query parameters for filtering users
   * @returns The API response
   */
  getUsers(params?: GetUsersQueryParams): Promise<ApiResponse>;
}

// Internal Playground Types (to maintain compatibility with route and components)
export interface CreateChatRoomParams {
  chatId: string;
  roomData: {
    title: string;
    uuid: string;
    type: string;
    [key: string]: unknown;
  };
}

export interface CreateUserParams {
  userId: string;
  userData: {
    email: string;
    firstName: string;
    lastName: string;
    password?: string;
    uuid?: string;
    bypassEmailConfirmation?: boolean;
    [key: string]: unknown;
  };
}

export interface GrantUserAccessParams {
  chatId: string;
  userId: string | string[];
}





export interface DeleteChatRoomParams {
  chatId: string;
}

export interface DeleteUsersParams {
  userIds: string[];
}

export interface GetUsersParams extends GetUsersQueryParams {}

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

export type SDKMethodName =
  | 'createChatRoom'
  | 'createUser'
  | 'grantUserAccessToChatRoom'
  | 'deleteChatRoom'
  | 'deleteUsers'
  | 'getUsers'
  | 'updateUsers'
  | 'removeUserAccessFromChatRoom'
  | 'deleteUsersAccess'
  | 'sendPushToUser';

// Helper to keep guards working with minimal changes in route.ts
export function isCreateChatRoomParams(params: any): params is CreateChatRoomParams {
  return params && typeof params.chatId === 'string' && params.roomData && typeof params.roomData.uuid === 'string';
}

export function isCreateUserParams(params: any): params is CreateUserParams {
  return params && typeof params.userId === 'string' && params.userData;
}

export function isGrantUserAccessParams(params: any): params is GrantUserAccessParams {
  return params && typeof params.chatId === 'string' && (typeof params.userId === 'string' || Array.isArray(params.userId));
}





export function isDeleteChatRoomParams(params: any): params is DeleteChatRoomParams {
  return params && typeof params.chatId === 'string';
}

export function isDeleteUsersParams(params: any): params is DeleteUsersParams {
  return params && Array.isArray(params.userIds);
}

export function isGetUsersParams(params: any): params is GetUsersParams {
  return params !== undefined;
}

export function isUpdateUsersParams(params: any): params is UpdateUsersParams {
  return params && Array.isArray(params.users);
}

export function isDeleteUsersAccessParams(params: any): params is DeleteUsersAccessParams {
  return params && typeof params.chatName === 'string' && Array.isArray(params.members);
}

export function isRemoveUserAccessFromChatRoomParams(params: any): params is RemoveUserAccessFromChatRoomParams {
  return params && typeof params.chatId === 'string' && (typeof params.userId === 'string' || Array.isArray(params.userId));
}

export function isSendPushToUserParams(params: any): params is SendPushToUserParams {
  return params && typeof params.userId === 'string' && params.data;
}

export function createSDKError(message: string, code?: string, suggestions?: string[], field?: string) {
  return { message, code, suggestions, field };
}

export const ERROR_SUGGESTIONS = {
  MISSING_chat_ID: ['Provide chatId'],
  MISSING_USER_ID: ['Provide userId'],
  INVALID_USER_DATA: ['Check user data'],
};

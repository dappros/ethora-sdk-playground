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
    tenantId?: string;
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
  userId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get user chats query parameters
 */
export interface GetUserChatsQueryParams {
  limit?: number;
  offset?: number;
  includeMembers?: boolean;
}

/**
 * Update chat room request payload
 */
export interface UpdateChatRoomData {
  title?: string;
  description?: string;
}

export interface ListAppChatsQueryParams {
  limit?: number;
  offset?: number;
  includeMembers?: boolean;
}

/**
 * Chat repository interface
 */
export interface ChatRepository {
  createChatName(chatId: UUID, full?: boolean): string;

  createChatUserJwtToken(userId: UUID): string;

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

  /**
   * Retrieves all rooms a user belongs to
   *
   * @param userId - The unique identifier of the user
   * @param params - Query parameters for pagination and members
   */
  getUserChats(userId: UUID, params?: GetUserChatsQueryParams): Promise<ApiResponse>;

  getUserChatsInApp(
    appId: UUID,
    userId: UUID,
    params?: GetUserChatsQueryParams
  ): Promise<ApiResponse>;

  /**
   * Updates metadata for an existing room
   *
   * @param chatId - The unique identifier of the chat
   * @param updateData - The metadata to update (title, description)
   */
  updateChatRoom(chatId: UUID, updateData: UpdateChatRoomData): Promise<ApiResponse>;

  listChatsInApp(appId: UUID, params?: ListAppChatsQueryParams): Promise<ApiResponse>;

  createAppToken(appId: UUID, payload?: { label?: string }): Promise<ApiResponse>;

  getUsersBatchJob(appId: UUID, jobId: UUID): Promise<ApiResponse>;

  getAppUserByXmppUsername(xmppUsername: UUID): Promise<ApiResponse>;
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
  appId: string;
  data: Record<string, any>;
}

export interface UpdateChatRoomParams {
  chatId: string;
  updateData: UpdateChatRoomData;
}

export interface GetUserChatsParams {
  userId: string;
  params?: GetUserChatsQueryParams;
}

export interface GetUserChatsInAppParams {
  appId: string;
  userId: string;
  params?: GetUserChatsQueryParams;
}

export interface GetUsersBatchJobParams {
  appId: string;
  jobId: string;
}

export interface GetAppUserByXmppUsernameParams {
  xmppUsername: string;
}

export interface CreateAppTokenParams {
  appId: string;
  label?: string;
}

export interface ListChatsInAppParams {
  appId: string;
  params?: ListAppChatsQueryParams;
}

export interface CreateChatUserJwtTokenParams {
  userId: string;
}

export interface BuildChatRoomIdentifierParams {
  chatId: string;
  full?: boolean;
}

export type SDKMethodName =
  | 'buildChatRoomIdentifier'
  | 'createChatUserJwtToken'
  | 'createChatRoom'
  | 'createUser'
  | 'grantUserAccessToChatRoom'
  | 'deleteChatRoom'
  | 'deleteUsers'
  | 'getUsers'
  | 'updateUsers'
  | 'removeUserAccessFromChatRoom'
  | 'deleteUsersAccess'
  | 'sendPushToUser'
  | 'updateChatRoom'
  | 'getUserChats'
  | 'getUserChatsInApp'
  | 'getUsersBatchJob'
  | 'getAppUserByXmppUsername'
  | 'createAppToken'
  | 'listChatsInApp';
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
  return params && typeof params.appId === 'string' && params.data;
}

export function isUpdateChatRoomParams(params: any): params is UpdateChatRoomParams {
  return params && typeof params.chatId === 'string' && params.updateData;
}

export function isGetUserChatsParams(params: any): params is GetUserChatsParams {
  return params && typeof params.userId === 'string';
}

export function isGetUserChatsInAppParams(params: any): params is GetUserChatsInAppParams {
  return params && typeof params.appId === 'string' && typeof params.userId === 'string';
}

export function isGetUsersBatchJobParams(params: any): params is GetUsersBatchJobParams {
  return params && typeof params.appId === 'string' && typeof params.jobId === 'string';
}

export function isGetAppUserByXmppUsernameParams(
  params: any
): params is GetAppUserByXmppUsernameParams {
  return params && typeof params.xmppUsername === 'string';
}

export function isCreateAppTokenParams(params: any): params is CreateAppTokenParams {
  return params && typeof params.appId === 'string';
}

export function isListChatsInAppParams(params: any): params is ListChatsInAppParams {
  return params && typeof params.appId === 'string';
}

export function isCreateChatUserJwtTokenParams(
  params: any
): params is CreateChatUserJwtTokenParams {
  return params && typeof params.userId === 'string';
}

export function isBuildChatRoomIdentifierParams(
  params: any
): params is BuildChatRoomIdentifierParams {
  return params && typeof params.chatId === 'string';
}

export function createSDKError(message: string, code?: string, suggestions?: string[], field?: string) {
  return { message, code, suggestions, field };
}

export const ERROR_SUGGESTIONS = {
  MISSING_chat_ID: ['Provide chatId'],
  MISSING_USER_ID: ['Provide userId'],
  INVALID_USER_DATA: ['Check user data'],
};

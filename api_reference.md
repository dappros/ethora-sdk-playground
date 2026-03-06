# Ethora SDK API Reference

This document provides a comprehensive list of all methods available in the [EthoraSDKService](file:///Users/admin/Work/ethora-sdk-backend-integration/src/repositories/EthoraSDKService.ts#39-688), including their TypeScript interfaces and example payloads.

## Common Types

### [ApiResponse](file:///Users/admin/Work/ethora-sdk-backend-integration/src/types/index.ts#42-48)
All asynchronous methods return a `Promise<ApiResponse>`.
```typescript
interface ApiResponse {
  ok?: boolean;      // True if the request was successful
  reason?: string;  // Error message if ok is false
  url?: string;     // The actual API endpoint called (for debugging)
  [key: string]: unknown; // Other response-specific data
}
```

---

## User Management

### [createUser(userId: UUID, userData?: Record<string, unknown>)](file:///Users/admin/Work/ethora-sdk-backend-integration/src/repositories/EthoraSDKService.ts#166-253)
Creates a user in the chat service.

- **Types**: `UUID = string`
- **Example Request**:
```typescript
await sdk.createUser("user-uuid-123", {
  email: "john@example.com",
  firstName: "John",
  lastName: "Doe",
  displayName: "John D."
});
```

### [updateUsers(users: UpdateUserData[])](file:///Users/admin/Work/ethora-sdk-backend-integration/src/repositories/EthoraSDKService.ts#506-567)
Updates multiple users in a single batch.

- **Interfaces**:
```typescript
interface UpdateUserData {
  xmppUsername: string; // Required (appId_userId)
  firstName?: string;
  lastName?: string;
  username?: string;
  profileImage?: string;
  description?: string;
}
```
- **Example Request**:
```typescript
await sdk.updateUsers([
  {
    xmppUsername: "6984..._user-123",
    firstName: "Johnny"
  }
]);
```

### [deleteUsers(userIds: UUID[])](file:///Users/admin/Work/ethora-sdk-backend-integration/src/repositories/EthoraSDKService.ts#410-449)
Deletes one or more users.

- **Example Request**:
```typescript
await sdk.deleteUsers(["user-123", "user-456"]);
```

---

## Chat Room Management

### [createChatRoom(chatId: UUID, roomData?: Record<string, unknown>)](file:///Users/admin/Work/ethora-sdk-backend-integration/src/repositories/EthoraSDKService.ts#254-285)
Creates a new chat room.

- **Interfaces**:
```typescript
interface CreateChatRoomRequest {
  title: string;
  uuid: string; // The workspace/chat identifier
  type: string; // Usually "group"
}
```
- **Example Request**:
```typescript
await sdk.createChatRoom("room-xyz", {
  title: "General Chat",
  type: "group"
});
```

### [updateChatRoom(chatId: UUID, updateData: { title?: string; description?: string })](file:///Users/admin/Work/ethora-sdk-backend-integration/src/repositories/EthoraSDKService.ts#653-687)
Updates metadata for an existing room.

- **Example Request**:
```typescript
await sdk.updateChatRoom("room-xyz", {
  title: "New Title",
  description: "New description"
});
```

### [deleteChatRoom(chatId: UUID)](file:///Users/admin/Work/ethora-sdk-backend-integration/src/repositories/EthoraSDKService.ts#450-505)
Removes a chat room from the service.

- **Example Request**:
```typescript
await sdk.deleteChatRoom("room-xyz");
```

---

## Access Control

### [grantUserAccessToChatRoom(chatId: UUID, userId: UUID | UUID[])](file:///Users/admin/Work/ethora-sdk-backend-integration/src/repositories/EthoraSDKService.ts#286-336)
Adds user(s) to a room.

- **Example Request**:
```typescript
await sdk.grantUserAccessToChatRoom("room-xyz", "user-123");
```

### [removeUserAccessFromChatRoom(chatId: UUID, userId: UUID | UUID[])](file:///Users/admin/Work/ethora-sdk-backend-integration/src/repositories/EthoraSDKService.ts#361-409)
Removes user(s) from a room.

- **Example Request**:
```typescript
await sdk.removeUserAccessFromChatRoom("room-xyz", ["user-123"]);
```

---

## Data Retrieval

### [getUsers(params?: GetUsersQueryParams)](file:///Users/admin/Work/ethora-sdk-backend-integration/src/repositories/EthoraSDKService.ts#568-613)
Retrieves users with optional filtering.

- **Interfaces**:
```typescript
interface GetUsersQueryParams {
  chatName?: string;     // appId_roomId
  xmppUsername?: string; // specific user
}
```

### [getUserChats(userId: UUID, params?: GetUserChatsQueryParams)](file:///Users/admin/Work/ethora-sdk-backend-integration/src/repositories/EthoraSDKService.ts#614-652)
Retrieves all rooms a user belongs to.

- **Interfaces**:
```typescript
interface GetUserChatsQueryParams {
  limit?: number;
  offset?: number;
  includeMembers?: boolean;
}
```
- **Example Request**:
```typescript
await sdk.getUserChats("user-123", { limit: 50, includeMembers: true });
```

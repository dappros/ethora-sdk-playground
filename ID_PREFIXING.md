# Ethora SDK — ID Prefixing Rules

This document explains which parameters need the `appId_` prefix and which should stay as plain UUIDs.

---

## TL;DR

| Parameter | Type | Needs Prefix? | Who Adds It? |
|---|---|---|---|
| `uuid` (create user) | payload field | ❌ No | — |
| `userId` (delete users) | path / payload | ❌ No | API uses appId separately |
| `userId` (get user chats) | URL path | ❌ No | API resolves via appId in path |
| `xmppUsername` (update/get users) | query / payload | ✅ Yes (`appId_userId`) | Proxy auto-adds it |
| `chatId` / `chatName` (create/delete room) | payload | ❌ No | SDK adds prefix internally |
| `chatId` (update room) | URL path | ✅ Yes (`appId_chatId`) | Proxy auto-adds it |
| `chatId` (grant/remove access) | payload `chatName` | ✅ Yes (`appId_chatId`) | SDK adds prefix internally |
| `userId` (grant/remove access) | payload `members` | ✅ Yes (`appId_userId`) | SDK adds prefix internally |

---

## Per-Method Breakdown

### `createUser(userId, userData)`
- **Endpoint**: `POST /v2/users/batch`
- **`uuid`** in payload → **plain UUID**, no prefix
- **`email`, `firstName`, `lastName`, `password`** → plain values
- The API links the user to the app via the server token (`x-custom-token` contains `appId`)

```json
{
  "bypassEmailConfirmation": true,
  "usersList": [{ "uuid": "my-user-id", "email": "...", ... }]
}
```

---

### `updateUsers(users[])`
- **Endpoint**: `PATCH /v2/chats/users`
- **`xmppUsername`** → ✅ **requires `appId_userId` prefix**
- **Do NOT send `userId`** in payload (API ignores it, only `xmppUsername` identifies the user)
- Proxy auto-converts `userId → xmppUsername` by prepending `appId_`
- Allowed fields: `xmppUsername`, `firstName`, `lastName`, `username`, `profileImage`

```json
{ "users": [{ "xmppUsername": "appId_my-user-id", "firstName": "John" }] }
```

---

### `deleteUsers(userIds[])`
- **Endpoint**: `DELETE /v1/users/batch`
- **`userIds`** → **plain UUIDs**, no prefix
- The API finds users by `userId + appId` combined (appId comes from server token, not the ID itself)

```json
{ "usersIdList": ["my-user-id"] }
```

---

### `getUsers(params?)`
- **Endpoint**: `GET /v2/chats/users`
- **`xmppUsername`** filter → ✅ **requires `appId_userId` prefix**
- **`chatName`** filter → ✅ **requires `appId_chatId` prefix** (for group chats)
- Proxy auto-prefixes `xmppUsername` if missing

```
GET /v2/chats/users?xmppUsername=appId_my-user-id
```

---

### `getUserChats(userId, params?)`
- **Endpoint**: `GET /v2/apps/{appId}/users/{userId}/chats`
- **`userId`** in URL path → **plain UUID**, no prefix
- The `appId` is already a separate path segment in the URL

```
GET /v2/apps/appId/users/my-user-id/chats
```

---

### `createChatRoom(chatId, roomData?)`
- **Endpoint**: `POST /v2/chats`
- **`uuid`** in payload → **plain UUID**, no prefix
- The API uses `uuid` as a storage key but the actual room JID is built by the XMPP server

```json
{ "title": "My Room", "uuid": "my-room-id", "type": "group" }
```

---

### `updateChatRoom(chatId, updateData)`
- **Endpoint**: `PATCH /v2/apps/{appId}/chats/{chatId}`
- **`chatId`** in URL path → ✅ **requires `appId_chatId` prefix**
- Proxy auto-prefixes if missing

```
PATCH /v2/apps/appId/chats/appId_my-room-id
```

---

### `deleteChatRoom(chatId)`
- **Endpoint**: `DELETE /v1/chats`
- **`name`** in payload → ✅ **requires `appId_chatId` short name** (no `@domain` suffix)
- SDK's `createChatName(chatId, false)` builds this automatically

```json
{ "name": "appId_my-room-id" }
```

---

### `grantUserAccessToChatRoom(chatId, userId)`
- **Endpoint**: `POST /v2/chats/users-access`
- **`chatName`** → ✅ **requires `appId_chatId` short name** — SDK adds this automatically
- **`members[]`** → ✅ **requires `appId_userId` prefix** — SDK adds this automatically
- Pass plain IDs to the SDK; it handles all prefixing internally

```json
{ "chatName": "appId_my-room-id", "members": ["appId_my-user-id"] }
```

---

### `removeUserAccessFromChatRoom(chatId, userId)`
- Same rules as `grantUserAccessToChatRoom` above.
- **Endpoint**: `DELETE /v2/chats/users-access`
- SDK handles prefixing internally.

---

### `buildChatRoomIdentifier(chatId, full)`
- Playground alias for SDK helper `createChatName(chatId, full)`.
- Use it when you want to inspect generated room identifiers before sending API requests.
- `full = false` returns short ID (`appId_chatId`), `full = true` returns full JID (`appId_chatId@conference...`).

---

## Summary Rules

**No prefix needed when:**
- The ID is a `uuid` in a creation payload (API links it via token)
- The ID is in a URL path that already contains `{appId}` as a separate segment
- The API endpoint documents using `userId` + appId from token separately (e.g., `deleteUsers`)

**Prefix required when:**
- The ID is used as an XMPP identifier (`xmppUsername`, `chatName`, `members[]`)
- These are used for XMPP routing and must be globally unique: `appId_localpart`
- The URL path does NOT contain `{appId}` as a separate segment (e.g., `updateChatRoom`)

**Who applies the prefix:**
- **SDK** — applies it for `grantUserAccessToChatRoom`, `removeUserAccessFromChatRoom`, `deleteChatRoom`
- **Proxy (`route.ts`)** — applies it for `updateChatRoom`, `updateUsers`, `getUsers` (xmppUsername)
- **You** — no prefix needed for plain UUID fields (create operations)

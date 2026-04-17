# Ethora API Integration Guide

This guide provides a step-by-step walkthrough for integrating Ethora's real-time communication features into any backend system.

## Prerequisites

To begin the integration, you need your Ethora App credentials:
- **Ethora App ID**: Unique identifier for your application.
- **Ethora App Secret**: Used for signing JWT tokens in server-to-server communication.
- **API URL**: Typically `https://api.chat.ethora.com`.

---

## 1. Authentication (Server-to-Server)

Ethora uses JWT (JSON Web Token) for authentication. Your backend must include an `x-custom-token` header in all REST API requests.

### Data Object (JWT Payload)
```json
{
  "data": {
    "appId": "YOUR_APP_ID",
    "type": "server"
  },
  "exp": 1740652800 // Unix timestamp (e.g., current time + 1 hour)
}
```

### Description
Sign this payload using your **App Secret** and the HMAC SHA256 algorithm. The resulting string is your "Server Token".

Example implementation in TypeScript:

```typescript
export function generateServerToken(): string | null {
  try {
    const jwt = require('jsonwebtoken');
    const appId = process.env.ETHORA_CHAT_APP_ID;
    const appSecret = process.env.ETHORA_CHAT_APP_SECRET;

    if (!appId || !appSecret) {
      return null;
    }

    return jwt.sign(
      {
        data: {
          appId: appId,
          type: 'server',
        },
      },
      appSecret,
      { expiresIn: '1h' }
    ) as string;
  } catch (error) {
    console.error('Error generating server token:', error);
    return null;
  }
}
```

---

## 2. User Management

Synchronize your application users with Ethora to enable chat functionality.

### Endpoint: Create User
**URL:** `POST {{API_URL}}/v1/users/batch`

### Data Object
```json
{
  "bypassEmailConfirmation": true,
  "usersList": [
    {
      "uuid": "unique_user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "password": "secure_password"
    }
  ]
}
```

### Description
This batch endpoint registers your users. `uuid` should be your internal user ID to maintain a clear mapping. `password` is required by the API but typically not used if you use JWT for client authentication.

---

## 3. Chat Room Integration

Create and manage chat spaces for your users.

### Step 3a: Create Chat Room
**URL:** `POST {{API_URL}}/v1/chats`

### Data Object
```json
{
  "title": "Project Discussion",
  "uuid": "unique_room_id",
  "type": "group"
}
```

### Description
Creates a new chat room. The `uuid` should be your internal identifier for the entity associated with the chat (e.g., a Project ID or Workspace ID).

### Step 3b: Grant User Access
**URL:** `POST {{API_URL}}/v1/chats/users-access`

### Data Object
```json
{
  "chatName": "YOUR_APP_ID_unique_room_id",
  "members": ["user_id_1", "user_id_2"]
}
```

### Description
Adds users to a specific chat room. The `chatName` is constructed by prefixing your `App ID` followed by an underscore `_` and your room's `uuid`.

---

## 4. Client Authentication (Client-to-Server)

To give a user access to the chat from the frontend (mobile or web), your backend must generate a Client JWT.

### Data Object (JWT Payload)
```json
{
  "data": {
    "appId": "YOUR_APP_ID",
    "userId": "unique_user_id"
  },
  "exp": 1740656400
}
```

### Description
Sign this payload with your **App Secret**. Pass this token to your frontend, which will use it to initialize the Ethora Chat Component or SDK.

---

## Summary of REST Endpoints

| Action | Method | Endpoint |
| :--- | :--- | :--- |
| **Create/Batch Users** | `POST` | `/v1/users/batch` |
| **Delete Users** | `DELETE` | `/v1/users/batch` |
| **Create Chat Room** | `POST` | `/v1/chats` |
| **Delete Chat Room** | `DELETE` | `/v1/chats` |
| **Grant Access** | `POST` | `/v1/chats/users-access` |
| **Query Users** | `GET` | `/v1/chats/users` |
| **Update Users** | `PATCH` | `/v1/chats/users` |

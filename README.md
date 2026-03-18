# Ethora SDK Playground

An interactive Next.js playground for testing and configuring the Ethora SDK and Chat Component.

**Part of the [Ethora SDK ecosystem](https://github.com/dappros/ethora#ecosystem)** — see all SDKs, tools, and sample apps. Follow cross-SDK updates in the [Release Notes](https://github.com/dappros/ethora/blob/main/RELEASE-NOTES.md).

## Features

- **Live Chat Preview**: See your chat configuration in real-time
- **Settings Panel**: Configure all chat options including colors, XMPP settings, and feature toggles
- **Code Export**: Generate production-ready code snippets based on your configuration
- **Real SDK Integration**: Uses the official `@ethora/sdk-backend` npm package

## Setup

### 1. Install Dependencies

```bash
cd playground-nextjs
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory.

#### Backend Secrets (Required)
These variables are used by the server-side proxy to interact with Ethora APIs and **must not** have the `NEXT_PUBLIC_` prefix to keep them secure.

```bash
ETHORA_CHAT_APP_ID=your_app_id
ETHORA_CHAT_APP_SECRET=your_app_secret
```

#### Frontend & Connection Settings (Recommended)
These variables can be prefixed with `NEXT_PUBLIC_` to be accessible directly by the chat component in the browser. The playground also supports non-prefixed versions via an internal config API.

```bash
# API & General
NEXT_PUBLIC_ETHORA_CHAT_API_URL=https://api.ethoradev.com
NEXT_PUBLIC_ETHORA_CHAT_QR_URL=https://app.ethora.com/app/chat/?qrChatId=

# XMPP Connection
NEXT_PUBLIC_ETHORA_XMPP_DEV_SERVER=wss://xmpp.ethoradev.com:5443/ws
NEXT_PUBLIC_ETHORA_XMPP_HOST=xmpp.ethoradev.com
NEXT_PUBLIC_ETHORA_XMPP_CONFERENCE=conference.xmpp.ethoradev.com

# Defaults for Playground
ETHORA_CHAT_USER_ID=playground-user-1
ETHORA_CHAT_ROOM_ID=playground-room-1
```

**Important**: Replace `your_app_id` and `your_app_secret` with your actual Ethora app credentials from [ethora.com](https://ethora.com).
**Tip**: The Settings panel pre-fills from these variables. If you change `.env.local`, remember to restart the development server.

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Configure Settings**: Use the left sidebar to adjust chat settings:
   - Authentication (User ID, Room ID)
   - Appearance (Colors, Theme)
   - XMPP Settings
   - Feature Toggles
   - API Configuration

2. **Setup Chat**: Click "Setup Chat Room & User" to create the chat room and user, and generate a token.

3. **Preview Chat**: The chat component will render in the main area with your current settings.

4. **Export Code**: Click "Show Code" to see and copy the generated code snippet for your configuration.

## Project Structure

```
playground-nextjs/
├── app/
│   ├── api/              # API routes for SDK operations
│   ├── layout.tsx        # Root layout
│   ├── page.tsx         # Main playground page
│   └── globals.css      # Global styles
├── components/
│   ├── ChatPreview.tsx  # Chat component wrapper
│   ├── CodeBlock.tsx    # Code export component
│   └── SettingsPanel.tsx # Settings controls
├── lib/
│   ├── chat-config.ts   # Type definitions
│   ├── code-generator.ts # Code snippet generator
│   └── sdk.ts           # SDK initialization
└── package.json
```

## API Routes

- `POST /api/setup` - Setup chat room and user, returns token and room JID
- `POST /api/token` - Generate client JWT token
- `POST /api/room` - Create chat room
- `GET /api/room` - Get room JID
- `POST /api/user` - Create user

## Troubleshooting

### SDK Not Configured Error

If you see "SDK not configured" errors:
1. Make sure `.env.local` exists in `playground-nextjs/`
2. Verify all three required environment variables are set
3. Restart the Next.js dev server after changing `.env.local`

### Chat Not Loading

- Check browser console for errors
- Verify your Ethora app credentials are correct
- Ensure the API URL is accessible
- Check that the user and room were created successfully

## Development

This playground uses:
- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **@ethora/chat-component** for the chat UI
- **@ethora/sdk-backend** npm package for backend operations

## License

MIT

# Ethora SDK Playground

An interactive Next.js playground for Ethora — a **public "try it without signup" sandbox** plus a developer testing console for the Ethora SDK and Chat Component.

A first-time visitor lands on the **Quickstart** tab: pick an industry (telehealth, insurance/claims, marketplace, support/WordPress), see a live chat, and copy the exact code to drop into their own app — no account required. Developers can switch to the Chat, SDK, HTTP and Client tabs for deeper testing.

**Part of the [Ethora SDK ecosystem](https://github.com/dappros/ethora#ecosystem)** — see all SDKs, tools, and sample apps. Follow cross-SDK updates in the [Release Notes](https://github.com/dappros/ethora/blob/main/RELEASE-NOTES.md).

## Features

- **Quickstart (no signup)**: Vertical templates that load a ready-made chat and a copy-paste snippet; a "Launch live demo" button provisions a throwaway guest user + room.
- **Vertical templates**: Telehealth, Insurance/Claims, Marketplace, Support/WordPress — each with a compliance angle and sensible defaults (`lib/vertical-templates.ts`).
- **Live Chat Preview**: See your chat configuration in real-time.
- **Settings Panel**: Configure all chat options including colors, XMPP settings, and feature toggles.
- **Code Export**: Generate production-ready code snippets based on your configuration.
- **Real SDK Integration**: Uses the official `@ethora/sdk-backend` npm package.
- **Production-first defaults**: Out of the box the playground points at the production cloud (`api.chat.ethora.com` / `xmpp.chat.ethora.com`); override via `.env.local` for your own deployment.

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
# API & General (production cloud — these are also the built-in defaults)
NEXT_PUBLIC_ETHORA_CHAT_API_URL=https://api.chat.ethora.com
NEXT_PUBLIC_ETHORA_CHAT_QR_URL=https://app.chat.ethora.com/app/chat/?qrChatId=

# XMPP Connection
NEXT_PUBLIC_ETHORA_XMPP_DEV_SERVER=wss://xmpp.chat.ethora.com/ws
NEXT_PUBLIC_ETHORA_XMPP_HOST=xmpp.chat.ethora.com
NEXT_PUBLIC_ETHORA_XMPP_CONFERENCE=conference.xmpp.chat.ethora.com

# Defaults for Playground
ETHORA_CHAT_USER_ID=playground-user-1
ETHORA_CHAT_ROOM_ID=playground-room-1
```

> If you omit these, the playground falls back to the production endpoints above. Point them at your own self-hosted server (or a dev environment) to test a different deployment.

**Important**: Replace `your_app_id` and `your_app_secret` with your actual Ethora app credentials from [ethora.com](https://ethora.com).
**Tip**: The Settings panel pre-fills from these variables. If you change `.env.local`, remember to restart the development server.

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser (the dev server runs on port 3001).

## Usage

### Quickstart (default tab — for first-time visitors)

1. **Pick a vertical**: On the Quickstart tab, choose Telehealth, Insurance/Claims, Marketplace or Support/WordPress. This applies sensible defaults and jumps straight to a live chat.
2. **Launch live demo**: Click "Launch live demo chat" to provision a throwaway guest user + room (no signup) and open the chat.
3. **Copy the code**: Grab the copy-paste install snippet and the per-platform SDK links (React, React Native, iOS, Android, WordPress).

### Developer console (Chat / SDK / HTTP / Client tabs)

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
│   ├── QuickstartPanel.tsx # Public "try without signup" landing
│   ├── ChatPreview.tsx  # Chat component wrapper
│   ├── CodeBlock.tsx    # Code export component
│   └── SettingsPanel.tsx # Settings controls
├── lib/
│   ├── chat-config.ts   # Type definitions + production defaults
│   ├── vertical-templates.ts # Quickstart vertical presets
│   ├── code-generator.ts # Code snippet generator
│   └── sdk.ts           # SDK initialization
└── package.json
```

## Deploying as a public sandbox

The playground is a standard Next.js app and deploys to Vercel (or any Node host) as-is.

- **Keep secrets server-side.** `ETHORA_CHAT_APP_ID` / `ETHORA_CHAT_APP_SECRET` must **not** carry the `NEXT_PUBLIC_` prefix — they are used only by the server-side API routes and are never exposed to the browser.
- **Defaults are production.** With no env set, the app talks to `api.chat.ethora.com` / `xmpp.chat.ethora.com`.
- **Throwaway guests.** "Launch live demo" generates a unique guest identity per visitor, so no real account is reused.

> Note: `test-users.xlsx` and `scripts/build-test-users-xlsx.py` are local developer fixtures that contain pre-generated JWTs and are **gitignored** — do not commit credentials. Use `scripts/setup-test-users.ts` (reads app secret from `.env.local`) to regenerate test users instead.

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

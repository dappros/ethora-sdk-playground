# Ethora SDK Playground

An interactive Next.js playground for testing and configuring the Ethora SDK and Chat Component.

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

Create a `.env.local` file in the `playground-nextjs` directory:

```bash
ETHORA_CHAT_API_URL=https://api.ethoradev.com
ETHORA_CHAT_APP_ID=your_app_id
ETHORA_CHAT_APP_SECRET=your_app_secret
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

**Important**: Replace `your_app_id` and `your_app_secret` with your actual Ethora app credentials from [ethora.com](https://ethora.com).

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


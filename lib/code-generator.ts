/**
 * Code generator for Ethora Chat integration snippets
 */

import type { PlaygroundSettings } from './chat-config';

export interface CodeSnippetOptions {
  settings: PlaygroundSettings;
  token?: string;
  roomJID?: string;
  includeBackend?: boolean;
}

/**
 * Generate production-ready code snippet based on current settings
 */
export function generateCodeSnippet(options: CodeSnippetOptions): string {
  const { settings, token, roomJID, includeBackend = false } = options;

  const backendCode = includeBackend
    ? `// Backend setup (Node.js/Express example)
import { getEthoraSDKService } from '@ethora/sdk-backend';

// Initialize SDK (requires env vars: ETHORA_CHAT_APP_ID, ETHORA_CHAT_APP_SECRET)
// ETHORA_CHAT_API_URL is optional (defaults to https://api.ethoradev.com)
const chatRepo = getEthoraSDKService();

// Create chat room
await chatRepo.createChatRoom('${settings.roomId}', {
  title: 'Chat Room',
  uuid: '${settings.roomId}',
  type: 'group',
});

// Create user
await chatRepo.createUser('${settings.userId}', {
  firstName: 'User',
  lastName: 'Name',
  email: 'user@example.com',
});

// Grant user access
await chatRepo.grantUserAccessToChatRoom('${settings.roomId}', '${settings.userId}');

// Generate client token
const clientToken = chatRepo.createChatUserJwtToken('${settings.userId}');

// Get room JID
const roomJID = chatRepo.createChatName('${settings.roomId}', true);

// Send push notification
await chatRepo.sendPushToUser('${settings.userId}', {
  title: 'Hello',
  message: 'This is a push notification',
});

`
    : '';

  // Build config object dynamically based on settings
  const configEntries: string[] = [];

  // Basic settings
  if (settings.disableHeader) configEntries.push(`disableHeader: ${settings.disableHeader},`);
  if (settings.disableMedia) configEntries.push(`disableMedia: ${settings.disableMedia},`);
  
  configEntries.push(`colors: {
    primary: '${settings.primaryColor}',
    secondary: '${settings.secondaryColor}',
  },`);

  if (settings.baseUrl) configEntries.push(`baseUrl: '${settings.baseUrl}',`);
  if (settings.customAppToken) configEntries.push(`customAppToken: '${settings.customAppToken}',`);
  if (settings.newArch !== undefined) configEntries.push(`newArch: ${settings.newArch},`);
  if (settings.qrUrl) configEntries.push(`qrUrl: '${settings.qrUrl}',`);

  // XMPP Settings
  configEntries.push(`xmppSettings: {
    devServer: '${settings.xmppDevServer}',
    host: '${settings.xmppHost}',
    conference: '${settings.xmppConference}',
    ${settings.xmppPingOnSendEnabled ? 'xmppPingOnSendEnabled: true,' : ''}
  },`);

  // JWT Login
  if (token) {
    configEntries.push(`jwtLogin: {
      token: token,
      enabled: true,
    },`);
  }

  // Feature toggles
  if (settings.disableRooms !== undefined) configEntries.push(`disableRooms: ${settings.disableRooms},`);
  if (settings.defaultLogin !== undefined) configEntries.push(`defaultLogin: ${settings.defaultLogin},`);
  if (settings.disableInteractions !== undefined) configEntries.push(`disableInteractions: ${settings.disableInteractions},`);
  if (settings.chatHeaderBurgerMenu !== undefined) configEntries.push(`chatHeaderBurgerMenu: ${settings.chatHeaderBurgerMenu},`);
  if (settings.forceSetRoom !== undefined) configEntries.push(`forceSetRoom: ${settings.forceSetRoom},`);
  if (settings.setRoomJidInPath !== undefined) configEntries.push(`setRoomJidInPath: ${settings.setRoomJidInPath},`);
  if (settings.disableRoomMenu !== undefined) configEntries.push(`disableRoomMenu: ${settings.disableRoomMenu},`);
  if (settings.disableRoomConfig !== undefined) configEntries.push(`disableRoomConfig: ${settings.disableRoomConfig},`);
  if (settings.disableProfilesInteractions !== undefined) configEntries.push(`disableProfilesInteractions: ${settings.disableProfilesInteractions},`);
  if (settings.disableUserCount !== undefined) configEntries.push(`disableUserCount: ${settings.disableUserCount},`);
  if (settings.clearStoreBeforeInit !== undefined) configEntries.push(`clearStoreBeforeInit: ${settings.clearStoreBeforeInit},`);
  if (settings.disableSentLogic !== undefined) configEntries.push(`disableSentLogic: ${settings.disableSentLogic},`);
  if (settings.initBeforeLoad !== undefined) configEntries.push(`initBeforeLoad: ${settings.initBeforeLoad},`);
  if (settings.disableNewChatButton !== undefined) configEntries.push(`disableNewChatButton: ${settings.disableNewChatButton},`);
  if (settings.botMessageAutoScroll !== undefined) configEntries.push(`botMessageAutoScroll: ${settings.botMessageAutoScroll},`);
  if (settings.disableTypingIndicator !== undefined) configEntries.push(`disableTypingIndicator: ${settings.disableTypingIndicator},`);

  // Refresh Tokens
  if (settings.refreshTokensEnabled) {
    configEntries.push(`refreshTokens: {
      enabled: true,
    },`);
  }

  // Enable Rooms Retry
  if (settings.enableRoomsRetry) {
    configEntries.push(`enableRoomsRetry: {
      enabled: true,
      helperText: '${settings.enableRoomsRetryHelperText}',
    },`);
  }

  // Background Chat
  if (settings.backgroundChatColor || settings.backgroundChatImage) {
    configEntries.push(`backgroundChat: {
      ${settings.backgroundChatColor ? `color: '${settings.backgroundChatColor}',` : ''}
      ${settings.backgroundChatImage ? `image: '${settings.backgroundChatImage}',` : ''}
    },`);
  }

  // Block Message Sending When Processing
  if (settings.blockMessageSendingWhenProcessing) {
    if (settings.blockMessageSendingTimeout) {
      configEntries.push(`blockMessageSendingWhenProcessing: {
        enabled: true,
        timeout: ${settings.blockMessageSendingTimeout},
      },`);
    } else {
      configEntries.push(`blockMessageSendingWhenProcessing: true,`);
    }
  }

  // Chat Header Settings
  if (settings.chatHeaderSettingsHide || settings.chatHeaderSettingsDisableCreate || 
      settings.chatHeaderSettingsDisableMenu || settings.chatHeaderSettingsHideSearch) {
    configEntries.push(`chatHeaderSettings: {
      ${settings.chatHeaderSettingsHide ? 'hide: true,' : 'hide: false,'}
      ${settings.chatHeaderSettingsDisableCreate ? 'disableCreate: true,' : 'disableCreate: false,'}
      ${settings.chatHeaderSettingsDisableMenu ? 'disableMenu: true,' : 'disableMenu: false,'}
      ${settings.chatHeaderSettingsHideSearch ? 'hideSearch: true,' : 'hideSearch: false,'}
    },`);
  }

  // Disable Chat Info
  if (settings.disableChatInfoHeader || settings.disableChatInfoDescription || 
      settings.disableChatInfoType || settings.disableChatInfoMembers || 
      settings.disableChatInfoHeaderMenu) {
    configEntries.push(`disableChatInfo: {
      ${settings.disableChatInfoHeader ? 'disableHeader: true,' : 'disableHeader: false,'}
      ${settings.disableChatInfoDescription ? 'disableDescription: true,' : 'disableDescription: false,'}
      ${settings.disableChatInfoType ? 'disableType: true,' : 'disableType: false,'}
      ${settings.disableChatInfoMembers ? 'disableMembers: true,' : 'disableMembers: false,'}
      ${settings.disableChatInfoHeaderMenu ? 'disableChatHeaderMenu: true,' : 'disableChatHeaderMenu: false,'}
    },`);
  }

  // Translations
  if (settings.translatesEnabled) {
    configEntries.push(`translates: {
      enabled: true,
    },`);
  }

  // Secondary Send Button
  if (settings.secondarySendButtonEnabled) {
    configEntries.push(`secondarySendButton: {
      enabled: true,
      messageEdit: '${settings.secondarySendButtonMessageEdit}',
      ${settings.secondarySendButtonHideInputSendButton ? 'hideInputSendButton: true,' : ''}
      ${settings.secondarySendButtonOverwriteEnterClick ? 'overwriteEnterClick: true,' : ''}
    },`);
  }

  // Message Text Filter
  if (settings.messageTextFilterEnabled) {
    configEntries.push(`messageTextFilter: {
      enabled: true,
      filterFunction: (text: string) => text, // Customize this function as needed
    },`);
  }

  // Custom Typing Indicator
  if (settings.customTypingIndicatorEnabled) {
    configEntries.push(`customTypingIndicator: {
      enabled: true,
      ${settings.customTypingIndicatorText ? `text: '${settings.customTypingIndicatorText}',` : ''}
      position: '${settings.customTypingIndicatorPosition}',
    },`);
  }

  const configString = configEntries.join('\n          ');

  const frontendCode = `// Frontend component (React/Next.js)
'use client';

import { Chat, XmppProvider } from '@ethora/chat-component';

export default function ChatComponent() {
  // Token should be fetched from your backend API
  // Example: const token = await fetch('/api/chat/token').then(r => r.json());
  const token = ${token ? `'${token}'` : "'YOUR_CLIENT_TOKEN_HERE'"};
  const roomJID = ${roomJID ? `'${roomJID}'` : "'YOUR_ROOM_JID_HERE'"};

  return (
    <XmppProvider>
      <Chat
        roomJID={roomJID}
        config={{
          ${configString}
        }}
      />
    </XmppProvider>
  );
}
`;

  const envComment = `// Environment variables:
// ETHORA_CHAT_API_URL=${settings.baseUrl.replace('/v1', '')}
// ETHORA_CHAT_APP_ID=your_app_id
// ETHORA_CHAT_APP_SECRET=your_app_secret
// ETHORA_XMPP_DEV_SERVER=${settings.xmppDevServer}
// ETHORA_XMPP_HOST=${settings.xmppHost}
// ETHORA_XMPP_CONFERENCE=${settings.xmppConference}

`;

  return envComment + backendCode + frontendCode;
}

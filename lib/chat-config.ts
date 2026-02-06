/**
 * Type definitions for Ethora Chat Component configuration
 * Based on IConfig interface from @ethora/chat-component
 */

import React from 'react';

// Supporting types
export interface FBConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface User {
  [key: string]: any;
}

export interface xmppSettingsInterface {
  devServer?: string;
  host?: string;
  conference?: string;
  xmppPingOnSendEnabled?: boolean;
}

export interface ConfigRoom {
  [key: string]: any;
}

export interface MessageBubble {
  [key: string]: any;
}

export interface MessageProps {
  [key: string]: any;
}

export interface PartialRoomWithMandatoryKeys {
  [key: string]: any;
}

export interface Iso639_1Codes {
  [key: string]: string;
}

// Main IConfig interface
export interface ChatConfig {
  disableHeader?: boolean;
  disableMedia?: boolean;
  colors?: { primary: string; secondary: string };
  googleLogin?: {
    enabled: boolean;
    firebaseConfig: FBConfig;
  };
  jwtLogin?: {
    token: string;
    enabled: boolean;
    handleBadlogin?: React.ReactElement;
  };
  userLogin?: {
    enabled: boolean;
    user: User | null;
  };
  customLogin?: {
    enabled: boolean;
    loginFunction: () => Promise<User | null>;
  };
  baseUrl?: string;
  customAppToken?: string;
  xmppSettings?: xmppSettingsInterface;
  disableRooms?: boolean;
  defaultLogin?: boolean;
  disableInteractions?: boolean;
  chatHeaderBurgerMenu?: boolean;
  forceSetRoom?: boolean;
  roomListStyles?: React.CSSProperties;
  chatRoomStyles?: React.CSSProperties;
  setRoomJidInPath?: boolean;
  disableRoomMenu?: boolean;
  defaultRooms?: ConfigRoom[];
  refreshTokens?: {
    enabled: boolean;
    refreshFunction?: () => Promise<{
      accessToken: string;
      refreshToken?: string;
    } | null>;
  };
  backgroundChat?: {
    color?: string;
    image?: string | File;
  };
  bubleMessage?: MessageBubble;
  headerLogo?: string | React.ReactElement;
  headerMenu?: () => void;
  headerChatMenu?: () => void;
  customRooms?: {
    rooms: PartialRoomWithMandatoryKeys[];
    disableGetRooms?: boolean;
    singleRoom: boolean;
  };
  translates?: { enabled: boolean; translations?: Iso639_1Codes };
  disableRoomConfig?: boolean;
  disableProfilesInteractions?: boolean;
  disableUserCount?: boolean;
  clearStoreBeforeInit?: boolean;
  disableSentLogic?: boolean;
  initBeforeLoad?: boolean;
  newArch?: boolean;
  qrUrl?: string;
  secondarySendButton?: {
    enabled: boolean;
    messageEdit: string;
    label?: React.ReactNode;
    buttonStyles?: React.CSSProperties;
    hideInputSendButton?: boolean;
    overwriteEnterClick?: true;
  };
  enableRoomsRetry?: { enabled: boolean; helperText: string };
  disableNewChatButton?: boolean;
  chatHeaderAdditional?: { enabled: boolean; element: any };
  botMessageAutoScroll?: boolean;
  messageTextFilter?: {
    enabled: boolean;
    filterFunction: (text: string) => string;
  };
  eventHandlers?: {
    onMessageSent?: (event: {
      message: string;
      roomJID: string;
      user: any;
      messageType: 'text' | 'media';
      metadata?: any;
    }) => void | Promise<void>;
    onMessageFailed?: (event: {
      message: string;
      roomJID: string;
      error: Error;
      messageType: 'text' | 'media';
    }) => void;
    onMessageEdited?: (event: {
      messageId: string;
      newMessage: string;
      roomJID: string;
      user: any;
    }) => void;
  };
  disableTypingIndicator?: boolean;
  blockMessageSendingWhenProcessing?:
    | boolean
    | {
        enabled: boolean;
        timeout?: number;
        onTimeout?: (roomJID: string) => void;
      };
  customTypingIndicator?: {
    enabled: boolean;
    text?: string | ((usersTyping: string[]) => string);
    position?: 'bottom' | 'top' | 'overlay' | 'floating';
    styles?: React.CSSProperties;
    customComponent?: React.ComponentType<{
      usersTyping: string[];
      text: string;
      isVisible: boolean;
    }>;
  };
  whitelistSystemMessage?: string[];
  customSystemMessage?: React.ComponentType<MessageProps>;
  disableChatInfo?: {
    disableHeader?: boolean;
    disableDescription?: boolean;
    disableType?: boolean;
    disableMembers?: boolean;
    disableChatHeaderMenu?: boolean;
  };
  chatHeaderSettings?: {
    hide?: boolean;
    disableCreate?: boolean;
    disableMenu?: boolean;
    hideSearch?: boolean;
  };
}

// Extended PlaygroundSettings with all configurable options
export interface PlaygroundSettings {
  // Authentication
  userId: string;
  roomId: string;
  token?: string;

  // Appearance
  primaryColor: string;
  secondaryColor: string;
  theme: 'light' | 'dark';
  qrUrl: string;
  backgroundChatColor?: string;
  backgroundChatImage?: string;

  // XMPP Settings
  xmppDevServer: string;
  xmppHost: string;
  xmppConference: string;
  xmppPingOnSendEnabled: boolean;

  // Feature Toggles - Basic
  newArch: boolean;
  disableRooms: boolean;
  disableRoomMenu: boolean;
  enableRoomsRetry: boolean;
  refreshTokensEnabled: boolean;
  disableHeader: boolean;
  disableMedia: boolean;
  defaultLogin: boolean;
  disableInteractions: boolean;
  chatHeaderBurgerMenu: boolean;
  forceSetRoom: boolean;
  setRoomJidInPath: boolean;
  disableRoomConfig: boolean;
  disableProfilesInteractions: boolean;
  disableUserCount: boolean;
  clearStoreBeforeInit: boolean;
  disableSentLogic: boolean;
  initBeforeLoad: boolean;
  disableNewChatButton: boolean;
  botMessageAutoScroll: boolean;
  disableTypingIndicator: boolean;

  // API Configuration
  baseUrl: string;
  customAppToken?: string;

  // Advanced Features
  enableRoomsRetryHelperText: string;
  blockMessageSendingWhenProcessing: boolean;
  blockMessageSendingTimeout?: number;

  // Chat Header Settings
  chatHeaderSettingsHide: boolean;
  chatHeaderSettingsDisableCreate: boolean;
  chatHeaderSettingsDisableMenu: boolean;
  chatHeaderSettingsHideSearch: boolean;

  // Chat Info Settings
  disableChatInfoHeader: boolean;
  disableChatInfoDescription: boolean;
  disableChatInfoType: boolean;
  disableChatInfoMembers: boolean;
  disableChatInfoHeaderMenu: boolean;

  // Translations
  translatesEnabled: boolean;

  // Secondary Send Button
  secondarySendButtonEnabled: boolean;
  secondarySendButtonMessageEdit: string;
  secondarySendButtonHideInputSendButton: boolean;
  secondarySendButtonOverwriteEnterClick: boolean;

  // Message Text Filter
  messageTextFilterEnabled: boolean;

  // Custom Typing Indicator
  customTypingIndicatorEnabled: boolean;
  customTypingIndicatorPosition: 'bottom' | 'top' | 'overlay' | 'floating';
  customTypingIndicatorText: string;
}

const resolveApiBaseUrl = () => {
  const raw =
    process.env.NEXT_PUBLIC_ETHORA_CHAT_API_URL ||
    process.env.ETHORA_CHAT_API_URL ||
    'https://api.ethoradev.com';
  const trimmed = raw.replace(/\/$/, '');
  return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`;
};

export const defaultSettings: PlaygroundSettings = {
  userId: 'playground-user-1',
  roomId: 'playground-room-1',
  primaryColor: '#ffffff',
  secondaryColor: '#141414',
  theme: 'light',
  qrUrl: 'https://app.ethora.com/app/chat/?qrChatId=',
  xmppDevServer: 'wss://xmpp.ethoradev.com:5443/ws',
  xmppHost: 'xmpp.ethoradev.com',
  xmppConference: 'conference.xmpp.ethoradev.com',
  xmppPingOnSendEnabled: true,
  newArch: true,
  disableRooms: false,
  disableRoomMenu: false,
  enableRoomsRetry: true,
  refreshTokensEnabled: true,
  disableHeader: false,
  disableMedia: false,
  defaultLogin: false,
  disableInteractions: false,
  chatHeaderBurgerMenu: false,
  forceSetRoom: false,
  setRoomJidInPath: true,
  disableRoomConfig: false,
  disableProfilesInteractions: false,
  disableUserCount: false,
  clearStoreBeforeInit: false,
  disableSentLogic: false,
  initBeforeLoad: false,
  disableNewChatButton: false,
  botMessageAutoScroll: false,
  disableTypingIndicator: false,
  // Use environment variable for baseUrl or fall back to default
  baseUrl: typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ETHORA_CHAT_API_URL 
    ? `${process.env.NEXT_PUBLIC_ETHORA_CHAT_API_URL}/v1`
    : 'https://api.ethoradev.com/v1',
  enableRoomsRetryHelperText: 'Initializing room',
  blockMessageSendingWhenProcessing: false,
  chatHeaderSettingsHide: false,
  chatHeaderSettingsDisableCreate: false,
  chatHeaderSettingsDisableMenu: false,
  chatHeaderSettingsHideSearch: false,
  disableChatInfoHeader: false,
  disableChatInfoDescription: false,
  disableChatInfoType: false,
  disableChatInfoMembers: false,
  disableChatInfoHeaderMenu: false,
  translatesEnabled: false,
  secondarySendButtonEnabled: false,
  secondarySendButtonMessageEdit: '',
  secondarySendButtonHideInputSendButton: false,
  secondarySendButtonOverwriteEnterClick: false,
  messageTextFilterEnabled: false,
  customTypingIndicatorEnabled: false,
  customTypingIndicatorPosition: 'bottom',
  customTypingIndicatorText: '',
};

/**
 * Convert playground settings to Chat component config
 */
export function settingsToChatConfig(
  settings: PlaygroundSettings,
  token?: string
): ChatConfig {
  const config: ChatConfig = {
    disableHeader: settings.disableHeader,
    disableMedia: settings.disableMedia,
    colors: {
      primary: settings.primaryColor,
      secondary: settings.secondaryColor,
    },
    baseUrl: settings.baseUrl,
    customAppToken: settings.customAppToken,
    newArch: settings.newArch,
    qrUrl: settings.qrUrl,
    xmppSettings: {
      devServer: settings.xmppDevServer,
      host: settings.xmppHost,
      conference: settings.xmppConference,
      xmppPingOnSendEnabled: settings.xmppPingOnSendEnabled,
    },
    jwtLogin: token
      ? {
          token,
          enabled: true,
        }
      : undefined,
    disableRoomMenu: settings.disableRoomMenu,
    disableRooms: settings.disableRooms,
    refreshTokens: {
      enabled: settings.refreshTokensEnabled,
    },
    setRoomJidInPath: settings.setRoomJidInPath,
    enableRoomsRetry: {
      enabled: settings.enableRoomsRetry,
      helperText: settings.enableRoomsRetryHelperText,
    },
    defaultLogin: settings.defaultLogin,
    disableInteractions: settings.disableInteractions,
    chatHeaderBurgerMenu: settings.chatHeaderBurgerMenu,
    forceSetRoom: settings.forceSetRoom,
    disableRoomConfig: settings.disableRoomConfig,
    disableProfilesInteractions: settings.disableProfilesInteractions,
    disableUserCount: settings.disableUserCount,
    clearStoreBeforeInit: settings.clearStoreBeforeInit,
    disableSentLogic: settings.disableSentLogic,
    initBeforeLoad: settings.initBeforeLoad,
    disableNewChatButton: settings.disableNewChatButton,
    botMessageAutoScroll: settings.botMessageAutoScroll,
    disableTypingIndicator: settings.disableTypingIndicator,
    translates: settings.translatesEnabled
      ? { enabled: true }
      : undefined,
    chatHeaderSettings: {
      hide: settings.chatHeaderSettingsHide,
      disableCreate: settings.chatHeaderSettingsDisableCreate,
      disableMenu: settings.chatHeaderSettingsDisableMenu,
      hideSearch: settings.chatHeaderSettingsHideSearch,
    },
    disableChatInfo: {
      disableHeader: settings.disableChatInfoHeader,
      disableDescription: settings.disableChatInfoDescription,
      disableType: settings.disableChatInfoType,
      disableMembers: settings.disableChatInfoMembers,
      disableChatHeaderMenu: settings.disableChatInfoHeaderMenu,
    },
  };

  // Background chat
  if (settings.backgroundChatColor || settings.backgroundChatImage) {
    config.backgroundChat = {
      color: settings.backgroundChatColor,
      image: settings.backgroundChatImage,
    };
  }

  // Block message sending when processing
  if (settings.blockMessageSendingWhenProcessing) {
    config.blockMessageSendingWhenProcessing = settings.blockMessageSendingTimeout
      ? {
          enabled: true,
          timeout: settings.blockMessageSendingTimeout,
        }
      : true;
  }

  // Secondary send button
  if (settings.secondarySendButtonEnabled) {
    config.secondarySendButton = {
      enabled: true,
      messageEdit: settings.secondarySendButtonMessageEdit,
      hideInputSendButton: settings.secondarySendButtonHideInputSendButton,
      overwriteEnterClick: settings.secondarySendButtonOverwriteEnterClick
        ? true
        : undefined,
    };
  }

  // Message text filter
  if (settings.messageTextFilterEnabled) {
    config.messageTextFilter = {
      enabled: true,
      filterFunction: (text: string) => text, // Default no-op, can be customized
    };
  }

  // Custom typing indicator
  if (settings.customTypingIndicatorEnabled) {
    config.customTypingIndicator = {
      enabled: true,
      text: settings.customTypingIndicatorText || undefined,
      position: settings.customTypingIndicatorPosition,
    };
  }

  return config;
}

/**
 * Settings that require component remount (structural changes)
 * These settings affect initialization, connection, or core architecture.
 * 
 * When a setting in this list changes, the chat component will be completely
 * unmounted and remounted with the new configuration.
 * 
 * To add new remount-required settings:
 * 1. Add the setting key to this array
 * 2. The remount will happen automatically when that setting changes
 * 
 * Examples of remount-required settings:
 * - Architecture changes (newArch)
 * - Connection settings (xmppDevServer, xmppHost, baseUrl)
 * - Initialization flags (clearStoreBeforeInit, initBeforeLoad)
 * - Core feature toggles that affect component structure (disableRooms, defaultLogin)
 */
export const REMOUNT_REQUIRED_SETTINGS: (keyof PlaygroundSettings)[] = [
  'newArch',
  'clearStoreBeforeInit',
  'initBeforeLoad',
  'baseUrl',
  'customAppToken',
  'xmppDevServer',
  'xmppHost',
  'xmppConference',
  'disableRooms',
  'defaultLogin',
  'forceSetRoom',
  'setRoomJidInPath',
  'refreshTokensEnabled',
  'enableRoomsRetry',
  // Add 'useStoreConsoleEnabled' here if you add it to PlaygroundSettings
];

/**
 * Check if settings changes require component remount
 */
export function requiresRemount(
  prevSettings: PlaygroundSettings,
  newSettings: PlaygroundSettings
): boolean {
  return REMOUNT_REQUIRED_SETTINGS.some(
    (key) => prevSettings[key] !== newSettings[key]
  );
}

/**
 * Generate a stable key for remount detection
 */
export function getRemountKey(settings: PlaygroundSettings): string {
  const remountValues = REMOUNT_REQUIRED_SETTINGS.map((key) => ({
    [key]: settings[key],
  }));
  return JSON.stringify(remountValues);
}

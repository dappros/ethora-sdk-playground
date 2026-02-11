'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Chat, XmppProvider } from '@ethora/chat-component';
import type { PlaygroundSettings } from '@/lib/chat-config';
import { settingsToChatConfig, requiresRemount, getRemountKey } from '@/lib/chat-config';

interface ChatPreviewProps {
  settings: PlaygroundSettings;
}

export default function ChatPreview({ settings }: ChatPreviewProps) {
  const [token, setToken] = useState<string | undefined>(settings.token);
  const [roomJID, setRoomJID] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReloading, setIsReloading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const prevSettingsRef = useRef<PlaygroundSettings>(settings);
  const remountKeyRef = useRef<string>('');

  // Generate component key that includes all UI-affecting settings
  // This ensures the component remounts when any UI setting changes
  const componentKey = useMemo(() => {
    // Include all settings that affect UI/configuration
    const uiSettings = {
      // Structural/remount-required settings
      remount: getRemountKey(settings),
      // UI appearance settings
      colors: `${settings.primaryColor}-${settings.secondaryColor}`,
      backgroundChatColor: settings.backgroundChatColor,
      backgroundChatImage: settings.backgroundChatImage,
      // UI control settings
      disableHeader: settings.disableHeader,
      disableMedia: settings.disableMedia,
      disableInteractions: settings.disableInteractions,
      chatHeaderBurgerMenu: settings.chatHeaderBurgerMenu,
      disableNewChatButton: settings.disableNewChatButton,
      disableUserCount: settings.disableUserCount,
      // Chat header settings
      chatHeaderSettings: {
        hide: settings.chatHeaderSettingsHide,
        disableCreate: settings.chatHeaderSettingsDisableCreate,
        disableMenu: settings.chatHeaderSettingsDisableMenu,
        hideSearch: settings.chatHeaderSettingsHideSearch,
      },
      // Chat info settings
      disableChatInfo: {
        disableHeader: settings.disableChatInfoHeader,
        disableDescription: settings.disableChatInfoDescription,
        disableType: settings.disableChatInfoType,
        disableMembers: settings.disableChatInfoMembers,
        disableChatHeaderMenu: settings.disableChatInfoHeaderMenu,
      },
      // Other UI settings
      disableRoomMenu: settings.disableRoomMenu,
      disableTypingIndicator: settings.disableTypingIndicator,
      customTypingIndicatorEnabled: settings.customTypingIndicatorEnabled,
      secondarySendButtonEnabled: settings.secondarySendButtonEnabled,
      translatesEnabled: settings.translatesEnabled,
      botMessageAutoScroll: settings.botMessageAutoScroll,
    };
    return JSON.stringify(uiSettings);
  }, [settings]);

  // Track settings changes and trigger remount when any config-affecting setting changes
  useEffect(() => {
    const currentConfigKey = componentKey;
    const prevConfigKey = remountKeyRef.current;

    // Remount if config key changed (any UI or structural setting changed)
    if (prevConfigKey && prevConfigKey !== currentConfigKey) {
      setIsReloading(true);
      remountKeyRef.current = currentConfigKey;
      setReloadKey((prev) => prev + 1);
      
      // Reset reloading state after component remounts
      const timer = setTimeout(() => setIsReloading(false), 800);
      return () => clearTimeout(timer);
    } else if (!prevConfigKey) {
      // Initialize on first render
      remountKeyRef.current = currentConfigKey;
    }
  }, [componentKey]);

  useEffect(() => {
    let cancelled = false;

    async function setupChat() {
      // Only setup if we have valid userId and roomId
      if (!settings.userId || !settings.roomId) {
        setLoading(false);
        setError('User ID and Room ID are required');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Setup chat room and user, get token and room JID
        const response = await fetch('/api/setup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: settings.userId,
            chatId: settings.roomId,
            userData: {
              firstName: 'Playground',
              lastName: 'User',
              email: 'yukiraze9@gmail.com',
              password: 'Qwerty123',
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to setup chat');
        }

        const data = await response.json();
        
        if (cancelled) return;

        setToken(data.token);
        setRoomJID(data.roomJID);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to setup chat');
        setLoading(false);
      }
    }

    setupChat();

    return () => {
      cancelled = true;
    };
  }, [settings.userId, settings.roomId]);

  // Update token when settings.token changes
  useEffect(() => {
    if (settings.token) {
      setToken(settings.token);
    }
  }, [settings.token]);

  // Generate config
  const chatConfig = useMemo(() => {
    return settingsToChatConfig(settings, token);
  }, [settings, token]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Setting up chat...</p>
          <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">Creating room and user...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isConfigError = error.includes('SDK not configured') || 
                         error.includes('Missing required') ||
                         error.includes('ETHORA_CHAT');
    
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-w-md">
          <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">
            Error Loading Chat
          </h3>
          <p className="text-red-600 dark:text-red-300 text-sm mb-2">{error}</p>
          {isConfigError ? (
            <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 rounded text-xs">
              <p className="text-red-700 dark:text-red-300 font-medium mb-1">
                Configuration Required:
              </p>
              <ul className="list-disc list-inside text-red-600 dark:text-red-400 space-y-1">
                <li>Create .env.local file in playground-nextjs/</li>
                <li>Set ETHORA_CHAT_APP_ID</li>
                <li>Set ETHORA_CHAT_APP_SECRET</li>
                <li>ETHORA_CHAT_API_URL is optional (defaults to https://api.ethoradev.com)</li>
              </ul>
            </div>
          ) : (
            <p className="text-red-500 dark:text-red-400 text-xs mt-2">
              Make sure your .env.local file has valid Ethora credentials.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!token || !roomJID) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p>Missing token or room JID</p>
        </div>
      </div>
    );
  }

  const XmppProviderAny = XmppProvider as unknown as React.ComponentType<React.PropsWithChildren<{}>>;

  return (
    <div className="h-full bg-white dark:bg-gray-900 relative">
      {/* Reload indicator */}
      {isReloading && (
        <div className="absolute top-4 right-4 z-50 bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-sm font-medium">Reloading chat...</span>
        </div>
      )}
      
      <XmppProviderAny>
        {/* @ts-ignore - Chat component types may not be fully exported */}
        <Chat 
          key={`${componentKey}-${reloadKey}`} 
          roomJID={roomJID} 
          config={chatConfig as unknown as any}
        />
      </XmppProviderAny>
    </div>
  );
}


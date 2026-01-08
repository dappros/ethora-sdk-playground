'use client';

import React, { useEffect, useState } from 'react';
import { Chat, XmppProvider } from '@ethora/chat-component';
import type { PlaygroundSettings } from '@/lib/chat-config';
import { settingsToChatConfig } from '@/lib/chat-config';

interface ChatPreviewProps {
  settings: PlaygroundSettings;
}

export default function ChatPreview({ settings }: ChatPreviewProps) {
  const [token, setToken] = useState<string | undefined>(settings.token);
  const [roomJID, setRoomJID] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            workspaceId: settings.roomId,
            userData: {
              firstName: 'Playground',
              lastName: 'User',
              email: `${settings.userId}@example.com`,
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
                <li>Set ETHORA_CHAT_API_URL</li>
                <li>Set ETHORA_CHAT_APP_ID</li>
                <li>Set ETHORA_CHAT_APP_SECRET</li>
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

  const chatConfig = settingsToChatConfig(settings, token);

  // Use key to force re-render when config changes significantly
  const configKey = JSON.stringify({
    roomJID,
    colors: settings.primaryColor + settings.secondaryColor,
    baseUrl: settings.baseUrl,
    newArch: settings.newArch,
  });

  return (
    <div className="h-full bg-white dark:bg-gray-900">
      <XmppProvider>
        {/* @ts-ignore - Chat component types may not be fully exported */}
        <Chat key={configKey} roomJID={roomJID} config={chatConfig} />
      </XmppProvider>
    </div>
  );
}


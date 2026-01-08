'use client';

import React, { useState, useMemo, useEffect } from 'react';
import SettingsPanel from '@/components/SettingsPanel';
import ChatPreview from '@/components/ChatPreview';
import CodeBlock from '@/components/CodeBlock';
import SDKTestingPanel from '@/components/SDKTestingPanel';
import { defaultSettings, type PlaygroundSettings } from '@/lib/chat-config';
import { generateCodeSnippet } from '@/lib/code-generator';

type Tab = 'chat' | 'sdk';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [settings, setSettings] = useState<PlaygroundSettings>(defaultSettings);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [showCodeBlock, setShowCodeBlock] = useState(false);
  const [roomJID, setRoomJID] = useState<string | undefined>();

  // Update settings when they change
  const handleSettingsChange = (updates: Partial<PlaygroundSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  // Handle setup button click
  const handleSetup = async () => {
    setIsSettingUp(true);
    setSetupError(null);

    try {
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
      
      // Update settings with token and store roomJID
      setSettings((prev) => ({
        ...prev,
        token: data.token,
      }));
      setRoomJID(data.roomJID);
    } catch (err) {
      setSetupError(
        err instanceof Error ? err.message : 'Failed to setup chat'
      );
    } finally {
      setIsSettingUp(false);
    }
  };

  // Generate code snippet
  const codeSnippet = useMemo(() => {
    return generateCodeSnippet({
      settings,
      token: settings.token,
      roomJID: roomJID,
      includeBackend: true,
    });
  }, [settings, roomJID]);

  // Handle SDK method execution
  const handleSDKExecute = async (method: string, params: any) => {
    const response = await fetch('/api/sdk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ method, params }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to execute SDK method');
    }

    const data = await response.json();
    return data.result;
  };

  // Show error banner if setup fails
  useEffect(() => {
    if (setupError) {
      const timer = setTimeout(() => setSetupError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [setupError]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 lg:px-6 py-3 lg:py-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
              Ethora SDK Playground
            </h1>
            <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
              Configure and test your Ethora chat integration
            </p>
          </div>
          {activeTab === 'chat' && (
            <button
              onClick={() => setShowCodeBlock(!showCodeBlock)}
              className="w-full sm:w-auto px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium transition-colors shadow-sm"
            >
              {showCodeBlock ? 'Hide' : 'Show'} Code
            </button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'chat'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Chat Playground
          </button>
          <button
            onClick={() => setActiveTab('sdk')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'sdk'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            SDK Testing
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {setupError && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-6 py-3">
          <div className="flex items-center justify-between">
            <p className="text-red-800 dark:text-red-200 text-sm">
              <strong>Error:</strong> {setupError}
            </p>
            <button
              onClick={() => setSetupError(null)}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {activeTab === 'chat' ? (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Settings Panel */}
          <aside className="w-full lg:w-96 border-r border-gray-200 dark:border-gray-800 overflow-hidden flex-shrink-0 h-1/2 lg:h-auto">
            <SettingsPanel
              settings={settings}
              onSettingsChange={handleSettingsChange}
              onSetup={handleSetup}
              isSettingUp={isSettingUp}
            />
          </aside>

          {/* Chat Preview */}
          <main className="flex-1 overflow-hidden flex flex-col min-w-0">
            <div className="flex-1 overflow-hidden relative">
              <ChatPreview settings={settings} />
            </div>

            {/* Code Block */}
            {showCodeBlock && (
              <div className="border-t border-gray-200 dark:border-gray-800 p-4 lg:p-6 bg-gray-50 dark:bg-gray-900 max-h-96 overflow-y-auto">
                <CodeBlock code={codeSnippet} language="typescript" />
              </div>
            )}
          </main>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <SDKTestingPanel onExecute={handleSDKExecute} />
        </div>
      )}
    </div>
  );
}


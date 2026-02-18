'use client';

import React, { useMemo, useState } from 'react';

interface AutoTestPanelProps {
  onExecute: (method: string, params: any, files?: File[]) => Promise<any>;
}

type AutoTestStatus = 'pending' | 'success' | 'error';

interface AutoTestResult {
  id: string;
  label: string;
  method: string;
  params: any;
  status: AutoTestStatus;
  responseTime?: number;
  response?: any;
  error?: string | any;
}

export default function AutoTestPanel({ onExecute }: AutoTestPanelProps) {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<AutoTestResult[]>([]);

  const runId = useMemo(() => `run-${Date.now()}`, []);

  const runAutoTest = async () => {
    if (running) return;
    setRunning(true);
    setResults([]);

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).slice(2, 8);
    const userId = `auto-user-${timestamp}-${randomId}`;
    const chatId = `auto-room-${timestamp}-${randomId}`;
    const email = `auto-${timestamp}@example.com`;

    let appIdPrefix: string | undefined;

    const steps: Array<{
      id: string;
      label: string;
      method: string;
      buildParams: () => any | Promise<any>;
    }> = [
      {
        id: 'create-user',
        label: 'create user',
        method: 'createUser',
        buildParams: () => ({
          userId,
          userData: {
            email,
            firstName: 'Auto',
            lastName: 'Tester',
            password: 'Qwerty123',
            displayName: 'Auto Tester',
          },
        }),
      },
      {
        id: 'create-room',
        label: 'create room',
        method: 'createChatRoom',
        buildParams: () => ({
          chatId,
          roomData: {
            title: `Auto Room ${timestamp}`,
            uuid: chatId,
            type: 'group',
          },
        }),
      },
      {
        id: 'add-user',
        label: 'add user',
        method: 'grantUserAccessToChatRoom',
        buildParams: () => ({
          chatId,
          userId,
        }),
      },
      {
        id: 'remove-user',
        label: 'remove user',
        method: 'removeUserAccessFromChatRoom',
        buildParams: () => ({
          chatId,
          userId,
        }),
      },
      {
        id: 'delete-room',
        label: 'delete room',
        method: 'deleteChatRoom',
        buildParams: () => ({
          chatId,
        }),
      },
      {
        id: 'get-user',
        label: 'get user',
        method: 'getUsers',
        buildParams: async () => {
          if (!appIdPrefix) {
            const shortNameResult = await onExecute('createChatName', {
              chatId,
              full: false,
            });
            const resolved =
              shortNameResult?.result?.chatName ??
              shortNameResult?.chatName ??
              shortNameResult?.result ??
              shortNameResult;
            if (typeof resolved === 'string' && resolved.endsWith(`_${chatId}`)) {
              appIdPrefix = resolved.slice(0, -(chatId.length + 1));
            }
          }
          const xmppUsername = appIdPrefix ? `${appIdPrefix}_${userId}` : userId;
          return { xmppUsername };
        },
      },
      {
        id: 'get-users',
        label: 'get users',
        method: 'getUsers',
        buildParams: () => ({}),
      },
      {
        id: 'delete-user',
        label: 'delete user',
        method: 'deleteUsers',
        buildParams: () => ({
          userIds: [userId],
        }),
      },
    ];

    for (const step of steps) {
      const params = await step.buildParams();
      const startTime = Date.now();
      const baseResult: AutoTestResult = {
        id: `${runId}-${step.id}`,
        label: step.label,
        method: step.method,
        params,
        status: 'pending',
      };

      setResults((prev) => [...prev, baseResult]);

      try {
        const executeResult = await onExecute(step.method, params);
        const response = executeResult?.result !== undefined ? executeResult.result : executeResult;
        const responseTime = Date.now() - startTime;

        setResults((prev) =>
          prev.map((item) =>
            item.id === baseResult.id
              ? {
                  ...item,
                  status: 'success',
                  responseTime,
                  response: response !== undefined ? response : null,
                }
              : item
          )
        );
      } catch (err) {
        const responseTime = Date.now() - startTime;
        let errorMessage = 'Unknown error';
        
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        } else if (err && typeof err === 'object') {
          errorMessage = (err as any).error || (err as any).message || JSON.stringify(err);
        }

        setResults((prev) =>
          prev.map((item) =>
            item.id === baseResult.id
              ? {
                  ...item,
                  status: 'error',
                  responseTime,
                  error: errorMessage,
                }
              : item
          )
        );
      }
    }

    setRunning(false);
  };

  return (
    <div className="h-full overflow-y-auto px-4 lg:px-6 pb-4 lg:pb-6 bg-white dark:bg-gray-900">
      <div className="mb-6 sticky top-0 bg-white dark:bg-gray-900 pt-4 lg:pt-6 pb-4 border-b border-gray-200 dark:border-gray-800 z-10">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Auto Test
            </h2>
            <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
              Run a full SDK flow using @ethora/sdk-backend
            </p>
          </div>
          <button
            onClick={runAutoTest}
            disabled={running}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md transition-colors"
          >
            {running ? 'Running...' : 'Run Auto Test'}
          </button>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Flow: create user → create room → add user → remove user → delete room → get user → get users → delete user
        </div>
      </div>

      {results.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Click “Run Auto Test” to execute the full flow.
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((result) => (
            <div
              key={result.id}
              className="border border-gray-200 dark:border-gray-800 rounded-lg p-3 bg-gray-50 dark:bg-gray-800"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  {result.label} -{' '}
                  {result.status === 'success'
                    ? 'success'
                    : result.status === 'error'
                    ? 'error'
                    : 'pending'}
                </div>
                {result.responseTime !== undefined && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {result.responseTime}ms
                  </div>
                )}
              </div>

              <details className="mt-2">
                <summary className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer">
                  Expand
                </summary>
                <div className="mt-2 grid gap-2">
                  <div>
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                      Request
                    </div>
                    <pre className="text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 overflow-x-auto whitespace-pre-wrap break-words">
                      {JSON.stringify({ method: result.method, params: result.params }, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                      Response
                    </div>
                    {result.status === 'error' ? (
                      <div className="text-xs bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded p-2 text-red-700 dark:text-red-400 font-mono">
                        {typeof result.error === 'string' ? result.error : JSON.stringify(result.error, null, 2)}
                      </div>
                    ) : (
                      <pre className="text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 overflow-x-auto whitespace-pre-wrap break-words">
                        {JSON.stringify(result.response, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ResponseLogger, { type LogEntry } from './ResponseLogger';
import { normalizeApiError, parseResponsePayload } from '@/lib/api-error';

interface HTTPMethod {
  id: string;
  name: string;
  path: string;
  method: string;
  description: string;
  params: { key: string; label: string; type: string; required: boolean; defaultValue?: string; placeholder?: string }[];
}

const HTTP_METHODS: HTTPMethod[] = [
  {
    id: 'createUser',
    name: 'Create User (v2)',
    path: '/v2/users/batch',
    method: 'POST',
    description: 'Create a new user in the chat service.',
    params: [
      { key: 'uuid', label: 'User ID (UUID)', type: 'text', required: true, defaultValue: 'user-' + Math.random().toString(36).substring(7) },
      { key: 'email', label: 'Email', type: 'text', required: true, defaultValue: 'john.doe@example.com' },
      { key: 'firstName', label: 'First Name', type: 'text', required: true, defaultValue: 'John' },
      { key: 'lastName', label: 'Last Name', type: 'text', required: true, defaultValue: 'Doe' },
      { key: 'password', label: 'Password', type: 'text', required: false, defaultValue: 'password123' },
    ],
  },
  {
    id: 'createChatRoom',
    name: 'Create Chat Room (v2)',
    path: '/v2/chats',
    method: 'POST',
    description: 'Create a new chat room.',
    params: [
      { key: 'uuid', label: 'Chat ID (UUID)', type: 'text', required: true, defaultValue: 'room-' + Math.random().toString(36).substring(7) },
      { key: 'title', label: 'Room Title', type: 'text', required: true, defaultValue: 'Internal Discussion' },
      { key: 'type', label: 'Type', type: 'select', required: false, defaultValue: 'group' },
    ],
  },
  {
    id: 'grantAccess',
    name: 'Grant Access (v2)',
    path: '/v2/chats/users-access',
    method: 'POST',
    description: 'Grant user(s) access to a chat room.',
    params: [
      { key: 'chatName', label: 'Chat Name (appId_chatId)', type: 'text', required: true, placeholder: '698653aafcc..._myroom' },
      { key: 'members', label: 'Members (Array of IDs, comma separated)', type: 'text', required: true, placeholder: 'id1,id2', defaultValue: 'user-1,user-2' },
    ],
  },
  {
    id: 'revokeAccess',
    name: 'Revoke Access (v2)',
    path: '/v2/chats/users-access',
    method: 'DELETE',
    description: 'Remove user(s) access from a chat room.',
    params: [
      { key: 'chatName', label: 'Chat Name (appId_chatId)', type: 'text', required: true, placeholder: '698653aafcc..._myroom' },
      { key: 'members', label: 'Members (Array of IDs, comma separated)', type: 'text', required: true, placeholder: 'id1,id2', defaultValue: 'user-1' },
    ],
  },
  {
    id: 'updateUsers',
    name: 'Update Users (v2)',
    path: '/v2/chats/users',
    method: 'PATCH',
    description: 'Update multiple users.',
    params: [
      { key: 'usersJson', label: 'Users JSON Array', type: 'textarea', required: true, defaultValue: '[\n  {\n    "xmppUsername": "698653aafcc..._user-1",\n    "firstName": "John Updated",\n    "tags": ["beta-tester", "premium"]\n  }\n]' },
    ],
  },
  {
    id: 'getUsers',
    name: 'Get Users (v2)',
    path: '/v2/chats/users',
    method: 'GET',
    description: 'Fetch users with optional filters.',
    params: [
      { key: 'chatName', label: 'Chat Name Filter', type: 'text', required: false },
      { key: 'xmppUsername', label: 'XMPP Username Filter', type: 'text', required: false },
    ],
  },
  {
    id: 'deleteUsers',
    name: 'Delete Users (v1)',
    path: '/v1/users/batch',
    method: 'DELETE',
    description: 'Delete users from the service.',
    params: [
      { key: 'usersIdList', label: 'User IDs (comma separated)', type: 'text', required: true, defaultValue: 'user-1,user-2' },
    ],
  },
  {
    id: 'deleteChatRoom',
    name: 'Delete Chat Room (v1)',
    path: '/v1/chats',
    method: 'DELETE',
    description: 'Delete a chat room.',
    params: [
      { key: 'name', label: 'Chat Name (appId_chatId)', type: 'text', required: true, placeholder: '698653aafcc..._room-1' },
    ],
  },
  {
    id: 'updateChatMeta',
    name: 'Update Chat Metadata (v1)',
    path: '/v1/chats/meta',
    method: 'PATCH',
    description: 'Change the data of the chat. This method uses x-custom-token generation.',
    params: [
      { key: 'chatJid', label: 'Chat JID', type: 'text', required: false },
      { key: 'title', label: 'Title', type: 'text', required: false },
      { key: 'description', label: 'Description', type: 'text', required: false },
      { key: 'metaJson', label: 'Additional Metadata JSON', type: 'textarea', required: false, defaultValue: '{}' },
    ],
  },
  {
    id: 'updateChatRoom',
    name: 'Update Chat Room (v2)',
    path: '/v2/apps/{appId}/chats/{chatId}',
    method: 'PATCH',
    description: 'Update metadata for a chat room.',
    params: [
      { key: 'chatId', label: 'Chat ID', type: 'text', required: true, defaultValue: 'test-room-1' },
      { key: 'title', label: 'Room Title', type: 'text', required: false, defaultValue: 'Updated Team Chat' },
      { key: 'description', label: 'Description', type: 'text', required: false, defaultValue: 'Revised description' },
    ],
  },
  {
    id: 'getUserChats',
    name: 'Get User Chats (v2)',
    path: '/v2/apps/{appId}/users/{userId}/chats',
    method: 'GET',
    description: 'Get all chats for a user.',
    params: [
      { key: 'userId', label: 'User ID', type: 'text', required: true, defaultValue: 'user-1' },
      { key: 'limit', label: 'Limit', type: 'number', required: false, defaultValue: '50' },
      { key: 'offset', label: 'Offset', type: 'number', required: false, defaultValue: '0' },
    ],
  },
  {
    id: 'listChatsInApp',
    name: 'List Chats In App (v2)',
    path: '/v2/apps/{appId}/chats',
    method: 'GET',
    description: 'List chats in an app scope.',
    params: [
      { key: 'limit', label: 'Limit', type: 'number', required: false, defaultValue: '50' },
      { key: 'offset', label: 'Offset', type: 'number', required: false, defaultValue: '0' },
      { key: 'includeMembers', label: 'Include Members', type: 'text', required: false, defaultValue: 'true' },
    ],
  },
  {
    id: 'getUsersBatchJob',
    name: 'Get Users Batch Job (v2)',
    path: '/v2/apps/{appId}/users/batch/{jobId}',
    method: 'GET',
    description: 'Get users batch job status/result.',
    params: [
      { key: 'jobId', label: 'Job ID', type: 'text', required: true, defaultValue: 'job-id' },
    ],
  },
  {
    id: 'getAppUserByXmppUsername',
    name: 'Get App User By XMPP Username (v1)',
    path: '/v1/apps/users/{xmppUsername}',
    method: 'GET',
    description: 'Legacy app user lookup by xmpp username.',
    params: [
      { key: 'xmppUsername', label: 'XMPP Username', type: 'text', required: true, defaultValue: 'user-1' },
    ],
  },
  {
    id: 'createAppToken',
    name: 'Create App Token (v2)',
    path: '/v2/apps/{appId}/tokens',
    method: 'POST',
    description: 'Create app token for app-scoped integration.',
    params: [
      { key: 'label', label: 'Label', type: 'text', required: false, defaultValue: 'playground-token' },
    ],
  },
];

export default function HTTPTestingPanel() {
  const buildMethodDefaults = (method: HTTPMethod): Record<string, any> =>
    method.params.reduce((acc, param) => {
      if (param.defaultValue !== undefined) {
        acc[param.key] = param.defaultValue;
      }
      return acc;
    }, {} as Record<string, any>);

  const [selectedMethodId, setSelectedMethodId] = useState(HTTP_METHODS[0].id);
  const [formData, setFormData] = useState<Record<string, any>>(() => buildMethodDefaults(HTTP_METHODS[0]));
  const [customUrl, setCustomUrl] = useState<string>('');
  const [useCustomUrl, setUseCustomUrl] = useState<boolean>(false);
  const [appId, setAppId] = useState<string>(process.env.NEXT_PUBLIC_ETHORA_CHAT_APP_ID || '');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<any>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [isRawMode, setIsRawMode] = useState(false);
  const [rawJson, setRawJson] = useState('');

  const currentMethod = HTTP_METHODS.find(m => m.id === selectedMethodId)!;

  const getPayload = useCallback(() => {
    if (currentMethod.method === 'GET') return null;
    
    // Helper to get value from form or fallback to method default
    const getValue = (key: string) => {
      if (formData[key] !== undefined && formData[key] !== '') return formData[key];
      const param = currentMethod.params.find(p => p.key === key);
      return param?.defaultValue || '';
    };

    let payload: any = {};
    switch (currentMethod.id) {
      case 'createUser':
        payload = {
          bypassEmailConfirmation: true,
          usersList: [{
            uuid: getValue('uuid') || 'mock-uuid',
            email: getValue('email') || 'mock@example.com',
            firstName: getValue('firstName'),
            lastName: getValue('lastName'),
            password: getValue('password') || `password_${getValue('uuid')}`,
          }]
        };
        break;
      case 'createChatRoom':
        payload = {
          title: getValue('title'),
          uuid: getValue('uuid'),
          type: getValue('type') || 'group',
        };
        break;
      case 'grantAccess':
      case 'revokeAccess':
        payload = {
          chatName: getValue('chatName'),
          members: String(getValue('members') || '').split(',').map(m => m.trim()).filter(Boolean),
        };
        break;
      case 'updateUsers':
        try {
          payload = { users: JSON.parse(getValue('usersJson') || '[]') };
        } catch {
          payload = { error: 'Invalid JSON' };
        }
        break;
      case 'deleteUsers':
        payload = {
          usersIdList: String(getValue('usersIdList') || '').split(',').map(m => m.trim()).filter(Boolean),
        };
        break;
      case 'deleteChatRoom':
        payload = {
          name: getValue('name'),
        };
        break;
      case 'updateChatMeta':
        try {
          const metaJsonStr = getValue('metaJson') || '{}';
          const metaData = JSON.parse(metaJsonStr);
          
          // Merge specific fields into metadata
          const title = getValue('title');
          const description = getValue('description');
          const chatJid = getValue('chatJid');
          
          if (title) metaData.title = title;
          if (description) metaData.description = description;
          if (chatJid) metaData.chatJid = chatJid;

          payload = { 
            name: getValue('name'),
            data: metaData
          };
        } catch {
          payload = { error: 'Invalid JSON in Metadata' };
        }
        break;
      case 'updateChatRoom':
        payload = {
          title: getValue('title'),
          description: getValue('description'),
        };
        break;
      case 'createAppToken':
        payload = {
          ...(getValue('label') ? { label: getValue('label') } : {}),
        };
        break;
      case 'getUserChats':
      case 'listChatsInApp':
      case 'getUsersBatchJob':
      case 'getAppUserByXmppUsername':
        payload = null;
        break;
      default:
        // For any unknown methods, merge all defaults
        currentMethod.params.forEach(p => {
          payload[p.key] = getValue(p.key);
        });
        Object.assign(payload, formData);
    }
    return payload;
  }, [currentMethod, formData]);

  const getFullUrl = useCallback(() => {
    if (useCustomUrl && customUrl) return customUrl;
    
    let path = currentMethod.path;
    const currentAppId = appId || 'APP_ID';

    // Replace placeholders
    path = path.replace('{appId}', currentAppId);
    
    // Replace other parameters in path
    currentMethod.params.forEach(p => {
      if (path.includes(`{${p.key}}`)) {
        const val = formData[p.key] !== undefined ? formData[p.key] : p.defaultValue;
        path = path.replace(`{${p.key}}`, val || `{${p.key}}`);
      }
    });

    const base = (process.env.NEXT_PUBLIC_ETHORA_CHAT_API_URL || 'https://api.chat.ethora.com').replace(/\/$/, '');
    return `${base}${path}`;
  }, [currentMethod, formData, appId, useCustomUrl, customUrl]);

  useEffect(() => {
      const payload = getPayload();
      if (payload) {
        setRawJson(JSON.stringify(payload, null, 2));
      } else {
        setRawJson('');
    }
  }, [formData, selectedMethodId, isRawMode, getPayload]);

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setResponseTime(null);
    const startTime = Date.now();
    let url = getFullUrl();
    
    let options: RequestInit = {
      method: currentMethod.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (currentMethod.id === 'updateChatMeta') {
      try {
        const tokenRes = await fetch('/api/token');
        if (tokenRes.ok) {
          const { token } = await tokenRes.json();
          if (token) {
            (options.headers as any)['x-custom-token'] = token;
          }
        }
      } catch (err) {
        console.error('Failed to fetch x-custom-token:', err);
      }
    }

    let finalPayload: any = null;
    if (currentMethod.method !== 'GET') {
      if (isRawMode) {
        try {
          finalPayload = JSON.parse(rawJson);
          options.body = rawJson;
        } catch (err: any) {
          setLoading(false);
          setResult({ error: 'Invalid raw JSON: ' + err.message });
          return;
        }
      } else {
        finalPayload = getPayload();
        options.body = JSON.stringify(finalPayload);
      }
    } else {
      const queryParams = new URLSearchParams();
      currentMethod.params.forEach((param) => {
        const value = formData[param.key] ?? param.defaultValue;
        if (value !== undefined && value !== null && value !== '' && !currentMethod.path.includes(`{${param.key}}`)) {
          queryParams.append(param.key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
      }
      options.body = null; // Ensure no body for GET
    }

    const requestLog: LogEntry = {
      id: `req-${Date.now()}`,
      timestamp: Date.now(),
      type: 'request',
      method: currentMethod.method,
      url,
      data: finalPayload || (formData || {}),
      headers: options.headers as any,
    };
    setLogs(prev => [requestLog, ...prev.slice(0, 49)]);

    try {
      const response = await fetch(url, options);
      const data = await parseResponsePayload(response);
      const endTime = Date.now();
      
      setResponseTime(endTime - startTime);

      if (!response.ok) {
        const normalized = normalizeApiError(
          {
            ...(typeof data === 'object' && data !== null ? data : { error: String(data) }),
            status: response.status,
            statusText: response.statusText,
            url,
            requestUrl: url,
          },
          `HTTP error: ${response.status}`
        );
        setResult(normalized);

        const errorLog: LogEntry = {
          id: `err-${Date.now()}`,
          timestamp: Date.now(),
          type: 'error',
          method: currentMethod.method,
          url,
          data: normalized,
          status: response.status,
        };
        setLogs(prev => [errorLog, ...prev.slice(0, 49)]);
        return;
      }

      setResult(data);

      const responseLog: LogEntry = {
        id: `res-${Date.now()}`,
        timestamp: Date.now(),
        type: 'response',
        method: currentMethod.method,
        url,
        data,
        status: response.status,
      };
      setLogs(prev => [responseLog, ...prev.slice(0, 49)]);
    } catch (error: any) {
      console.error('HTTP Error:', error);
      const normalized = normalizeApiError(error, 'Failed to execute HTTP request');
      setResult(normalized);
      const errorLog: LogEntry = {
        id: `err-${Date.now()}`,
        timestamp: Date.now(),
        type: 'error',
        method: currentMethod.method,
        url,
        data: normalized,
        status: normalized.status,
      };
      setLogs(prev => [errorLog, ...prev.slice(0, 49)]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-black overflow-hidden lg:flex-row">
      <div className="w-full lg:w-1/2 p-6 overflow-y-auto border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-xl mx-auto">
          <header className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Direct HTTP Testing
              </h2>
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg shadow-inner">
                <button
                  onClick={() => setIsRawMode(false)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${!isRawMode ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}
                >
                  Form
                </button>
                <button
                  onClick={() => setIsRawMode(true)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${isRawMode ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}
                >
                  Raw JSON
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-semibold px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded">API:</span>
              <span className="font-mono truncate">{(process.env.NEXT_PUBLIC_ETHORA_CHAT_API_URL || 'https://api.chat.ethora.com')}</span>
            </div>
          </header>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Endpoint
            </label>
            <select
              value={selectedMethodId}
              onChange={(e) => {
                setSelectedMethodId(e.target.value);
                const nextMethod = HTTP_METHODS.find((m) => m.id === e.target.value);
                setFormData(nextMethod ? buildMethodDefaults(nextMethod) : {});
                setResult(null);
              }}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none shadow-sm"
            >
              {HTTP_METHODS.map(m => (
                <option key={m.id} value={m.id}>{m.name} - {m.method} {m.path}</option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                currentMethod.method === 'POST' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 
                currentMethod.method === 'DELETE' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                currentMethod.method === 'PATCH' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
                'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
              }`}>
                {currentMethod.method}
              </span>
              <code className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                {currentMethod.path}
              </code>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {currentMethod.description}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRawMode ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Request JSON
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(rawJson);
                    }}
                    className="text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium uppercase tracking-tighter"
                  >
                    Copy JSON
                  </button>
                </div>
                <textarea
                  value={rawJson}
                  onChange={(e) => setRawJson(e.target.value)}
                  rows={currentMethod.method === 'GET' ? 2 : 12}
                  disabled={currentMethod.method === 'GET'}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-green-400 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-mono text-xs shadow-inner"
                  placeholder={currentMethod.method === 'GET' ? 'No body for GET requests' : 'Enter raw JSON payload...'}
                />
              </div>
            ) : (
              currentMethod.params.map(param => (
                <div key={param.key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {param.label} {param.required && <span className="text-red-500">*</span>}
                  </label>
                  {param.type === 'select' ? (
                    <select
                      value={formData[param.key] ?? param.defaultValue ?? ''}
                      onChange={(e) => handleInputChange(param.key, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    >
                      <option value="group">Group</option>
                      <option value="public">Public</option>
                    </select>
                  ) : param.type === 'textarea' ? (
                    <textarea
                      value={formData[param.key] ?? ''}
                      onChange={(e) => handleInputChange(param.key, e.target.value)}
                      placeholder={param.placeholder || `Enter ${param.label.toLowerCase()}`}
                      required={param.required}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none font-mono text-xs"
                    />
                  ) : (
                    <input
                      type={param.type}
                      value={formData[param.key] ?? ''}
                      onChange={(e) => handleInputChange(param.key, e.target.value)}
                      placeholder={param.placeholder || (param.defaultValue ? `Default: ${param.defaultValue}` : `Enter ${param.label.toLowerCase()}`)}
                      required={param.required}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    />
                  )}
                </div>
              ))
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  Execute HTTP Request
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {result && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Last Result</h3>
                {responseTime && (
                  <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                    {responseTime}ms
                  </span>
                )}
              </div>
              {(result.url || result.requestUrl) && (
                <div className="mb-2 p-1.5 bg-blue-50 dark:bg-blue-900/10 rounded border border-blue-100 dark:border-blue-900/20 text-[10px] font-mono break-all text-blue-700 dark:text-blue-400 uppercase">
                  <span className="font-bold mr-1">URL:</span> {result.url || result.requestUrl}
                </div>
              )}
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto border border-gray-800 max-h-64 overflow-y-auto">
                <pre className="text-xs font-mono text-green-400">
                  {JSON.stringify(result.result || result.responseData || result, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950 border-t lg:border-t-0 border-gray-200 dark:border-gray-800">
        <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">HTTP Activity Logs</h3>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          <ResponseLogger logs={logs} onClear={() => setLogs([])} />
        </div>
      </div>
    </div>
  );
}

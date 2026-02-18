'use client';

import React, { useState } from 'react';
import ResponseLogger, { type LogEntry } from './ResponseLogger';

interface HTTPMethod {
  id: string;
  name: string;
  path: string;
  method: string;
  description: string;
  params: { key: string; label: string; type: string; required: boolean; defaultValue?: string }[];
}

const HTTP_METHODS: HTTPMethod[] = [
  {
    id: 'createChatRoom',
    name: 'Create Chat Room (v1)',
    path: '/v1/chats',
    method: 'POST',
    description: 'Create a new chat room using direct HTTP POST request.',
    params: [
      { key: 'id', label: 'Chat ID (UUID)', type: 'text', required: true },
      { key: 'name', label: 'Room Name (Title)', type: 'text', required: true },
      { key: 'type', label: 'Type', type: 'select', required: false, defaultValue: 'group' },
    ],
  },
  {
    id: 'getUsers',
    name: 'Get Users (v1)',
    path: '/v1/chats/users',
    method: 'GET',
    description: 'Fetch users using direct HTTP GET request.',
    params: [
      { key: 'limit', label: 'Limit', type: 'number', required: false, defaultValue: '100' },
      { key: 'offset', label: 'Offset', type: 'number', required: false, defaultValue: '0' },
    ],
  },
];

export default function HTTPTestingPanel() {
  const [selectedMethodId, setSelectedMethodId] = useState(HTTP_METHODS[0].id);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<any>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const currentMethod = HTTP_METHODS.find(m => m.id === selectedMethodId)!;

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setResponseTime(null);
    const startTime = Date.now();

    const baseUrl = (process.env.NEXT_PUBLIC_ETHORA_CHAT_API_URL || 'https://api.ethoradev.com').replace(/\/$/, '');
    let url = `${baseUrl}${currentMethod.path}`;
    
    let options: RequestInit = {
      method: currentMethod.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (currentMethod.method === 'POST') {
      const payload: any = {};
      if (currentMethod.id === 'createChatRoom') {
        payload.title = formData.name || '';
        payload.uuid = formData.id || '';
        payload.type = formData.type || 'group';
      } else {
        Object.assign(payload, formData);
      }
      options.body = JSON.stringify(payload);
    } else {
      const queryParams = new URLSearchParams();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    // Log request
    const requestLog: LogEntry = {
      id: `req-${Date.now()}`,
      timestamp: Date.now(),
      type: 'request',
      method: currentMethod.method,
      url,
      data: options.body ? JSON.parse(options.body as string) : (formData || {}),
      headers: options.headers as any,
    };
    setLogs(prev => [requestLog, ...prev.slice(0, 49)]);

    try {
      const response = await fetch(url, options);
      const data = await response.json().catch(() => ({ error: 'Failed to parse JSON response' }));
      const endTime = Date.now();
      
      setResponseTime(endTime - startTime);
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
      const errorLog: LogEntry = {
        id: `err-${Date.now()}`,
        timestamp: Date.now(),
        type: 'error',
        method: currentMethod.method,
        url,
        data: { error: error.message },
      };
      setLogs(prev => [errorLog, ...prev.slice(0, 49)]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-black overflow-hidden lg:flex-row">
      {/* Left: Form */}
      <div className="w-full lg:w-1/2 p-6 overflow-y-auto border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-xl mx-auto">
          <header className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Direct HTTP Testing
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Test the API using "raw" fetch requests. Bypasses the SDK package.
            </p>
          </header>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Endpoint
            </label>
            <select
              value={selectedMethodId}
              onChange={(e) => setSelectedMethodId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            >
              {HTTP_METHODS.map(m => (
                <option key={m.id} value={m.id}>{m.name} - {m.method} {m.path}</option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                currentMethod.method === 'POST' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
              }`}>
                {currentMethod.method}
              </span>
              <code className="text-xs font-mono text-gray-700 dark:text-gray-300">
                {currentMethod.path}
              </code>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {currentMethod.description}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {currentMethod.params.map(param => (
              <div key={param.key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {param.label} {param.required && <span className="text-red-500">*</span>}
                </label>
                {param.type === 'select' ? (
                  <select
                    value={formData[param.key] || param.defaultValue || ''}
                    onChange={(e) => handleInputChange(param.key, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  >
                    <option value="group">Group</option>
                    <option value="public">Public</option>
                  </select>
                ) : (
                  <input
                    type={param.type}
                    value={formData[param.key] || ''}
                    onChange={(e) => handleInputChange(param.key, e.target.value)}
                    placeholder={param.defaultValue ? `Default: ${param.defaultValue}` : `Enter ${param.label.toLowerCase()}`}
                    required={param.required}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  />
                )}
              </div>
            ))}

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
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto border border-gray-800 max-h-48 overflow-y-auto">
                <pre className="text-xs font-mono text-green-400">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Logs */}
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

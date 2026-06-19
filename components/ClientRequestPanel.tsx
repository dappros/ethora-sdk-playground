'use client';

import React, { useState } from 'react';
import ResponseLogger, { type LogEntry } from './ResponseLogger';
import { normalizeApiError, parseResponsePayload } from '@/lib/api-error';

export default function ClientRequestPanel() {
  const [userId, setUserId] = useState('user-' + Math.random().toString(36).substring(7));
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<any>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const generateToken = async () => {
    if (!userId) {
      alert('Please enter a User ID first');
      return;
    }
    
    setGenerating(true);
    try {
      const response = await fetch('/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      const data = await response.json();
      if (data.token) {
        setToken(data.token);
      } else if (data.error) {
        alert('Error generating token: ' + data.error);
      }
    } catch (err) {
      console.error('Failed to generate token:', err);
      alert('Failed to generate token');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setResponseTime(null);
    
    const startTime = Date.now();
    const url = 'https://api.chat.ethora.com/v1/users/client';
    
    const options: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-custom-token': token,
      },
      // The user didn't specify a body, but it's a POST request. 
      // Usually v1/users/client might expect some body or just headers.
      // I'll leave it empty for now or maybe it expects userId in body too.
      body: JSON.stringify({}),
    };

    const requestLog: LogEntry = {
      id: `req-${Date.now()}`,
      timestamp: Date.now(),
      type: 'request',
      method: 'POST',
      url,
      data: { headers: { 'x-custom-token': token ? (token.substring(0, 10) + '...') : 'none' } },
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
          },
          `HTTP error: ${response.status}`
        );
        setResult(normalized);

        const errorLog: LogEntry = {
          id: `err-${Date.now()}`,
          timestamp: Date.now(),
          type: 'error',
          method: 'POST',
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
        method: 'POST',
        url,
        data,
        status: response.status,
      };
      setLogs(prev => [responseLog, ...prev.slice(0, 49)]);
    } catch (error: any) {
      console.error('HTTP Error:', error);
      const normalized = normalizeApiError(error, 'Failed to execute HTTP request. This might be a CORS issue if calling directly from browser.');
      setResult(normalized);
      const errorLog: LogEntry = {
        id: `err-${Date.now()}`,
        timestamp: Date.now(),
        type: 'error',
        method: 'POST',
        url,
        data: normalized,
        status: 0,
      };
      setLogs(prev => [errorLog, ...prev.slice(0, 49)]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-black overflow-hidden lg:flex-row">
      <div className="w-full lg:w-1/2 p-6 lg:p-10 overflow-y-auto border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 backdrop-blur-xl">
        <div className="max-w-xl mx-auto">
          <header className="mb-10">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-widest uppercase mb-4 border border-blue-100 dark:border-blue-800">
              New Feature
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
              <span className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              Client Token Test
            </h2>
            <p className="mt-4 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              Test the <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400 font-mono text-sm">/v1/users/client</code> endpoint with a secure client-scoped JWT.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="group">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 transition-colors group-focus-within:text-blue-600">
                  User Identifier
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="e.g. user-123"
                    className="w-full px-5 py-3.5 border border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none shadow-sm"
                  />
                </div>
              </div>

              <div className="group">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors group-focus-within:text-blue-600">
                    Authentication Token (x-custom-token)
                  </label>
                  <button
                    type="button"
                    onClick={generateToken}
                    disabled={generating}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    {generating ? (
                      <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                    Generate via SDK
                  </button>
                </div>
                <div className="relative">
                  <textarea
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    rows={5}
                    placeholder="Paste your client JWT or click 'Generate via SDK'..."
                    className="w-full px-5 py-4 border border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-mono text-xs shadow-sm resize-none"
                  />
                  {!token && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full py-4 px-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-2xl font-black shadow-2xl shadow-blue-500/25 transition-all flex items-center justify-center gap-3 group active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Dispatch Request</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {result && (
            <div className="mt-12 p-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="bg-white dark:bg-gray-900 rounded-[22px] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${result.error ? 'bg-red-500' : 'bg-green-500'} animate-pulse`} />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">
                      Response Payload
                    </h3>
                  </div>
                  {responseTime && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
                      <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-[10px] font-black text-gray-600 dark:text-gray-400 font-mono">
                        {responseTime}ms
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="relative group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative bg-gray-950 rounded-2xl p-5 border border-gray-800 shadow-inner overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 flex gap-2">
                      <button 
                        onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}
                        className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
                        title="Copy Response"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </button>
                    </div>
                    <pre className="text-xs font-mono text-green-400 leading-relaxed overflow-x-auto max-h-[400px]">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </div>
                
                {result.error && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 rounded-2xl flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="text-sm">
                      <p className="font-bold text-red-800 dark:text-red-300">Request Error</p>
                      <p className="text-red-700 dark:text-red-400 opacity-80 mt-1">
                        {result.status === 0 ? 'Possible CORS issue: Direct browser requests to external APIs are often blocked. Check console for details.' : result.message || 'Check your token and request parameters.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col overflow-hidden bg-gray-50 dark:bg-black/40 border-t lg:border-t-0 border-gray-200 dark:border-gray-800">
        <div className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">Activity Trace</h3>
            <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-wider">Audit log of all outbound requests</p>
          </div>
          <div className="flex gap-2">
            <div className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold rounded-md border border-green-500/20">
              Live
            </div>
          </div>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          <ResponseLogger logs={logs} onClear={() => setLogs([])} />
        </div>
      </div>
    </div>
  );
}

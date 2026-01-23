'use client';

import React, { useState } from 'react';

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'request' | 'response' | 'error';
  method?: string;
  data: any;
  responseTime?: number;
  headers?: Record<string, string>;
}

interface ResponseLoggerProps {
  logs: LogEntry[];
  onClear: () => void;
}

export default function ResponseLogger({ logs, onClear }: ResponseLoggerProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [expandedHeadersIds, setExpandedHeadersIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'request' | 'response' | 'error'>('all');

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const toggleHeadersExpand = (id: string) => {
    const newExpanded = new Set(expandedHeadersIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedHeadersIds(newExpanded);
  };

  const filteredLogs = logs.filter((log) => filter === 'all' || log.type === filter);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'request':
        return 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800';
      case 'response':
        return 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'request':
        return '→';
      case 'response':
        return '✓';
      case 'error':
        return '✗';
      default:
        return '•';
    }
  };

  if (logs.length === 0) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm">No logs yet</p>
          <p className="text-xs mt-1">Request and response logs will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All ({logs.length})
          </button>
          <button
            onClick={() => setFilter('request')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              filter === 'request'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Requests ({logs.filter((l) => l.type === 'request').length})
          </button>
          <button
            onClick={() => setFilter('response')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              filter === 'response'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Responses ({logs.filter((l) => l.type === 'response').length})
          </button>
          <button
            onClick={() => setFilter('error')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              filter === 'error'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Errors ({logs.filter((l) => l.type === 'error').length})
          </button>
        </div>
        <button
          onClick={onClear}
          className="px-3 py-1 text-xs bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 rounded-md transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Logs */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredLogs.map((log) => {
          const isExpanded = expandedIds.has(log.id);
          const dataStr = JSON.stringify(log.data, null, 2);

          return (
            <div
              key={log.id}
              className={`p-3 rounded-lg border ${getLogColor(log.type)}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{getLogIcon(log.type)}</span>
                    {log.method && (
                      <span className="text-xs font-mono bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                        {log.method}
                      </span>
                    )}
                    {log.responseTime && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {log.responseTime}ms
                      </span>
                    )}
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                  {log.headers && Object.keys(log.headers).length > 0 && (
                    <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-gray-700 dark:text-gray-300">Headers:</div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleHeadersExpand(log.id);
                          }}
                          className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
                        >
                          {expandedHeadersIds.has(log.id) ? 'Collapse' : 'Expand'}
                        </button>
                      </div>
                      <div className="space-y-1">
                        {Object.entries(log.headers).map(([key, value]) => {
                          const isExpanded = expandedHeadersIds.has(log.id);
                          const isLongValue = typeof value === 'string' && value.length > 80;
                          const displayValue = isExpanded || !isLongValue 
                            ? value 
                            : `${value.substring(0, 80)}...`;
                          
                          return (
                            <div key={key} className="font-mono break-words">
                              <span className="text-gray-600 dark:text-gray-400 font-semibold">{key}:</span>{' '}
                              <span className="text-gray-800 dark:text-gray-200">{displayValue}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {isExpanded ? (
                    <pre className="text-xs font-mono bg-gray-900 dark:bg-gray-950 text-gray-100 p-2 rounded mt-2 overflow-x-auto">
                      {dataStr}
                    </pre>
                  ) : (
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {dataStr.substring(0, 100)}
                      {dataStr.length > 100 ? '...' : ''}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => toggleExpand(log.id)}
                  className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
                >
                  {isExpanded ? 'Collapse' : 'Expand'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

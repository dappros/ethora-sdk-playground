'use client';

import React, { useState, useEffect } from 'react';
import {
  getRequestHistory,
  clearRequestHistory,
  removeRequestFromHistory,
  exportHistory,
  importHistory,
  getRequestStatistics,
  type RequestHistoryItem,
} from '@/lib/request-history';

interface RequestHistoryProps {
  onReplay: (item: RequestHistoryItem) => void;
}

export default function RequestHistory({ onReplay }: RequestHistoryProps) {
  const [history, setHistory] = useState<RequestHistoryItem[]>([]);
  const [stats, setStats] = useState(getRequestStatistics());
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  const loadHistory = () => {
    setHistory(getRequestHistory());
    setStats(getRequestStatistics());
  };

  useEffect(() => {
    loadHistory();
    // Reload history every 2 seconds to catch new requests
    const interval = setInterval(loadHistory, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all request history?')) {
      clearRequestHistory();
      loadHistory();
    }
  };

  const handleRemove = (id: string) => {
    removeRequestFromHistory(id);
    loadHistory();
  };

  const handleExport = () => {
    const json = exportHistory();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sdk-request-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const result = importHistory(importText);
    if (result.success) {
      alert(`Successfully imported ${result.count} request(s)`);
      setShowImport(false);
      setImportText('');
      loadHistory();
    } else {
      alert(`Import failed: ${result.error}`);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatResponseTime = (time?: number) => {
    if (!time) return 'N/A';
    return `${time}ms`;
  };

  if (history.length === 0) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm">No request history yet</p>
          <p className="text-xs mt-1">Your SDK requests will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total</div>
          <div className="text-lg font-bold text-blue-900 dark:text-blue-100">{stats.total}</div>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-xs text-green-600 dark:text-green-400 font-medium">Success</div>
          <div className="text-lg font-bold text-green-900 dark:text-green-100">{stats.successful}</div>
        </div>
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-xs text-red-600 dark:text-red-400 font-medium">Failed</div>
          <div className="text-lg font-bold text-red-900 dark:text-red-100">{stats.failed}</div>
        </div>
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">Avg Time</div>
          <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
            {stats.averageResponseTime}ms
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleExport}
          className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
        >
          Export JSON
        </button>
        <button
          onClick={() => setShowImport(!showImport)}
          className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
        >
          {showImport ? 'Cancel Import' : 'Import JSON'}
        </button>
        <button
          onClick={handleClear}
          className="px-3 py-1.5 text-xs bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 rounded-md transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Import Form */}
      {showImport && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Paste JSON to import:
          </label>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white text-sm font-mono"
            placeholder="Paste request history JSON here..."
          />
          <button
            onClick={handleImport}
            className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
          >
            Import
          </button>
        </div>
      )}

      {/* History List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {history.map((item) => (
          <div
            key={item.id}
            className={`p-3 rounded-lg border ${
              item.success
                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      item.success
                        ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                        : 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                    }`}
                  >
                    {item.method}
                  </span>
                  {item.responseTime && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatResponseTime(item.responseTime)}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {formatTime(item.timestamp)}
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {JSON.stringify(item.params).substring(0, 100)}
                  {JSON.stringify(item.params).length > 100 ? '...' : ''}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => onReplay(item)}
                  className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded transition-colors"
                  title="Replay this request"
                >
                  Replay
                </button>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 rounded transition-colors"
                  title="Remove from history"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

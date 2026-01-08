'use client';

import React, { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export default function CodeBlock({ code, language = 'typescript' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between bg-gray-800 px-3 lg:px-4 py-2 rounded-t-lg">
        <span className="text-xs text-gray-400 uppercase tracking-wide">
          Code Snippet ({language})
        </span>
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 text-xs font-medium text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors shadow-sm hover:shadow"
          title="Copy to clipboard"
        >
          {copied ? (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </span>
          )}
        </button>
      </div>
      <div className="rounded-b-lg overflow-hidden bg-gray-900 border border-gray-800">
        <pre className="p-3 lg:p-4 overflow-x-auto">
          <code className="text-xs lg:text-sm text-gray-100 font-mono whitespace-pre leading-relaxed">
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
}


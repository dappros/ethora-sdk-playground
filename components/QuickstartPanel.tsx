'use client';

import React from 'react';
import CodeBlock from '@/components/CodeBlock';
import { verticalTemplates, type VerticalTemplate } from '@/lib/vertical-templates';

interface QuickstartPanelProps {
  /** Called when a visitor picks a vertical — apply its settings and open the chat. */
  onSelectVertical: (template: VerticalTemplate) => void;
  /** Optional: provision a guest user + room and open a live chat (no signup). */
  onLaunchDemo?: () => void;
  /** True while the live demo is being provisioned. */
  isLaunching?: boolean;
}

const PLATFORM_LINKS: { label: string; href: string; note: string }[] = [
  {
    label: 'React (web)',
    href: 'https://www.npmjs.com/package/@ethora/chat-component',
    note: '@ethora/chat-component',
  },
  {
    label: 'React Native',
    href: 'https://www.npmjs.com/package/@ethora/chat-component-rn',
    note: '@ethora/chat-component-rn',
  },
  {
    label: 'iOS (Swift)',
    href: 'https://github.com/dappros/ethora-sdk-swift',
    note: 'XMPPChatCore + XMPPChatUI',
  },
  {
    label: 'Android (Kotlin)',
    href: 'https://github.com/dappros/ethora-sdk-android',
    note: 'com.ethora.chat',
  },
  {
    label: 'WordPress',
    href: 'https://wordpress.org/plugins/ethora-chat-assistant/',
    note: 'Ethora Chat Assistant',
  },
];

const INSTALL_SNIPPET = `# 1. Install the React chat component
npm install @ethora/chat-component

# 2. Drop it into your app
import { Chat, XmppProvider } from '@ethora/chat-component';

export default function App() {
  return (
    <XmppProvider>
      <Chat config={{ baseUrl: 'https://api.chat.ethora.com/v1' }} />
    </XmppProvider>
  );
}`;

export default function QuickstartPanel({
  onSelectVertical,
  onLaunchDemo,
  isLaunching = false,
}: QuickstartPanelProps) {
  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
        {/* Hero */}
        <section className="text-center mb-10">
          <span className="inline-block text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400 mb-3">
            No signup required
          </span>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Try Ethora chat in your browser
          </h2>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Pick an industry to load a ready-made chat, see it live, and copy the
            exact code to drop into your own app. Open-source frontend, self-hostable
            backend — runs from a free cloud prototype up to a HIPAA-ready, on-prem deployment.
          </p>

          {onLaunchDemo && (
            <div className="mt-6">
              <button
                onClick={onLaunchDemo}
                disabled={isLaunching}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-md text-sm font-semibold transition-colors shadow-sm"
              >
                {isLaunching ? 'Starting live demo…' : 'Launch live demo chat'}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Provisions a temporary guest user and room — nothing to sign up for.
              </p>
            </div>
          )}
        </section>

        {/* Vertical templates */}
        <section className="mb-12">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">
            Start from your use case
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {verticalTemplates.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => onSelectVertical(tpl)}
                className="text-left bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl leading-none" aria-hidden>
                    {tpl.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                        {tpl.label}
                      </h4>
                      <span className="text-xs text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Open →
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {tpl.tagline}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {tpl.description}
                    </p>
                    <ul className="mt-3 space-y-1">
                      {tpl.highlights.map((h) => (
                        <li
                          key={h}
                          className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1.5"
                        >
                          <span className="text-blue-500" aria-hidden>
                            ✓
                          </span>
                          {h}
                        </li>
                      ))}
                    </ul>
                    <span className="inline-block mt-3 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 rounded px-2 py-0.5">
                      {tpl.complianceNote}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Copy-paste quickstart */}
        <section className="mb-12">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">
            Or add it to your app in 2 steps
          </h3>
          <CodeBlock code={INSTALL_SNIPPET} language="bash" />
        </section>

        {/* Platform links */}
        <section className="mb-12">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">
            Every platform
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {PLATFORM_LINKS.map((p) => (
              <a
                key={p.label}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {p.label}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  {p.note}
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Footer links */}
        <section className="border-t border-gray-200 dark:border-gray-800 pt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <a
            href="https://github.com/dappros/ethora"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Open-source on GitHub
          </a>
          <a
            href="https://ethora.com/?utm_source=playground"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ethora.com
          </a>
          <a
            href="https://ethora.com/contact?utm_source=playground"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Talk to us about self-hosting
          </a>
        </section>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useRef } from 'react';

// Created programmatically via the `snack-sdk` npm package (Snack.saveAsync()),
// no Expo account needed — see .scratch/create-snack.mjs. Loads
// @ethora/chat-component-rn straight from npm. Deliberately ships with no
// credentials pre-filled (nothing that authenticates against production
// belongs in a public, anonymously-editable Snack) — the equivalent "Fill
// demo credentials" button lives only in the local
// ethora-sample-react-native/App.tsx sample, run that for one-tap testing.
//
// The `/embed/<id>` iframe URL Snack's docs imply doesn't actually resolve
// (404s as "Oops! We couldn't find the Snack") for a snack saved without a
// logged-in account. The officially generated embed markup (Snack's own
// "Show embed code" button) instead points `data-snack-id` at a `<div>` that
// `embed.js` replaces with the preview iframe at runtime, so that's what we
// reproduce here instead of hand-building an iframe src.
const SNACK_HASH_ID = 'zixKhhGkv41ceDun3NUhl';
const SNACK_URL = `https://snack.expo.dev/${SNACK_HASH_ID}`;

export default function ReactNativePanel() {
  const embedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://snack.expo.dev/embed.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 lg:px-6 py-8">
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            React Native — free, in-browser
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-3xl">
            <code>@ethora/chat-component-rn</code> live in an{' '}
            <a
              href="https://snack.expo.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Expo Snack
            </a>{' '}
            — no Xcode/Android Studio, no account, free. Pick a device below, or
            scan the QR with Expo Go on your own phone for a real native run.
          </p>
        </section>

        <section className="mb-8">
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Live embed &mdash; sample app from{' '}
                <code>ethora-sample-react-native</code>
              </span>
              <a
                href={SNACK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
              >
                Open full editor ↗
              </a>
            </div>
            <div
              ref={embedRef}
              data-snack-id={SNACK_HASH_ID}
              data-snack-platform="web"
              data-snack-preview="true"
              data-snack-theme="dark"
              style={{
                overflow: 'hidden',
                background: '#0b1220',
                border: '1px solid #1f2937',
                borderRadius: 4,
                height: 660,
                width: '100%',
              }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            First load resolves native dependencies (XMPP client, async-storage,
            svg…) via Expo&apos;s snackager — can take 20-40s. The in-page device
            preview runs on Appetize&apos;s free tier; if it stalls, use{' '}
            <span className="font-medium">My Device</span> in the embed toolbar
            to scan the QR with Expo Go instead — that always works and exercises
            the real native modules.
          </p>
        </section>

        <section className="border-t border-gray-200 dark:border-gray-800 pt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            Prefer a real simulator on your Mac?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-3xl mb-2">
            Both are free and already installed in this workspace &mdash; no
            purchase needed:
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc pl-5 space-y-1">
            <li>
              <span className="font-medium">iOS:</span> Xcode Simulator &mdash;{' '}
              <code>cd ethora-sample-react-native &amp;&amp; npx expo run:ios</code>
            </li>
            <li>
              <span className="font-medium">Android:</span> Android Emulator (AVD
              already created) &mdash;{' '}
              <code>
                $HOME/Library/Android/sdk/emulator/emulator -avd Ethora_API_36_1
              </code>{' '}
              then <code>npx expo run:android</code>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

/**
 * SDK initialization utilities for Ethora SDK Playground
 */

import { getEthoraSDKService } from '@ethora/sdk-backend';
import type { ChatRepository } from '@ethora/sdk-backend';

let sdkInstance: ChatRepository | null = null;

/**
 * Initialize and get SDK service instance
 * @throws Error if SDK credentials are missing
 */
export function getSDKInstance(): ChatRepository {
  if (!sdkInstance) {
    // Only set default for API URL, not for APP_ID and APP_SECRET
    // These should be provided by user in .env.local
    if (!process.env.ETHORA_CHAT_API_URL) {
      process.env.ETHORA_CHAT_API_URL = process.env.NEXT_PUBLIC_ETHORA_CHAT_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.ethoradev.com';
    }

    if (!process.env.ETHORA_XMPP_DEV_SERVER) {
      const explicit = process.env.NEXT_PUBLIC_ETHORA_CHAT_URL || process.env.NEXT_PUBLIC_ETHORA_XMPP_DEV_SERVER || process.env.ETHORA_CHAT_URL;
      if (explicit) {
        process.env.ETHORA_XMPP_DEV_SERVER = explicit;
      } else {
        try {
          const url = new URL(process.env.ETHORA_CHAT_API_URL);
          const hostname = url.hostname;
          const xmppHostname = hostname.startsWith('api.') ? hostname.replace('api.', 'xmpp.') : `xmpp.${hostname}`;
          process.env.ETHORA_XMPP_DEV_SERVER = `wss://${xmppHostname}/ws`;
        } catch {
          process.env.ETHORA_XMPP_DEV_SERVER = 'wss://xmpp.ethoradev.com:5443/ws';
        }
      }
    }

    // Verify that APP_ID and APP_SECRET are set if SDK requires them
    // Don't set defaults - let SDK throw error if they're missing
    const requiredEnvVars = [
      'ETHORA_CHAT_APP_ID',
      'ETHORA_CHAT_APP_SECRET',
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName] || process.env[varName] === `your_${varName.toLowerCase().replace('ethora_chat_', '').replace('_', '_')}`
    );

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}\n` +
        'Please set them in .env.local file'
      );
    }

    try {
      sdkInstance = getEthoraSDKService();
    } catch (error) {
      throw new Error(
        `Failed to initialize SDK: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return sdkInstance;
}

/**
 * Check if SDK is properly configured
 */
export function isSDKConfigured(): boolean {
  try {
    getSDKInstance();
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate server-to-server JWT token (x-custom-token)
 * This is the same token that the SDK backend uses internally
 */
export function generateServerToken(): string | null {
  try {
    // Use dynamic import to avoid issues if jsonwebtoken is not directly available
    const jwt = require('jsonwebtoken');
    const appId = process.env.ETHORA_CHAT_APP_ID;
    const appSecret = process.env.ETHORA_CHAT_APP_SECRET;

    if (!appId || !appSecret) {
      return null;
    }

    return jwt.sign(
      {
        data: {
          appId: appId,
          type: 'server',
        },
      },
      appSecret,
      { expiresIn: '1h' }
    ) as string;
  } catch (error) {
    console.error('Error generating server token:', error);
    return null;
  }
}


/**
 * Generate server-to-server JWT token (x-custom-token)
 * This is the same token that the SDK backend uses internally
 */
export function generateClientToken(userId: string): string | null {
  try {
    // Use dynamic import to avoid issues if jsonwebtoken is not directly available
    const jwt = require('jsonwebtoken');
    const appId = process.env.ETHORA_CHAT_APP_ID;
    const appSecret = process.env.ETHORA_CHAT_APP_SECRET;

    if (!appId || !appSecret) {
      return null;
    }

    return jwt.sign(
      {
        data: {
          type: "client",
          userId: userId,
          appId: appId
        },
      },
      appSecret,
      { expiresIn: '1h' }
    ) as string;
  } catch (error) {
    console.error('Error generating server token:', error);
    return null;
  }
}

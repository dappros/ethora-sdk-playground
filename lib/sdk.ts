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
    // Verify environment variables are set
    const requiredEnvVars = [
      'ETHORA_CHAT_API_URL',
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


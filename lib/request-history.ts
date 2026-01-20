/**
 * Request history management for SDK testing
 */

export interface RequestHistoryItem {
  id: string;
  timestamp: number;
  method: string;
  params: any;
  result?: any;
  error?: any;
  responseTime?: number;
  success: boolean;
}

const STORAGE_KEY = 'sdk-playground-request-history';
const MAX_HISTORY_ITEMS = 50;

/**
 * Get all request history items
 */
export function getRequestHistory(): RequestHistoryItem[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const history = JSON.parse(stored);
    return Array.isArray(history) ? history : [];
  } catch (error) {
    console.error('Error reading request history:', error);
    return [];
  }
}

/**
 * Save a request to history
 */
export function saveRequestToHistory(item: Omit<RequestHistoryItem, 'id' | 'timestamp'>): RequestHistoryItem {
  const historyItem: RequestHistoryItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
    timestamp: Date.now(),
  };

  const history = getRequestHistory();
  history.unshift(historyItem); // Add to beginning

  // Keep only the most recent items
  const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error('Error saving request history:', error);
    // If storage is full, try to clear old items
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      const reducedHistory = trimmedHistory.slice(0, Math.floor(MAX_HISTORY_ITEMS / 2));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedHistory));
      } catch (e) {
        console.error('Error saving reduced history:', e);
      }
    }
  }

  return historyItem;
}

/**
 * Clear all request history
 */
export function clearRequestHistory(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing request history:', error);
  }
}

/**
 * Remove a specific request from history
 */
export function removeRequestFromHistory(id: string): void {
  const history = getRequestHistory();
  const filtered = history.filter((item) => item.id !== id);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing request from history:', error);
  }
}

/**
 * Export history as JSON
 */
export function exportHistory(): string {
  const history = getRequestHistory();
  return JSON.stringify(history, null, 2);
}

/**
 * Import history from JSON
 */
export function importHistory(json: string): { success: boolean; error?: string; count?: number } {
  try {
    const history = JSON.parse(json);
    if (!Array.isArray(history)) {
      return { success: false, error: 'Invalid history format: expected array' };
    }

    // Validate items
    const validHistory = history.filter((item) => {
      return (
        item &&
        typeof item === 'object' &&
        typeof item.method === 'string' &&
        typeof item.params === 'object' &&
        typeof item.success === 'boolean'
      );
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validHistory));
      return { success: true, count: validHistory.length };
    } catch (error) {
      return { success: false, error: 'Failed to save imported history' };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid JSON format',
    };
  }
}

/**
 * Get request statistics
 */
export function getRequestStatistics(): {
  total: number;
  successful: number;
  failed: number;
  averageResponseTime: number;
  methods: Record<string, number>;
} {
  const history = getRequestHistory();
  const successful = history.filter((item) => item.success).length;
  const failed = history.length - successful;

  const responseTimes = history
    .filter((item) => item.responseTime !== undefined)
    .map((item) => item.responseTime!);
  const averageResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

  const methods: Record<string, number> = {};
  history.forEach((item) => {
    methods[item.method] = (methods[item.method] || 0) + 1;
  });

  return {
    total: history.length,
    successful,
    failed,
    averageResponseTime: Math.round(averageResponseTime),
    methods,
  };
}

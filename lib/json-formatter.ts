/**
 * JSON formatting utilities for better readability and usability
 */

/**
 * Format JSON string with proper indentation
 * @param jsonString - JSON string to format
 * @param indent - Number of spaces for indentation (default: 2)
 * @returns Formatted JSON string or original string if invalid
 */
export function formatJSON(jsonString: string, indent: number = 2): string {
  if (!jsonString || !jsonString.trim()) {
    return jsonString;
  }

  try {
    // Try to parse and format
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, indent);
  } catch (error) {
    // If parsing fails, return original string
    return jsonString;
  }
}

/**
 * Validate JSON string
 * @param jsonString - JSON string to validate
 * @returns Object with valid flag and error message if invalid
 */
export function validateJSON(jsonString: string): { valid: boolean; error?: string } {
  if (!jsonString || !jsonString.trim()) {
    return { valid: false, error: 'JSON string is empty' };
  }

  try {
    JSON.parse(jsonString);
    return { valid: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON';
    return { valid: false, error: message };
  }
}

/**
 * Auto-format JSON on paste or blur event
 * @param value - Current textarea value
 * @param setValue - Function to update the value
 */
export function handleJSONFormat(
  value: string,
  setValue: (value: string) => void
): void {
  const trimmed = value.trim();
  if (!trimmed) {
    return;
  }

  // Check if it looks like JSON (starts with { or [)
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const formatted = formatJSON(trimmed);
    if (formatted !== trimmed) {
      setValue(formatted);
    }
  }
}

/**
 * Format JSON with error handling - returns formatted string or error message
 * @param jsonString - JSON string to format
 * @returns Object with formatted string or error
 */
export function safeFormatJSON(jsonString: string): {
  success: boolean;
  formatted?: string;
  error?: string;
} {
  const validation = validateJSON(jsonString);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const formatted = formatJSON(jsonString);
    return { success: true, formatted };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to format JSON',
    };
  }
}

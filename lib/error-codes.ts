/**
 * Error code definitions and mappings for SDK operations
 */

export enum SDKErrorCode {
  // Configuration errors
  SDK_NOT_CONFIGURED = 'SDK_NOT_CONFIGURED',
  MISSING_CREDENTIALS = 'MISSING_CREDENTIALS',
  
  // Validation errors
  INVALID_PARAMS = 'INVALID_PARAMS',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  FILE_VALIDATION_ERROR = 'FILE_VALIDATION_ERROR',
  INVALID_JSON = 'INVALID_JSON',
  MISSING_METHOD = 'MISSING_METHOD',
  UNKNOWN_METHOD = 'UNKNOWN_METHOD',
  
  // Field-specific errors
  MISSING_WORKSPACE_ID = 'MISSING_WORKSPACE_ID',
  MISSING_USER_ID = 'MISSING_USER_ID',
  MISSING_USER_DATA = 'MISSING_USER_DATA',
  MISSING_ROOM_DATA = 'MISSING_ROOM_DATA',
  
  // Business logic errors
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  ROOM_ALREADY_EXISTS = 'ROOM_ALREADY_EXISTS',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  MAX_USERS_EXCEEDED = 'MAX_USERS_EXCEEDED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // SDK execution errors
  SDK_EXECUTION_ERROR = 'SDK_EXECUTION_ERROR',
  UNEXPECTED_ERROR = 'UNEXPECTED_ERROR',
}

export interface ErrorCodeMapping {
  code: SDKErrorCode;
  message: string;
  suggestions: string[];
  httpStatus?: number;
}

export const ERROR_CODE_MAPPINGS: Record<SDKErrorCode, ErrorCodeMapping> = {
  [SDKErrorCode.SDK_NOT_CONFIGURED]: {
    code: SDKErrorCode.SDK_NOT_CONFIGURED,
    message: 'SDK not configured. Please check your .env.local file with ETHORA_CHAT_APP_ID and ETHORA_CHAT_APP_SECRET',
    suggestions: [
      'Check your .env.local file has ETHORA_CHAT_APP_ID set',
      'Verify ETHORA_CHAT_APP_SECRET is configured',
      'Ensure ETHORA_CHAT_API_URL is correct (defaults to https://api.ethoradev.com)',
      'Restart the development server after changing .env.local',
    ],
    httpStatus: 500,
  },
  [SDKErrorCode.MISSING_CREDENTIALS]: {
    code: SDKErrorCode.MISSING_CREDENTIALS,
    message: 'Missing required SDK credentials',
    suggestions: [
      'Verify ETHORA_CHAT_APP_ID is set in .env.local',
      'Verify ETHORA_CHAT_APP_SECRET is set in .env.local',
      'Check that credentials are not placeholder values',
    ],
    httpStatus: 500,
  },
  [SDKErrorCode.INVALID_PARAMS]: {
    code: SDKErrorCode.INVALID_PARAMS,
    message: 'Invalid parameters provided',
    suggestions: [
      'Check that all required parameters are provided',
      'Verify parameter types match expected formats',
      'Review the method documentation for parameter requirements',
    ],
    httpStatus: 400,
  },
  [SDKErrorCode.VALIDATION_ERROR]: {
    code: SDKErrorCode.VALIDATION_ERROR,
    message: 'Data validation failed',
    suggestions: [
      'Review the error message for specific field issues',
      'Ensure all required fields are provided',
      'Check data types match expected formats',
      'Verify email addresses are valid',
      'Check that string lengths meet minimum requirements',
    ],
    httpStatus: 400,
  },
  [SDKErrorCode.FILE_VALIDATION_ERROR]: {
    code: SDKErrorCode.FILE_VALIDATION_ERROR,
    message: 'File validation failed',
    suggestions: [
      'Check that profileImageFileIndex values are within the range of uploaded files',
      'Ensure files are valid image formats',
      'Verify file sizes are within acceptable limits',
      'Check that files are not corrupted',
    ],
    httpStatus: 400,
  },
  [SDKErrorCode.INVALID_JSON]: {
    code: SDKErrorCode.INVALID_JSON,
    message: 'Invalid JSON format',
    suggestions: [
      'Ensure the JSON is properly formatted with matching brackets and quotes',
      'Use a JSON validator to check for syntax errors',
      'Make sure all string values are properly quoted',
      'Check for trailing commas',
    ],
    httpStatus: 400,
  },
  [SDKErrorCode.MISSING_METHOD]: {
    code: SDKErrorCode.MISSING_METHOD,
    message: 'Method is required and must be a string',
    suggestions: [
      'Ensure the method parameter is provided',
      'Check that method is a valid SDK method name',
      'Verify the request body includes the method field',
    ],
    httpStatus: 400,
  },
  [SDKErrorCode.UNKNOWN_METHOD]: {
    code: SDKErrorCode.UNKNOWN_METHOD,
    message: 'Unknown SDK method',
    suggestions: [
      'Check the method name spelling',
      'Verify the method is supported by the SDK',
      'Review available SDK methods in the documentation',
    ],
    httpStatus: 400,
  },
  [SDKErrorCode.MISSING_WORKSPACE_ID]: {
    code: SDKErrorCode.MISSING_WORKSPACE_ID,
    message: 'workspaceId is required',
    suggestions: [
      'Ensure workspaceId is provided and is a non-empty string',
      'Check that the workspaceId matches your workspace identifier',
      'Verify the workspaceId format is correct',
    ],
    httpStatus: 400,
  },
  [SDKErrorCode.MISSING_USER_ID]: {
    code: SDKErrorCode.MISSING_USER_ID,
    message: 'userId is required',
    suggestions: [
      'Ensure userId is provided and is a non-empty string',
      'Verify the userId format matches your user identification system',
      'Check that userId is not empty or whitespace',
    ],
    httpStatus: 400,
  },
  [SDKErrorCode.MISSING_USER_DATA]: {
    code: SDKErrorCode.MISSING_USER_DATA,
    message: 'userData is required',
    suggestions: [
      'Ensure userData object is provided',
      'Check that userData contains required fields (email, firstName, lastName)',
      'Verify userData is a valid object',
    ],
    httpStatus: 400,
  },
  [SDKErrorCode.MISSING_ROOM_DATA]: {
    code: SDKErrorCode.MISSING_ROOM_DATA,
    message: 'roomData is required',
    suggestions: [
      'Ensure roomData object is provided',
      'Check that roomData contains required fields (uuid)',
      'Verify roomData is a valid object',
    ],
    httpStatus: 400,
  },
  [SDKErrorCode.USER_NOT_FOUND]: {
    code: SDKErrorCode.USER_NOT_FOUND,
    message: 'User not found',
    suggestions: [
      'Verify the userId exists in the system',
      'Check that the user was created successfully',
      'Ensure you are using the correct userId',
    ],
    httpStatus: 404,
  },
  [SDKErrorCode.ROOM_NOT_FOUND]: {
    code: SDKErrorCode.ROOM_NOT_FOUND,
    message: 'Chat room not found',
    suggestions: [
      'Verify the workspaceId exists in the system',
      'Check that the room was created successfully',
      'Ensure you are using the correct workspaceId',
    ],
    httpStatus: 404,
  },
  [SDKErrorCode.ROOM_ALREADY_EXISTS]: {
    code: SDKErrorCode.ROOM_ALREADY_EXISTS,
    message: 'Chat room already exists',
    suggestions: [
      'The room may already exist - this is often safe to ignore',
      'Use a different workspaceId if you need a new room',
      'Check if the room creation is idempotent',
    ],
    httpStatus: 409,
  },
  [SDKErrorCode.USER_ALREADY_EXISTS]: {
    code: SDKErrorCode.USER_ALREADY_EXISTS,
    message: 'User already exists',
    suggestions: [
      'The user may already exist - this is often safe to ignore',
      'Use a different userId if you need a new user',
      'Check if the user creation is idempotent',
    ],
    httpStatus: 409,
  },
  [SDKErrorCode.MAX_USERS_EXCEEDED]: {
    code: SDKErrorCode.MAX_USERS_EXCEEDED,
    message: 'Maximum 100 users allowed per request',
    suggestions: [
      'Split the request into multiple batches',
      'Process users in chunks of 100 or less',
      'Use pagination for large user lists',
    ],
    httpStatus: 400,
  },
  [SDKErrorCode.ACCESS_DENIED]: {
    code: SDKErrorCode.ACCESS_DENIED,
    message: 'Access denied',
    suggestions: [
      'Verify your SDK credentials are correct',
      'Check that you have permission to perform this operation',
      'Ensure the workspaceId and userId are valid',
    ],
    httpStatus: 403,
  },
  [SDKErrorCode.NETWORK_ERROR]: {
    code: SDKErrorCode.NETWORK_ERROR,
    message: 'Network error occurred',
    suggestions: [
      'Check your internet connection',
      'Verify the API endpoint is accessible',
      'Check if there are any firewall or proxy issues',
      'Try again in a few moments',
    ],
    httpStatus: 500,
  },
  [SDKErrorCode.TIMEOUT_ERROR]: {
    code: SDKErrorCode.TIMEOUT_ERROR,
    message: 'Request timeout',
    suggestions: [
      'The request took too long to complete',
      'Check your network connection',
      'Try again with a smaller payload',
      'Verify the API endpoint is responsive',
    ],
    httpStatus: 504,
  },
  [SDKErrorCode.RATE_LIMIT_EXCEEDED]: {
    code: SDKErrorCode.RATE_LIMIT_EXCEEDED,
    message: 'Rate limit exceeded',
    suggestions: [
      'You have made too many requests',
      'Wait a few moments before trying again',
      'Reduce the frequency of requests',
      'Check your API rate limits',
    ],
    httpStatus: 429,
  },
  [SDKErrorCode.SDK_EXECUTION_ERROR]: {
    code: SDKErrorCode.SDK_EXECUTION_ERROR,
    message: 'Failed to execute SDK method',
    suggestions: [
      'Check the SDK method parameters',
      'Verify the SDK is properly configured',
      'Review the error details for more information',
      'Check the SDK documentation',
    ],
    httpStatus: 500,
  },
  [SDKErrorCode.UNEXPECTED_ERROR]: {
    code: SDKErrorCode.UNEXPECTED_ERROR,
    message: 'An unexpected error occurred',
    suggestions: [
      'Try again in a moment',
      'Check your network connection',
      'Verify the SDK is properly configured',
      'Review the error details for more information',
    ],
    httpStatus: 500,
  },
};

/**
 * Get error mapping by code
 */
export function getErrorMapping(code: SDKErrorCode): ErrorCodeMapping {
  return ERROR_CODE_MAPPINGS[code] || ERROR_CODE_MAPPINGS[SDKErrorCode.UNEXPECTED_ERROR];
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  code: SDKErrorCode,
  customMessage?: string,
  additionalSuggestions?: string[]
): ErrorCodeMapping & { message: string } {
  const mapping = getErrorMapping(code);
  return {
    ...mapping,
    message: customMessage || mapping.message,
    suggestions: additionalSuggestions
      ? [...mapping.suggestions, ...additionalSuggestions]
      : mapping.suggestions,
  };
}

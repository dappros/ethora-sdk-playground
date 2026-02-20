'use client';

import React, { useState, useCallback } from 'react';
import type { SDKMethodName } from '@/lib/sdk-types';
import { formatJSON, validateJSON, safeFormatJSON } from '@/lib/json-formatter';
import { saveRequestToHistory, type RequestHistoryItem } from '@/lib/request-history';
import { exportRequest, type ExportFormat } from '@/lib/code-export';
import { validateUserData } from '@/lib/user-validation';
import RequestHistory from './RequestHistory';
import ResponseLogger, { type LogEntry } from './ResponseLogger';

interface SDKTestingPanelProps {
  onExecute: (method: string, params: any, files?: File[]) => Promise<any>;
  token?: string;
  baseUrl?: string;
}

interface APIError {
  error: string;
  suggestions?: string[];
  code?: string;
  field?: string;
  details?: string;
  url?: string;
  requestUrl?: string;
}

interface SDKParam {
  key: string;
  label: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  placeholder?: string;
}

interface SDKMethod {
  id: string;
  name: string;
  description: string;
  params: SDKParam[];
}

interface MethodForm {
  method: string;
  params: Record<string, any>;
}

const SDK_METHODS: SDKMethod[] = [
  {
    id: 'createChatRoom',
    name: 'Create Chat Room',
    description: 'Create a chat room for a chat',
    params: [
      { key: 'chatId', label: 'chat ID', type: 'text', required: true, defaultValue: 'test-room-' + Math.random().toString(36).substring(7) },
      { key: 'title', label: 'Title', type: 'text', required: false, defaultValue: 'Project Team Alpha' },
      { key: 'type', label: 'Type', type: 'text', required: false, defaultValue: 'group' },
    ],
  },
  {
    id: 'createUser',
    name: 'Create User',
    description: 'Create a user in the chat service',
    params: [
      { key: 'userId', label: 'User ID', type: 'text', required: true, defaultValue: 'user-' + Math.random().toString(36).substring(7) },
      { key: 'email', label: 'Email', type: 'email', required: true, defaultValue: 'test-user@example.com' },
      { key: 'firstName', label: 'First Name', type: 'text', required: true, defaultValue: 'Test' },
      { key: 'lastName', label: 'Last Name', type: 'text', required: true, defaultValue: 'User' },
      { key: 'password', label: 'Password', type: 'text', required: false, defaultValue: 'password123' },
      { key: 'uuid', label: 'UUID', type: 'text', required: false },
      { key: 'profileImage', label: 'Profile Image URL', type: 'text', required: false },
      { key: 'displayName', label: 'Display Name', type: 'text', required: false, defaultValue: 'Tester' },
    ],
  },
  {
    id: 'grantUserAccessToChatRoom',
    name: 'Grant User Access',
    description: 'Grant a user access to a chat room',
    params: [
      { key: 'chatId', label: 'chat ID', type: 'text', required: true, defaultValue: 'test-room-1' },
      { key: 'userId', label: 'User ID', type: 'text', required: true, defaultValue: 'user-1' },
    ],
  },

  {
    id: 'deleteChatRoom',
    name: 'Delete Chat Room',
    description: 'Delete a chat room by chat ID',
    params: [
      { key: 'chatId', label: 'chat ID', type: 'text', required: true, defaultValue: 'test-room-1' },
    ],
  },
  {
    id: 'deleteUsers',
    name: 'Delete Users',
    description: 'Delete multiple users',
    params: [
      { key: 'userIds', label: 'User IDs (comma-separated)', type: 'text', required: true, defaultValue: 'user-1,user-2' },
    ],
  },
  {
    id: 'getUsers',
    name: 'Get Users',
    description: 'Get users from the chat service',
    params: [
      { key: 'chatName', label: 'Chat Name (optional)', type: 'text', required: false, placeholder: 'appId_chatId' },
      { key: 'xmppUsername', label: 'XMPP Username (optional)', type: 'text', required: false, placeholder: 'appId_userId' },
    ],
  },
  {
    id: 'updateUsers',
    name: 'Update Users',
    description: 'Update multiple users (batch)',
    params: [
      {
        key: 'users',
        label: 'Users JSON Array',
        type: 'textarea',
        required: true,
        defaultValue: '[\n  {\n    "xmppUsername": "user-1",\n    "firstName": "John Updated"\n  }\n]',
      },
    ],
  },
  {
    id: 'removeUserAccessFromChatRoom',
    name: 'Remove User Access',
    description: 'Remove a user from a chat room',
    params: [
      { key: 'chatId', label: 'chat ID', type: 'text', required: true },
      { key: 'userId', label: 'User ID (comma-separated for multiple)', type: 'text', required: true },
    ],
  },
  {
    id: 'sendPushToUser',
    name: 'Send Push Notification',
    description: 'Send a push notification to a user',
    params: [
      { key: 'userId', label: 'User ID', type: 'text', required: true, defaultValue: 'user-1' },
      {
        key: 'data',
        label: 'Notification Data (JSON)',
        type: 'textarea',
        required: true,
        defaultValue: '{\n  "title": "Hello",\n  "body": "This is a test notification",\n  "data": {\n    "key": "value"\n  }\n}',
      },
    ],
  },
];

export default function SDKTestingPanel({ onExecute, token, baseUrl }: SDKTestingPanelProps) {
  const [selectedMethod, setSelectedMethod] = useState<SDKMethodName>(SDK_METHODS[0].id as SDKMethodName);
  
  // Initialize with the first method's defaults
  const initialFormData = SDK_METHODS[0].params.reduce((acc, param) => {
    if (param.defaultValue !== undefined) acc[param.key] = param.defaultValue;
    return acc;
  }, {} as Record<string, any>);

  const [formData, setFormData] = useState<Record<string, any>>(initialFormData);
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<APIError | null>(null);
  const [loading, setLoading] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [showCodeExport, setShowCodeExport] = useState(false);
  const [showApiInfo, setShowApiInfo] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('sdk');

  const currentMethod = SDK_METHODS.find((m) => m.id === selectedMethod);

  const handleMethodChange = (methodId: string) => {
    const nextMethod = SDK_METHODS.find(m => m.id === methodId);
    setSelectedMethod(methodId as SDKMethodName);
    
    // Auto-populate with defaults
    const defaults: Record<string, any> = {};
    nextMethod?.params.forEach(p => {
      if (p.defaultValue !== undefined) defaults[p.key] = p.defaultValue;
    });

    setFormData(defaults);
    setFiles([]);
    setResult(null);
    setError(null);
  };

  // Handle JSON formatting for textarea inputs
  const handleTextareaChange = useCallback((key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Format JSON on blur for textareas
  const handleTextareaBlur = useCallback((key: string, value: string) => {
    if (!value || !value.trim()) return;

    // Check if it looks like JSON
    const trimmed = value.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      const formatted = safeFormatJSON(trimmed);
      if (formatted.success && formatted.formatted) {
        setFormData((prev) => ({ ...prev, [key]: formatted.formatted }));
      } else if (formatted.error) {
        // Show validation error but don't block input
        console.warn(`JSON formatting warning for ${key}:`, formatted.error);
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const autoGenerate = () => {
    if (!currentMethod) return;

    const generated: Record<string, any> = {};
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);

    currentMethod.params.forEach((param) => {
      if (param.defaultValue !== undefined) {
        generated[param.key] = param.defaultValue;
      } else if (param.key === 'chatId') {
        generated[param.key] = `chat-${timestamp}-${randomId}`;
      } else if (param.key === 'userId') {
        generated[param.key] = `user-${timestamp}-${randomId}`;
      } else if (param.key === 'title') {
        generated[param.key] = `Chat Room ${timestamp}`;
      } else if (param.key === 'email') {
        generated[param.key] = `user-${timestamp}@example.com`;
      } else if (param.key === 'firstName') {
        generated[param.key] = 'John';
      } else if (param.key === 'lastName') {
        generated[param.key] = 'Doe';
      } else if (param.key === 'password') {
        generated[param.key] = 'Qwerty123';
      } else if (param.key === 'displayName') {
        generated[param.key] = 'John Doe';
      } else if (param.key === 'userIds') {
        generated[param.key] = `user-1,user-2,user-3`;
      } else if (param.key === 'users') {
            generated[param.key] = JSON.stringify(
          [
            {
              email: `user1-${timestamp}@example.com`,
              firstName: 'John',
              lastName: 'Doe',
              displayName: 'John Doe',
            },
            {
              email: `user2-${timestamp}@example.com`,
              firstName: 'Jane',
              lastName: 'Smith',
              displayName: 'Jane Smith',
            },
          ],
          null,
          2
        );
      } else if (param.type === 'checkbox') {
        generated[param.key] = true;
      } else if (param.key === 'chatName') {
        generated[param.key] = `chat-${timestamp}`;
      } else if (param.key === 'members') {
        generated[param.key] = `user-1,user-2`;
      } else if (param.key === 'data' && selectedMethod === 'sendPushToUser') {
        generated[param.key] = JSON.stringify(
          {
            title: 'Hello',
            message: 'This is a push notification',
            sound: 'default',
          },
          null,
          2
        );
      }
    });

    setFormData(generated);
  };

  const handleInputChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
    // Real-time validation for specific fields
    validateField(key, value);
  };

  const validateField = (key: string, value: any) => {
    const errors: Record<string, string> = {};
    
    if (key === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors[key] = 'Invalid email format';
      }
    }
    
    if (key === 'firstName' && value) {
      if (value.length < 3) {
        errors[key] = 'First name must be at least 3 characters';
      }
    }
    
    if (key === 'lastName' && value) {
      if (value.length < 2) {
        errors[key] = 'Last name must be at least 2 characters';
      }
    }
    
    if (key === 'chatId' && value) {
      if (value.trim().length === 0) {
        errors[key] = 'chat ID is required';
      }
    }
    
    if (key === 'userId' && value) {
      if (value.trim().length === 0) {
        errors[key] = 'User ID is required';
      }
    }

    if (key === 'users' && value) {
      const validation = validateJSON(value);
      if (!validation.valid) {
        errors[key] = `Invalid JSON: ${validation.error}`;
      } else {
        try {
          const users = JSON.parse(value);
          if (!Array.isArray(users)) {
            errors[key] = 'Users must be an array';
          } else if (users.length === 0) {
            errors[key] = 'Users array cannot be empty';
          } else {
            // Validate each user
            users.forEach((user: any, index: number) => {
              const userValidation = validateUserData(user);
              if (!userValidation.valid) {
                errors[key] = `User ${index + 1}: ${userValidation.error}`;
              }
            });
          }
        } catch (e) {
          // Already handled by validateJSON
        }
      }
    }
    
    if (key === 'chatName' && value) {
      if (value.trim().length === 0) {
        errors[key] = 'Chat name is required';
      }
    }
    
    if (key === 'members' && value) {
      if (value.trim().length === 0) {
        errors[key] = 'Members are required';
      }
    }

    if (key === 'data' && value) {
      const validation = validateJSON(value);
      if (!validation.valid) {
        errors[key] = `Invalid JSON: ${validation.error}`;
      }
    }

    setFieldErrors((prev) => ({ ...prev, ...errors }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setResponseTime(null);
    setFieldErrors({});

    const startTime = Date.now();
    let requestLog: LogEntry | null = null;

    try {
      // Prepare params based on method
      let params: any = {};

      if (selectedMethod === 'deleteUsers') {
        params.userIds = formData.userIds
          ? formData.userIds.split(',').map((id: string) => id.trim())
          : [];
      } else if (selectedMethod === 'updateUsers') {
        const usersJson = formData.users || '[]';
        const validation = validateJSON(usersJson);
        if (!validation.valid) {
          throw new Error(`Invalid JSON format for users array: ${validation.error}`);
        }
        try {
          params.users = JSON.parse(usersJson);
        } catch (e) {
          throw new Error('Invalid JSON format for users array');
        }
      } else if (selectedMethod === 'getUsers') {
        params = {};
        if (formData.chatName) params.chatName = formData.chatName;
        if (formData.xmppUsername) params.xmppUsername = formData.xmppUsername;
        if (formData.page !== undefined && formData.page !== null && formData.page !== '' && !isNaN(Number(formData.page)) && Number(formData.page) > 0) {
          params.page = Number(formData.page);
        }
        if (formData.pageSize !== undefined && formData.pageSize !== null && formData.pageSize !== '' && !isNaN(Number(formData.pageSize)) && Number(formData.pageSize) > 0) {
          const pageSizeNum = Number(formData.pageSize);
          params.pageSize = pageSizeNum;
        }
        console.log('getUsers params before send:', JSON.stringify(params, null, 2));
      } else if (selectedMethod === 'grantUserAccessToChatRoom') {
        params = {
          chatId: formData.chatId,
          userId: formData.userId,
        };
      } else if (selectedMethod === 'createUser') {
        params = {
          userId: formData.userId,
          userData: {
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            ...(formData.password && { password: formData.password }),
            ...(formData.uuid && { uuid: formData.uuid }),
            ...(formData.profileImage && { profileImage: formData.profileImage }),
            ...(formData.profileImageFileIndex !== undefined && {
              profileImageFileIndex: Number(formData.profileImageFileIndex),
            }),
            ...(formData.displayName && { displayName: formData.displayName }),
          },
        };
      } else if (selectedMethod === 'createChatRoom') {
        params = {
          chatId: formData.chatId,
          roomData: {
            ...(formData.title && { title: formData.title }),
            uuid: formData.chatId,
            type: formData.type || 'group',
          },
        };
      } else if (selectedMethod === 'deleteChatRoom') {
        params = { chatId: formData.chatId };
      } else if (selectedMethod === 'removeUserAccessFromChatRoom') {
        const members = formData.userId
          ? formData.userId.split(',').map((m: string) => m.trim()).filter(Boolean)
          : [];
        params.chatId = formData.chatId;
        params.userId = members.length > 1 ? members : members[0];
      } else if (selectedMethod === 'sendPushToUser') {
        params = {
          userId: formData.userId,
          data: JSON.parse(formData.data || '{}'),
        };
      }

      // Generate headers info (x-custom-token is automatically added by SDK backend)
      const headers: Record<string, string> = {
        'Content-Type': files.length > 0 ? 'multipart/form-data' : 'application/json',
      };
      
      // Add placeholder for x-custom-token for server-to-server methods
      // The actual token will be updated after the request completes
      if (['updateUsers', 'createUser', 'getUsers', 'deleteUsers', 'createChatRoom', 'removeUserAccessFromChatRoom',
           'deleteChatRoom', 'grantUserAccessToChatRoom', 'sendPushToUser'].includes(selectedMethod)) {
        headers['x-custom-token'] = 'Generating...';
      }

      // Log request
      requestLog = {
        id: `req-${Date.now()}`,
        timestamp: Date.now(),
        type: 'request',
        method: selectedMethod,
        data: { method: selectedMethod, params, filesCount: files.length },
        headers,
      };
      setLogs((prev) => [requestLog!, ...prev.slice(0, 49)]); // Keep last 50 logs

      // Send request with files if present
      const executeResult = await onExecute(selectedMethod, params, files.length > 0 ? files : undefined);
      
      const endTime = Date.now();
      const elapsed = endTime - startTime;
      setResponseTime(elapsed);
      
      // Extract result and serverToken from response
      const response = executeResult?.result !== undefined ? executeResult.result : executeResult;
      const serverToken = executeResult?.serverToken;
      
      setResult(response);
      setError(null);

      // Update headers with actual server token if available
      if (serverToken && requestLog) {
        const updatedHeaders = { ...requestLog.headers };
        if (updatedHeaders['x-custom-token']) {
          updatedHeaders['x-custom-token'] = serverToken;
        }
        // Update the request log with actual token
        setLogs((prev) => {
          const updated = [...prev];
          const index = updated.findIndex(log => log.id === requestLog!.id);
          if (index !== -1) {
            updated[index] = { ...updated[index], headers: updatedHeaders };
          }
          return updated;
        });
      }

      // Log response
      const responseLog: LogEntry = {
        id: `res-${Date.now()}`,
        timestamp: Date.now(),
        type: 'response',
        method: selectedMethod,
        data: response,
        responseTime: elapsed,
        headers: {
          'Status': '200 OK',
          'Content-Type': 'application/json',
        },
      };
      setLogs((prev) => [responseLog, ...prev.slice(0, 49)]);

      // Save to history
      saveRequestToHistory({
        method: selectedMethod,
        params,
        result: response,
        success: true,
        responseTime: elapsed,
      });
    } catch (err) {
      const endTime = Date.now();
      const elapsed = endTime - startTime;
      setResponseTime(elapsed);

      // Log error
      const errorLog: LogEntry = {
        id: `err-${Date.now()}`,
        timestamp: Date.now(),
        type: 'error',
        method: selectedMethod,
        data: err instanceof Error ? { message: err.message, stack: err.stack } : err,
        responseTime: elapsed,
        headers: {
          'Status': 'Error',
          'Content-Type': 'application/json',
        },
      };
      setLogs((prev) => [errorLog, ...prev.slice(0, 49)]);

      // Parse structured error response
      let displayError: APIError;

      if (err instanceof Error) {
        const errorWithExtras = err as Error & {
          suggestions?: string[];
          code?: string;
          field?: string;
          details?: string;
          url?: string;
          requestUrl?: string;
        };
        displayError = {
          error: errorWithExtras.message,
          suggestions: errorWithExtras.suggestions,
          code: errorWithExtras.code,
          field: errorWithExtras.field,
          details: errorWithExtras.details,
          url: errorWithExtras.url,
          requestUrl: errorWithExtras.requestUrl,
        };
      } else if (err && typeof err === 'object') {
        const errObj = err as any;
        displayError = {
          error: errObj.error || errObj.message || 'An unexpected error occurred',
          suggestions: errObj.suggestions,
          code: errObj.code,
          field: errObj.field,
          details: typeof errObj.details === 'object' ? JSON.stringify(errObj.details, null, 2) : errObj.details,
          url: errObj.url,
          requestUrl: errObj.requestUrl,
        };
      } else {
        displayError = {
          error: String(err) || 'An unexpected error occurred',
        };
      }

      setError({
        ...displayError,
        suggestions: displayError.suggestions || [
          'Check that all required fields are filled',
          'Verify the data format is correct',
          'Review the error message for specific issues',
        ],
      });

      // Save failed request to history - reconstruct params from formData
      let errorParams: any = {};
      try {
        if (selectedMethod === 'deleteUsers') {
          errorParams.userIds = formData.userIds
            ? formData.userIds.split(',').map((id: string) => id.trim())
            : [];
        } else if (selectedMethod === 'updateUsers') {
          const usersJson = formData.users || '[]';
          errorParams.users = JSON.parse(usersJson);
        } else if (selectedMethod === 'getUsers') {
          errorParams = {};
          if (formData.chatName) errorParams.chatName = formData.chatName;
          if (formData.xmppUsername) errorParams.xmppUsername = formData.xmppUsername;
        } else if (selectedMethod === 'grantUserAccessToChatRoom') {
          errorParams = {
            chatId: formData.chatId,
            userId: formData.userId,
          };
        } else if (selectedMethod === 'createUser') {
          errorParams = {
            userId: formData.userId,
            userData: {
              email: formData.email,
              firstName: formData.firstName,
              lastName: formData.lastName,
              ...(formData.password && { password: formData.password }),
              ...(formData.uuid && { uuid: formData.uuid }),
              ...(formData.profileImage && { profileImage: formData.profileImage }),
              ...(formData.profileImageFileIndex !== undefined && {
                profileImageFileIndex: Number(formData.profileImageFileIndex),
              }),
              ...(formData.displayName && { displayName: formData.displayName }),
            },
          };
        } else if (selectedMethod === 'createChatRoom') {
          errorParams = {
            chatId: formData.chatId,
            roomData: {
              ...(formData.title && { title: formData.title }),
              uuid: formData.chatId,
              type: formData.type || 'group',
            },
          };
        } else if (selectedMethod === 'deleteChatRoom') {
          errorParams = { chatId: formData.chatId };
        } else if (selectedMethod === 'removeUserAccessFromChatRoom') {
          const members = formData.userId
            ? formData.userId.split(',').map((m: string) => m.trim()).filter(Boolean)
            : [];
          errorParams = {
            chatId: formData.chatId,
            userId: members.length > 1 ? members : members[0],
          };
        }
      } catch {
        // If reconstruction fails, use empty object
      }
      
      saveRequestToHistory({
        method: selectedMethod,
        params: errorParams,
        error: displayError,
        success: false,
        responseTime: elapsed,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReplay = (item: RequestHistoryItem) => {
    setSelectedMethod(item.method as SDKMethodName);
    // Try to populate form data from history
    if (item.params) {
      if (item.method === 'updateUsers' && item.params.users) {
        setFormData({ users: JSON.stringify(item.params.users, null, 2) });
      } else if (item.method === 'deleteUsers' && item.params.userIds) {
        setFormData({ userIds: item.params.userIds.join(',') });
      } else if (item.method === 'removeUserAccessFromChatRoom' && item.params.userId) {
        const userId = Array.isArray(item.params.userId)
          ? item.params.userId.join(',')
          : item.params.userId;
        setFormData({
          chatId: item.params.chatId,
          userId,
        });
      } else {
        setFormData(item.params);
      }
    }
    setShowHistory(false);
    // Scroll to form
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleExportCode = () => {
    try {
      let params: any = {};
      // Reconstruct params similar to handleSubmit
      if (selectedMethod === 'deleteUsers') {
        params.userIds = formData.userIds
          ? formData.userIds.split(',').map((id: string) => id.trim())
          : [];
      } else if (selectedMethod === 'updateUsers') {
        try {
          params.users = JSON.parse(formData.users || '[]');
        } catch {
          params.users = [];
        }
      } else if (selectedMethod === 'getUsers') {
        params = {};
        if (formData.chatName) params.chatName = formData.chatName;
        if (formData.xmppUsername) params.xmppUsername = formData.xmppUsername;
        if (formData.page !== undefined && formData.page !== null && formData.page !== '' && !isNaN(Number(formData.page)) && Number(formData.page) > 0) {
          params.page = Number(formData.page);
        }
        if (formData.pageSize !== undefined && formData.pageSize !== null && formData.pageSize !== '' && !isNaN(Number(formData.pageSize)) && Number(formData.pageSize) > 0) {
          const pageSizeNum = Number(formData.pageSize);
          params.pageSize = pageSizeNum;
        }
      } else if (selectedMethod === 'grantUserAccessToChatRoom') {
        params = {
          chatId: formData.chatId,
          userId: formData.userId,
        };
      } else if (selectedMethod === 'createUser') {
        params = {
          userId: formData.userId,
          userData: {
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            ...(formData.password && { password: formData.password }),
            ...(formData.uuid && { uuid: formData.uuid }),
            ...(formData.profileImage && { profileImage: formData.profileImage }),
            ...(formData.profileImageFileIndex !== undefined && {
              profileImageFileIndex: Number(formData.profileImageFileIndex),
            }),
            ...(formData.displayName && { displayName: formData.displayName }),
          },
        };
      } else if (selectedMethod === 'createChatRoom') {
        params = {
          chatId: formData.chatId,
          roomData: {
            ...(formData.title && { title: formData.title }),
            uuid: formData.chatId,
            type: formData.type || 'group',
          },
        };
      } else if (selectedMethod === 'deleteChatRoom') {
        params = { chatId: formData.chatId };
      } else if (selectedMethod === 'removeUserAccessFromChatRoom') {
        const members = formData.userId
          ? formData.userId.split(',').map((m: string) => m.trim()).filter(Boolean)
          : [];
        params.chatId = formData.chatId;
        params.userId = members.length > 1 ? members : members[0];
      } else if (selectedMethod === 'sendPushToUser') {
        params = {
          userId: formData.userId,
          data: JSON.parse(formData.data || '{}'),
        };
      } else {
        params = formData;
      }

      const baseUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
      const code = exportRequest(
        {
          method: selectedMethod,
          params,
          files: files.length > 0 ? files : undefined,
        },
        exportFormat,
        baseUrl,
        token
      );

      // Copy to clipboard
      navigator.clipboard.writeText(code);
      alert('Code copied to clipboard!');
    } catch (error) {
      console.error('Error exporting code:', error);
      alert(`Error exporting code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-4 lg:px-6 pb-4 lg:pb-6 bg-white dark:bg-gray-900">
      <div className="mb-6 sticky top-0 bg-white dark:bg-gray-900 pt-4 lg:pt-6 pb-4 border-b border-gray-200 dark:border-gray-800 z-10">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-2">
              SDK Testing
            </h2>
            <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
              Test all SDK methods interactively
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowApiInfo(!showApiInfo)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-1 ${
                showApiInfo 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {showApiInfo ? 'Hide' : 'Show'} API Info
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
            >
              {showHistory ? 'Hide' : 'Show'} History
            </button>
            <button
              onClick={() => setShowCodeExport(!showCodeExport)}
              className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
            >
              Export Code
            </button>
          </div>
        </div>
        {responseTime !== null && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Response time: <span className="font-mono">{responseTime}ms</span>
          </div>
        )}

        {/* API Info Panel */}
        {showApiInfo && (
          <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider">Current API Configuration</span>
                <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[10px] rounded font-mono">Live Info</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">Base URL (Settings)</span>
                  </div>
                  <div className="px-2 py-1.5 bg-white dark:bg-gray-950 border border-blue-100 dark:border-blue-900/50 rounded text-[11px] font-mono text-gray-600 dark:text-gray-400 break-all">
                    {baseUrl || 'Not configured'}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">Environment Variable</span>
                  </div>
                  <div className="px-2 py-1.5 bg-white dark:bg-gray-950 border border-blue-100 dark:border-blue-900/50 rounded text-[11px] font-mono text-gray-600 dark:text-gray-400 break-all">
                    <span className="text-gray-400 dark:text-gray-500 mr-1">NEXT_PUBLIC_ETHORA_CHAT_API_URL:</span>
                    {process.env.NEXT_PUBLIC_ETHORA_CHAT_API_URL || 'Undefined'}
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-gray-500 dark:text-gray-500 italic flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Note: Backend SDK operations utilize the server-side environment variables and settings passed from the client.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Code Export Panel */}
      {showCodeExport && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Export Code</h3>
            <button
              onClick={() => setShowCodeExport(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ×
            </button>
          </div>
          <div className="flex gap-2 mb-3">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
              className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
            >
              <option value="sdk">SDK</option>
              <option value="axios">HTTP (Axios)</option>
              <option value="curl">cURL</option>
            </select>
            <button
              onClick={handleExportCode}
              className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Copy Code
            </button>
          </div>
        </div>
      )}

      {/* Request History Panel */}
      {showHistory && (
        <div className="mb-6">
          <RequestHistory onReplay={handleReplay} />
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Method
        </label>
        <select
          value={selectedMethod}
          onChange={(e) => handleMethodChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white text-sm"
        >
          {SDK_METHODS.map((method) => (
            <option key={method.id} value={method.id}>
              {method.name}
            </option>
          ))}
        </select>
        {currentMethod && (
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            {currentMethod.description}
          </p>
        )}
      </div>

      {currentMethod && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {currentMethod.params.map((param) => (
            <div key={param.key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {param.label}
                {param.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {param.type === 'file' ? (
                <div>
                  <input
                    type="file"
                    multiple={selectedMethod === 'updateUsers'}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                  />
                  {files.length > 0 && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      {files.length} file(s) selected
                    </div>
                  )}
                  {param.key === 'profileImageFileIndex' && files.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                      Use index 0-{files.length - 1} to reference uploaded files
                    </p>
                  )}
                </div>
              ) : param.type === 'textarea' ? (
                <div>
                  <textarea
                    value={formData[param.key] || ''}
                    onChange={(e) => handleTextareaChange(param.key, e.target.value)}
                    onBlur={(e) => handleTextareaBlur(param.key, e.target.value)}
                    placeholder={typeof param.defaultValue === 'string' ? param.defaultValue : `Enter ${param.label.toLowerCase()}`}
                    required={!!param.required}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white text-sm font-mono"
                  />
                  {formData[param.key] && (() => {
                    const value = formData[param.key];
                    const trimmed = typeof value === 'string' ? value.trim() : '';
                    if (trimmed && (trimmed.startsWith('{') || trimmed.startsWith('['))) {
                      const validation = validateJSON(trimmed);
                      if (!validation.valid) {
                        return (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            ⚠️ Invalid JSON: {validation.error}
                          </p>
                        );
                      }
                      return (
                        <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                          ✓ Valid JSON (will auto-format on blur)
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
              ) : param.type === 'checkbox' ? (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData[param.key] ?? param.defaultValue ?? false}
                    onChange={(e) => handleInputChange(param.key, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {param.label}
                  </span>
                </div>
              ) : (
                <div>
                  <input
                    type={param.type}
                    value={formData[param.key] || ''}
                    onChange={(e) =>
                      handleInputChange(
                        param.key,
                        param.type === 'number' ? Number(e.target.value) : e.target.value
                      )
                    }
                    onBlur={(e) => validateField(param.key, e.target.value)}
                    placeholder={typeof param.defaultValue === 'string' ? param.defaultValue : `Enter ${param.label.toLowerCase()}`}
                    required={!!param.required}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white text-sm ${
                      fieldErrors[param.key]
                        ? 'border-red-300 dark:border-red-700'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {fieldErrors[param.key] && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {fieldErrors[param.key]}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* File upload section for createUser and updateUsers */}
          {(selectedMethod === 'createUser' || selectedMethod === 'updateUsers') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Profile Images (Optional)
              </label>
              <input
                type="file"
                multiple={selectedMethod === 'updateUsers'}
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white text-sm"
              />
              {files.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {files.length} file(s) selected:
                  </p>
                  <ul className="text-xs text-gray-500 dark:text-gray-500 list-disc list-inside">
                    {files.map((file, index) => (
                      <li key={index}>
                        {file.name} (index: {index})
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Use <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">profileImageFileIndex</code> field
                    with index 0-{files.length - 1} to assign images to users.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={autoGenerate}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-md transition-colors shadow-sm"
            >
              Auto Generate
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors shadow-sm hover:shadow"
            >
              {loading ? 'Executing...' : 'Execute'}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-red-800 dark:text-red-200 font-semibold">Error</h3>
            <button
              onClick={() => setError(null)}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-lg leading-none"
              aria-label="Close error"
            >
              ×
            </button>
          </div>
          {(error.url || error.requestUrl) && (
            <div className="mb-3 p-1.5 bg-red-100/50 dark:bg-red-900/30 rounded border border-red-200/50 dark:border-red-800/50 text-[10px] font-mono break-all text-red-800 dark:text-red-300">
              <span className="font-bold mr-1 uppercase">URL:</span> {error.url || error.requestUrl}
            </div>
          )}
          <p className="text-red-600 dark:text-red-300 text-sm mb-3">{error.error}</p>
          {error.code && (
            <p className="text-xs text-red-500 dark:text-red-400 mb-3">
              Error Code: <code className="bg-red-100 dark:bg-red-900/30 px-1 rounded">{error.code}</code>
            </p>
          )}
          {error.suggestions && error.suggestions.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-2">Suggestions:</p>
              <ul className="list-disc list-inside space-y-1">
                {error.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-xs text-red-600 dark:text-red-400">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {error.details && (
            <details className="mt-3">
              <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer hover:text-red-800 dark:hover:text-red-200">
                Show technical details
              </summary>
              <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs font-mono text-red-800 dark:text-red-200 overflow-x-auto">
                {error.details}
              </pre>
            </details>
          )}
        </div>
      )}

      {result && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-800 dark:text-gray-200 font-semibold">Result</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                }}
                className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded font-medium border border-gray-200 dark:border-gray-700 uppercase"
              >
                Copy
              </button>
            </div>
          </div>
          {(result.url || result.requestUrl) && (
            <div className="mb-2 p-1.5 bg-blue-50 dark:bg-blue-900/10 rounded border border-blue-100 dark:border-blue-900/20 text-[10px] font-mono break-all text-blue-700 dark:text-blue-400 uppercase">
              <span className="font-bold mr-1">URL:</span> {result.url || result.requestUrl}
            </div>
          )}
          <pre className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-x-auto text-xs font-mono text-green-700 dark:text-green-400">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {/* Response Logger */}
      {logs.length > 0 && (
        <div className="mt-6">
          <ResponseLogger
            logs={logs}
            onClear={() => setLogs([])}
          />
        </div>
      )}
    </div>
  );
}

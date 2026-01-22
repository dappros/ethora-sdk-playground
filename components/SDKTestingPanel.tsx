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
}

interface APIError {
  error: string;
  suggestions?: string[];
  code?: string;
  field?: string;
  details?: string;
}

interface MethodForm {
  method: string;
  params: Record<string, any>;
}

const SDK_METHODS = [
  {
    id: 'createChatRoom',
    name: 'Create Chat Room',
    description: 'Create a chat room for a workspace',
    params: [
      { key: 'workspaceId', label: 'Workspace ID', type: 'text', required: true },
      { key: 'title', label: 'Title', type: 'text', required: false },
      { key: 'type', label: 'Type', type: 'text', required: false, defaultValue: 'group' },
    ],
  },
  {
    id: 'createUser',
    name: 'Create User',
    description: 'Create a user in the chat service',
    params: [
      { key: 'userId', label: 'User ID', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'firstName', label: 'First Name', type: 'text', required: true },
      { key: 'lastName', label: 'Last Name', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'text', required: false },
      { key: 'uuid', label: 'UUID', type: 'text', required: false },
      { key: 'profileImage', label: 'Profile Image URL', type: 'text', required: false },
      { key: 'profileImageFileIndex', label: 'Profile Image File Index', type: 'number', required: false },
      { key: 'displayName', label: 'Display Name', type: 'text', required: false },
    ],
  },
  {
    id: 'grantUserAccessToChatRoom',
    name: 'Grant User Access',
    description: 'Grant a user access to a chat room',
    params: [
      { key: 'workspaceId', label: 'Workspace ID', type: 'text', required: true },
      { key: 'userId', label: 'User ID', type: 'text', required: true },
    ],
  },
  {
    id: 'grantChatbotAccessToChatRoom',
    name: 'Grant Chatbot Access',
    description: 'Grant chatbot access to a chat room',
    params: [
      { key: 'workspaceId', label: 'Workspace ID', type: 'text', required: true },
    ],
  },
  {
    id: 'createChatUserJwtToken',
    name: 'Create JWT Token',
    description: 'Generate a client JWT token for a user',
    params: [
      { key: 'userId', label: 'User ID', type: 'text', required: true },
    ],
  },
  {
    id: 'createChatName',
    name: 'Create Chat Name',
    description: 'Generate a chat room JID from workspace ID',
    params: [
      { key: 'workspaceId', label: 'Workspace ID', type: 'text', required: true },
      { key: 'full', label: 'Full JID', type: 'checkbox', required: false, defaultValue: true },
    ],
  },
  {
    id: 'deleteChatRoom',
    name: 'Delete Chat Room',
    description: 'Delete a chat room by workspace ID',
    params: [
      { key: 'workspaceId', label: 'Workspace ID', type: 'text', required: true },
    ],
  },
  {
    id: 'deleteUsers',
    name: 'Delete Users',
    description: 'Delete multiple users',
    params: [
      { key: 'userIds', label: 'User IDs (comma-separated)', type: 'text', required: true },
    ],
  },
  {
    id: 'getUsers',
    name: 'Get Users',
    description: 'Get users from the chat service',
    params: [
      { key: 'chatName', label: 'Chat Name (optional)', type: 'text', required: false },
      { key: 'xmppUsername', label: 'XMPP Username (optional)', type: 'text', required: false },
      { key: 'page', label: 'Page (optional)', type: 'number', required: false },
      { key: 'pageSize', label: 'Page Size (optional, max 500, default 100)', type: 'number', required: false },
    ],
  },
  {
    id: 'updateUsers',
    name: 'Update Users',
    description: 'Update multiple users (batch)',
    params: [
      { key: 'users', label: 'Users JSON Array', type: 'textarea', required: true },
    ],
  },
];

export default function SDKTestingPanel({ onExecute }: SDKTestingPanelProps) {
  const [selectedMethod, setSelectedMethod] = useState<SDKMethodName>(SDK_METHODS[0].id as SDKMethodName);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<APIError | null>(null);
  const [loading, setLoading] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [showCodeExport, setShowCodeExport] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('fetch');

  const currentMethod = SDK_METHODS.find((m) => m.id === selectedMethod);

  const handleMethodChange = (methodId: string) => {
    setSelectedMethod(methodId as SDKMethodName);
    setFormData({});
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
      } else if (param.key === 'workspaceId') {
        generated[param.key] = `workspace-${timestamp}-${randomId}`;
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
            },
            {
              email: `user2-${timestamp}@example.com`,
              firstName: 'Jane',
              lastName: 'Smith',
            },
          ],
          null,
          2
        );
      } else if (param.type === 'checkbox') {
        generated[param.key] = true;
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
    
    if (key === 'workspaceId' && value) {
      if (value.trim().length === 0) {
        errors[key] = 'Workspace ID is required';
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
      } else if (selectedMethod === 'createChatName') {
        params = {
          workspaceId: formData.workspaceId,
          full: formData.full !== undefined ? formData.full : true,
        };
      } else if (selectedMethod === 'createChatUserJwtToken') {
        params = { userId: formData.userId };
      } else if (selectedMethod === 'grantChatbotAccessToChatRoom') {
        params = { workspaceId: formData.workspaceId };
      } else if (selectedMethod === 'grantUserAccessToChatRoom') {
        params = {
          workspaceId: formData.workspaceId,
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
          workspaceId: formData.workspaceId,
          roomData: {
            ...(formData.title && { title: formData.title }),
            uuid: formData.workspaceId,
            type: formData.type || 'group',
          },
        };
      } else if (selectedMethod === 'deleteChatRoom') {
        params = { workspaceId: formData.workspaceId };
      }

      // Log request
      requestLog = {
        id: `req-${Date.now()}`,
        timestamp: Date.now(),
        type: 'request',
        method: selectedMethod,
        data: { method: selectedMethod, params, filesCount: files.length },
      };
      setLogs((prev) => [requestLog!, ...prev.slice(0, 49)]); // Keep last 50 logs

      // Send request with files if present
      const response = await onExecute(selectedMethod, params, files.length > 0 ? files : undefined);
      
      const endTime = Date.now();
      const elapsed = endTime - startTime;
      setResponseTime(elapsed);
      
      setResult(response);
      setError(null);

      // Log response
      const responseLog: LogEntry = {
        id: `res-${Date.now()}`,
        timestamp: Date.now(),
        type: 'response',
        method: selectedMethod,
        data: response,
        responseTime: elapsed,
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
      };
      setLogs((prev) => [errorLog, ...prev.slice(0, 49)]);
      // Parse structured error response
      if (err instanceof Error) {
        const errorWithExtras = err as Error & {
          suggestions?: string[];
          code?: string;
          field?: string;
          details?: string;
        };
        
        setError({
          error: errorWithExtras.message,
          suggestions: errorWithExtras.suggestions || [
            'Check that all required fields are filled',
            'Verify the data format is correct',
            'Review the error message for specific issues',
          ],
          code: errorWithExtras.code,
          field: errorWithExtras.field,
          details: errorWithExtras.details,
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
          } else if (selectedMethod === 'createChatName') {
            errorParams = {
              workspaceId: formData.workspaceId,
              full: formData.full !== undefined ? formData.full : true,
            };
          } else if (selectedMethod === 'createChatUserJwtToken') {
            errorParams = { userId: formData.userId };
          } else if (selectedMethod === 'grantChatbotAccessToChatRoom') {
            errorParams = { workspaceId: formData.workspaceId };
          } else if (selectedMethod === 'grantUserAccessToChatRoom') {
            errorParams = {
              workspaceId: formData.workspaceId,
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
              workspaceId: formData.workspaceId,
              roomData: {
                ...(formData.title && { title: formData.title }),
                uuid: formData.workspaceId,
                type: formData.type || 'group',
              },
            };
          } else if (selectedMethod === 'deleteChatRoom') {
            errorParams = { workspaceId: formData.workspaceId };
          }
        } catch {
          // If reconstruction fails, use empty object
        }
        
        saveRequestToHistory({
          method: selectedMethod,
          params: errorParams,
          error: errorWithExtras,
          success: false,
          responseTime: elapsed,
        });
      } else {
        setError({
          error: 'An unexpected error occurred',
          suggestions: [
            'Try again in a moment',
            'Check your network connection',
            'Verify the SDK is properly configured',
          ],
        });
      }
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
    } else {
      params = formData;
    }

    const code = exportRequest(
      {
        method: selectedMethod,
        params,
        files: files.length > 0 ? files : undefined,
      },
      exportFormat
    );

    // Copy to clipboard
    navigator.clipboard.writeText(code);
    alert('Code copied to clipboard!');
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
              <option value="fetch">Fetch</option>
              <option value="axios">Axios</option>
              <option value="curl">cURL</option>
              <option value="sdk">SDK Direct</option>
              <option value="complete">Complete Example</option>
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
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(result, null, 2));
              }}
              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
            >
              Copy
            </button>
          </div>
          <pre className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-x-auto text-xs font-mono">
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


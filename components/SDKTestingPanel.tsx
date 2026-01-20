'use client';

import React, { useState } from 'react';

interface SDKTestingPanelProps {
  onExecute: (method: string, params: any, files?: File[]) => Promise<any>;
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
  const [selectedMethod, setSelectedMethod] = useState<string>(SDK_METHODS[0].id);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const currentMethod = SDK_METHODS.find((m) => m.id === selectedMethod);

  const handleMethodChange = (methodId: string) => {
    setSelectedMethod(methodId);
    setFormData({});
    setFiles([]);
    setResult(null);
    setError(null);
  };

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Prepare params based on method
      let params: any = {};

      if (selectedMethod === 'deleteUsers') {
        params.userIds = formData.userIds
          ? formData.userIds.split(',').map((id: string) => id.trim())
          : [];
      } else if (selectedMethod === 'updateUsers') {
        try {
          params.users = JSON.parse(formData.users || '[]');
        } catch (e) {
          throw new Error('Invalid JSON format for users array');
        }
      } else if (selectedMethod === 'getUsers') {
        params = {};
        if (formData.chatName) params.chatName = formData.chatName;
        if (formData.xmppUsername) params.xmppUsername = formData.xmppUsername;
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

      // Send request with files if present
      const response = await onExecute(selectedMethod, params, files.length > 0 ? files : undefined);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-4 lg:px-6 pb-4 lg:pb-6 bg-white dark:bg-gray-900">
      <div className="mb-6 sticky top-0 bg-white dark:bg-gray-900 pt-4 lg:pt-6 pb-4 border-b border-gray-200 dark:border-gray-800 z-10">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-2">
          SDK Testing
        </h2>
        <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
          Test all SDK methods interactively
        </p>
      </div>

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
                <textarea
                  value={formData[param.key] || ''}
                  onChange={(e) => handleInputChange(param.key, e.target.value)}
                  placeholder={typeof param.defaultValue === 'string' ? param.defaultValue : `Enter ${param.label.toLowerCase()}`}
                  required={!!param.required}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white text-sm font-mono"
                />
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
                <input
                  type={param.type}
                  value={formData[param.key] || ''}
                  onChange={(e) =>
                    handleInputChange(
                      param.key,
                      param.type === 'number' ? Number(e.target.value) : e.target.value
                    )
                  }
                  placeholder={typeof param.defaultValue === 'string' ? param.defaultValue : `Enter ${param.label.toLowerCase()}`}
                  required={!!param.required}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                />
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
          <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error</h3>
          <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
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
    </div>
  );
}


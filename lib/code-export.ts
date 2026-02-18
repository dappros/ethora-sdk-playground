/**
 * Code export utilities for generating code snippets from requests
 */

export interface RequestData {
  method: string;
  params: any;
  files?: File[];
  baseUrl?: string;
  token?: string;
}

/**
 * Generate cURL command from request
 */
export function generateCurlCommand(request: RequestData, baseUrl: string = 'http://localhost:3000'): string {
  const url = `${baseUrl}/api/sdk`;
  const method = request.method;
  const params = request.params;
  const token = request.token;

  if (request.files && request.files.length > 0) {
    // Multipart form data
    const parts: string[] = token ? [`# Client JWT Token: ${token}`, `curl -X POST "${url}"`] : [`curl -X POST "${url}"`];

    // Add form fields
    parts.push(`  -F "method=${method}"`);
    parts.push(`  -F "params=${JSON.stringify(params)}"`);

    // Add files
    request.files.forEach((file, index) => {
      parts.push(`  -F "file_${index}=@${file.name}"`);
    });

    return parts.join(' \\\n');
  } else {
    // JSON request
    const jsonBody = JSON.stringify({ method, params }, null, 2);
    const tokenComment = token ? `# Client JWT Token: ${token}\n` : '';
    return `${tokenComment}curl -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -d '${jsonBody.replace(/'/g, "'\\''")}'`;
  }
}

/**
 * Generate fetch code from request
 */
export function generateFetchCode(request: RequestData, baseUrl: string = 'http://localhost:3000'): string {
  const url = `${baseUrl}/api/sdk`;
  const method = request.method;
  const params = request.params;
  const token = request.token;

  if (request.files && request.files.length > 0) {
    // Multipart form data
    return `${token ? `// Client JWT Token: ${token}\n` : ''}const formData = new FormData();
formData.append('method', '${method}');
formData.append('params', JSON.stringify(${JSON.stringify(params, null, 2)}));

${request.files.map((file, index) => `formData.append('file_${index}', file${index}); // ${file.name}`).join('\n')}

const response = await fetch('${url}', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
console.log(data);`;
  } else {
    // JSON request
    return `${token ? `// Client JWT Token: ${token}\n` : ''}const response = await fetch('${url}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    method: '${method}',
    params: ${JSON.stringify(params, null, 4)},
  }),
});

const data = await response.json();
console.log(data);`;
  }
}

/**
 * Generate axios code from request
 */
export function generateAxiosCode(request: RequestData, baseUrl: string = 'http://localhost:3000'): string {
  const url = `${baseUrl}/api/sdk`;
  const method = request.method;
  const params = request.params;
  const token = request.token;

  if (request.files && request.files.length > 0) {
    // Multipart form data
    return `${token ? `// Client JWT Token: ${token}\n` : ''}import axios from 'axios';

const formData = new FormData();
formData.append('method', '${method}');
formData.append('params', JSON.stringify(${JSON.stringify(params, null, 2)}));

${request.files.map((file, index) => `formData.append('file_${index}', file${index}); // ${file.name}`).join('\n')}

const response = await axios.post('${url}', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

console.log(response.data);`;
  } else {
    // JSON request
    return `${token ? `// Client JWT Token: ${token}\n` : ''}import axios from 'axios';

const response = await axios.post('${url}', {
  method: '${method}',
  params: ${JSON.stringify(params, null, 2)},
}, {
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log(response.data);`;
  }
}

/**
 * Generate TypeScript/JavaScript SDK code from request
 */
export function generateSDKCode(request: RequestData): string {
  const method = request.method;
  const params = request.params;
  const token = request.token;

  // Map method names to SDK calls
  const methodMap: Record<string, (params: any) => string> = {
    createChatRoom: (p) => `await sdk.createChatRoom('${p.chatId}', ${JSON.stringify(p.roomData, null, 2)});`,
    createUser: (p) => {
      const userDataStr = JSON.stringify(p.userData, null, 2);
      return `await sdk.createUser('${p.userId}', ${userDataStr});`;
    },
    grantUserAccessToChatRoom: (p) =>
      `await sdk.grantUserAccessToChatRoom('${p.chatId}', '${p.userId}');`,
    grantChatbotAccessToChatRoom: (p) => `await sdk.grantChatbotAccessToChatRoom('${p.chatId}');`,
    createChatUserJwtToken: (p) => `const token = sdk.createChatUserJwtToken('${p.userId}');`,
    createChatName: (p) =>
      `const chatName = sdk.createChatName('${p.chatId}', ${p.full !== false ? 'true' : 'false'});`,
    deleteChatRoom: (p) => `await sdk.deleteChatRoom('${p.chatId}');`,
    deleteUsers: (p) => `await sdk.deleteUsers(${JSON.stringify(p.userIds)});`,
    removeUserAccessFromChatRoom: (p) =>
      `await sdk.removeUserAccessFromChatRoom('${p.chatId}', ${JSON.stringify(p.userId)});`,
    getUsers: (p) => {
      const filter: any = {};
      if (p.chatName) filter.chatName = p.chatName;
      if (p.xmppUsername) filter.xmppUsername = p.xmppUsername;
      if (p.page !== undefined) filter.page = p.page;
      if (p.pageSize !== undefined) filter.pageSize = p.pageSize;
      if (Object.keys(filter).length > 0) {
        return `await sdk.getUsers(${JSON.stringify(filter)});`;
      }
      return `await sdk.getUsers();`;
    },
    updateUsers: (p) => `await sdk.updateUsers(${JSON.stringify(p.users, null, 2)});`,
    sendPushToUser: (p) => `await sdk.sendPushToUser('${p.userId}', ${JSON.stringify(p.data, null, 2)});`,
  };

  const generator = methodMap[method];
  let code = '';
  if (generator) {
    code = generator(params);
  } else {
    // Fallback for unknown methods
    code = `await sdk.${method}(${JSON.stringify(params, null, 2)});`;
  }

  // Add token comment if available
  if (token) {
    return `// Client JWT Token: ${token}\n${code}`;
  }
  return code;
}

/**
 * Generate complete code example with imports
 */
export function generateCompleteCodeExample(
  request: RequestData,
  language: 'typescript' | 'javascript' = 'typescript'
): string {
  const sdkCode = generateSDKCode(request);
  const token = request.token;
  const importStatement =
    language === 'typescript'
      ? "import { getSDKInstance } from '@ethora/sdk-backend';"
      : "const { getSDKInstance } = require('@ethora/sdk-backend');";

  return `${importStatement}

const sdk = getSDKInstance();

try {
  ${sdkCode}
  console.log('Success');
} catch (error) {
  console.error('Error:', error);
}`;
}

/**
 * Generate direct API call code (calls Ethora API directly with x-custom-token)
 */
function generateDirectAPICode(request: RequestData, apiUrl: string = 'https://api.ethoradev.com'): string {
  const method = request.method;
  const params = request.params;

  // Map SDK methods to API endpoints
  const apiEndpoints: Record<string, { endpoint: string; httpMethod: string }> = {
    updateUsers: { endpoint: '/v1/users', httpMethod: 'PATCH' },
    createUser: { endpoint: '/v1/users', httpMethod: 'POST' },
    getUsers: { endpoint: '/v1/users', httpMethod: 'GET' },
    deleteUsers: { endpoint: '/v1/users', httpMethod: 'DELETE' },
    createChatRoom: { endpoint: '/v1/chats/rooms', httpMethod: 'POST' },
    deleteChatRoom: { endpoint: '/v1/chats/rooms', httpMethod: 'DELETE' },
    grantUserAccessToChatRoom: { endpoint: '/v1/chats/users-access', httpMethod: 'POST' },
    sendPushToUser: { endpoint: '/v1/push/user/:userId', httpMethod: 'POST' },
  };

  const apiInfo = apiEndpoints[method];
  if (!apiInfo) {
    return `// Direct API call not available for method: ${method}\n// Use SDK or local API endpoint instead`;
  }

  const url = apiInfo.endpoint.includes(':') 
    ? `${apiUrl}${apiInfo.endpoint.replace(/:(\w+)/g, (_, key) => params[key] || `:${key}`)}`
    : `${apiUrl}${apiInfo.endpoint}`;
  const httpMethod = apiInfo.httpMethod;

  // Generate server-to-server token helper
  const tokenHelper = `// Generate server-to-server JWT token
// Requires: ETHORA_CHAT_APP_ID and ETHORA_CHAT_APP_SECRET environment variables
import jwt from 'jsonwebtoken';

async function generateServerToken(): Promise<string> {
  const appId = process.env.ETHORA_CHAT_APP_ID;
  const appSecret = process.env.ETHORA_CHAT_APP_SECRET;
  
  if (!appId || !appSecret) {
    throw new Error('ETHORA_CHAT_APP_ID and ETHORA_CHAT_APP_SECRET must be set');
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
  );
}`;

  // Generate request code based on method
  let requestCode = '';
  
  if (method === 'updateUsers') {
    // Remove email from users array for updateUsers
    const usersForAPI = params.users ? params.users.map((user: any) => {
      const { email, ...userWithoutEmail } = user;
      return userWithoutEmail;
    }) : [];
    
    requestCode = `async function updateUsers() {
  const xCustomToken = await generateServerToken();
  
  const response = await fetch('${url}', {
    method: '${httpMethod}',
    headers: {
      'Content-Type': 'application/json',
      'x-custom-token': xCustomToken,
    },
    body: JSON.stringify({
      users: ${JSON.stringify(usersForAPI, null, 6)},
    }),
  });

  const data = await response.json();
  console.log(data);
  return data;
}

updateUsers().catch(console.error);`;
  } else if (method === 'getUsers') {
    const queryParams = new URLSearchParams();
    if (params.chatName) queryParams.append('chatName', params.chatName);
    if (params.xmppUsername) queryParams.append('xmppUsername', params.xmppUsername);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    
    const queryString = queryParams.toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    
    requestCode = `async function getUsers() {
  const xCustomToken = await generateServerToken();
  
  const response = await fetch('${fullUrl}', {
    method: '${httpMethod}',
    headers: {
      'x-custom-token': xCustomToken,
    },
  });

  const data = await response.json();
  console.log(data);
  return data;
}

getUsers().catch(console.error);`;
  } else if (method === 'deleteUsers') {
    requestCode = `async function deleteUsers() {
  const xCustomToken = await generateServerToken();
  
  const response = await fetch('${url}', {
    method: '${httpMethod}',
    headers: {
      'Content-Type': 'application/json',
      'x-custom-token': xCustomToken,
    },
    body: JSON.stringify({
      userIds: ${JSON.stringify(params.userIds, null, 6)},
    }),
  });

  const data = await response.json();
  console.log(data);
  return data;
}

deleteUsers().catch(console.error);`;
  } else {
    requestCode = `async function ${method}() {
  const xCustomToken = await generateServerToken();
  
  const response = await fetch('${url}', {
    method: '${httpMethod}',
    headers: {
      'Content-Type': 'application/json',
      'x-custom-token': xCustomToken,
    },
    body: JSON.stringify(${JSON.stringify(params, null, 6)}),
  });

  const data = await response.json();
  console.log(data);
  return data;
}

${method}().catch(console.error);`;
  }

  return `${tokenHelper}

${requestCode}`;
}

/**
 * Get all available export formats
 */
export type ExportFormat = 'curl' | 'axios' | 'sdk';

export function exportRequest(
  request: RequestData,
  format: ExportFormat,
  baseUrl?: string,
  token?: string
): string {
  const requestWithToken = { ...request, token };
  switch (format) {
    case 'curl':
      return generateCurlCommand(requestWithToken, baseUrl);
    case 'axios':
      return generateAxiosCode(requestWithToken, baseUrl);
    case 'sdk':
      return generateSDKCode(requestWithToken);
    default:
      return generateSDKCode(requestWithToken);
  }
}

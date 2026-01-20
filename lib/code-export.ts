/**
 * Code export utilities for generating code snippets from requests
 */

export interface RequestData {
  method: string;
  params: any;
  files?: File[];
  baseUrl?: string;
}

/**
 * Generate cURL command from request
 */
export function generateCurlCommand(request: RequestData, baseUrl: string = 'http://localhost:3000'): string {
  const url = `${baseUrl}/api/sdk`;
  const method = request.method;
  const params = request.params;

  if (request.files && request.files.length > 0) {
    // Multipart form data
    const parts: string[] = [`curl -X POST "${url}"`];

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
    return `curl -X POST "${url}" \\
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

  if (request.files && request.files.length > 0) {
    // Multipart form data
    return `const formData = new FormData();
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
    return `const response = await fetch('${url}', {
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

  if (request.files && request.files.length > 0) {
    // Multipart form data
    return `import axios from 'axios';

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
    return `import axios from 'axios';

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

  // Map method names to SDK calls
  const methodMap: Record<string, (params: any) => string> = {
    createChatRoom: (p) => `await sdk.createChatRoom('${p.workspaceId}', ${JSON.stringify(p.roomData, null, 2)});`,
    createUser: (p) => {
      const userDataStr = JSON.stringify(p.userData, null, 2);
      return `await sdk.createUser('${p.userId}', ${userDataStr});`;
    },
    grantUserAccessToChatRoom: (p) =>
      `await sdk.grantUserAccessToChatRoom('${p.workspaceId}', '${p.userId}');`,
    grantChatbotAccessToChatRoom: (p) => `await sdk.grantChatbotAccessToChatRoom('${p.workspaceId}');`,
    createChatUserJwtToken: (p) => `const token = sdk.createChatUserJwtToken('${p.userId}');`,
    createChatName: (p) =>
      `const chatName = sdk.createChatName('${p.workspaceId}', ${p.full !== false ? 'true' : 'false'});`,
    deleteChatRoom: (p) => `await sdk.deleteChatRoom('${p.workspaceId}');`,
    deleteUsers: (p) => `await sdk.deleteUsers(${JSON.stringify(p.userIds)});`,
    getUsers: (p) => {
      const filter: any = {};
      if (p.chatName) filter.chatName = p.chatName;
      if (p.xmppUsername) filter.xmppUsername = p.xmppUsername;
      if (Object.keys(filter).length > 0) {
        return `await sdk.getUsers(${JSON.stringify(filter)});`;
      }
      return `await sdk.getUsers();`;
    },
    updateUsers: (p) => `await sdk.updateUsers(${JSON.stringify(p.users, null, 2)});`,
  };

  const generator = methodMap[method];
  if (generator) {
    return generator(params);
  }

  // Fallback for unknown methods
  return `await sdk.${method}(${JSON.stringify(params, null, 2)});`;
}

/**
 * Generate complete code example with imports
 */
export function generateCompleteCodeExample(
  request: RequestData,
  language: 'typescript' | 'javascript' = 'typescript'
): string {
  const sdkCode = generateSDKCode(request);
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
 * Get all available export formats
 */
export type ExportFormat = 'curl' | 'fetch' | 'axios' | 'sdk' | 'complete';

export function exportRequest(
  request: RequestData,
  format: ExportFormat,
  baseUrl?: string
): string {
  switch (format) {
    case 'curl':
      return generateCurlCommand(request, baseUrl);
    case 'fetch':
      return generateFetchCode(request, baseUrl);
    case 'axios':
      return generateAxiosCode(request, baseUrl);
    case 'sdk':
      return generateSDKCode(request);
    case 'complete':
      return generateCompleteCodeExample(request);
    default:
      return generateFetchCode(request, baseUrl);
  }
}

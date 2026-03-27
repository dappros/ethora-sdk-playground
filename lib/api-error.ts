export interface NormalizedApiError {
  success?: false;
  error: string;
  message?: string;
  code?: string;
  details?: unknown;
  status?: number;
  statusText?: string;
  requestId?: string;
  url?: string;
  requestUrl?: string;
  suggestions?: string[];
  field?: string;
  responseData?: unknown;
  backendResponse?: unknown;
}

export async function parseResponsePayload(response: Response): Promise<unknown> {
  const text = await response.text().catch(() => "");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

export function normalizeApiError(raw: unknown, fallback = "Request failed"): NormalizedApiError {
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, any>;
    const nested =
      (obj.responseData && typeof obj.responseData === "object" ? obj.responseData : undefined) ||
      (obj.backendResponse && typeof obj.backendResponse === "object" ? obj.backendResponse : undefined) ||
      (obj.data && typeof obj.data === "object" ? obj.data : undefined);
    const nestedObj = (nested || {}) as Record<string, any>;

    const message =
      obj.error ||
      obj.message ||
      nestedObj.error ||
      nestedObj.message ||
      fallback;

    return {
      success: false,
      error: String(message),
      message: String(message),
      code: obj.code || nestedObj.code,
      details: obj.details ?? nestedObj.details,
      status: obj.status || nestedObj.status,
      statusText: obj.statusText || nestedObj.statusText,
      requestId: obj.requestId || nestedObj.requestId,
      url: obj.url || nestedObj.url,
      requestUrl: obj.requestUrl || nestedObj.requestUrl,
      suggestions: obj.suggestions || nestedObj.suggestions,
      field: obj.field || nestedObj.field,
      responseData: obj.responseData ?? nested,
      backendResponse: obj.backendResponse ?? nested,
    };
  }

  if (raw instanceof Error) {
    return {
      success: false,
      error: raw.message || fallback,
      message: raw.message || fallback,
    };
  }

  return {
    success: false,
    error: String(raw || fallback),
    message: String(raw || fallback),
  };
}

export function formatApiErrorMessage(error: NormalizedApiError): string {
  const parts = [error.error || error.message || "Request failed"];
  if (error.code) parts.push(`Code: ${error.code}`);
  if (error.status) parts.push(`Status: ${error.status}`);
  if (error.requestId) parts.push(`Request ID: ${error.requestId}`);
  return parts.join(" | ");
}

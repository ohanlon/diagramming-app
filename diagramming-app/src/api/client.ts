/**
 * Centralized API client for making authenticated requests
 * Handles token refresh and provides typed request/response
 */

import { useDiagramStore } from '../store/useDiagramStore';

export interface ApiError {
  message: string;
  status: number;
  data?: unknown;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Get the base server URL
 */
export function getServerUrl(): string {
  return useDiagramStore.getState().serverUrl || 'http://localhost:4000';
}

/**
 * Make an authenticated API request with automatic token refresh
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const serverUrl = getServerUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${serverUrl}${endpoint}`;
  const headersInit = options.headers;
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  let headers: HeadersInit;
  if (headersInit instanceof Headers) {
    headers = new Headers(headersInit);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  } else if (Array.isArray(headersInit)) {
    const headerPairs = [...headersInit];
    if (!headerPairs.some(([key]) => key.toLowerCase() === 'content-type')) {
      headerPairs.push(['Content-Type', 'application/json']);
    }
    headers = headerPairs;
  } else {
    headers = { ...defaultHeaders, ...(headersInit as Record<string, string> | undefined) };
  }

  // Ensure credentials are included by default
  const requestOptions: RequestInit = {
    credentials: 'include',
    ...options,
    headers,
  };

  const body = options.body;
  if (body instanceof FormData) {
    if (requestOptions.headers instanceof Headers) {
      requestOptions.headers.delete('Content-Type');
    } else if (Array.isArray(requestOptions.headers)) {
      requestOptions.headers = requestOptions.headers.filter(([key]) => key.toLowerCase() !== 'content-type');
    } else if (requestOptions.headers && typeof requestOptions.headers === 'object') {
      delete (requestOptions.headers as Record<string, string>)['Content-Type'];
    }
  }

  try {
    let response = await fetch(url, requestOptions);

    // Handle 401 - attempt token refresh
    if (response.status === 401) {
      const refreshSuccess = await refreshToken();
      
      if (refreshSuccess) {
        // Retry original request after successful refresh
        response = await fetch(url, requestOptions);
      } else {
        // Refresh failed - redirect to login
        handleAuthFailure();
        throw new ApiClientError('Authentication required', 401);
      }
    }

    // Handle non-2xx responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Log detailed error information for debugging
      console.error('[API Error]', {
        url,
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        requestBody: requestOptions.body,
      });
      
      throw new ApiClientError(
        errorData.error || errorData.message || `Request failed with status ${response.status}`,
        response.status,
        errorData
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    // Parse and return JSON response
    return await response.json();
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new ApiClientError(
      error instanceof Error ? error.message : 'Network error',
      0,
      error
    );
  }
}

/**
 * Attempt to refresh the authentication token
 */
async function refreshToken(): Promise<boolean> {
  try {
    const serverUrl = getServerUrl();
    const response = await fetch(`${serverUrl}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (response.ok) return true;
    if (response.status === 401) return false;
    return false;
  } catch (error) {
    console.warn('Token refresh failed:', error);
    return false;
  }
}

/**
 * Handle authentication failure by redirecting to login
 */
function handleAuthFailure(): void {
  try {
    useDiagramStore.setState({ lastSaveError: 'Authentication required' } as any);
  } catch (e) {
    // ignore
  }
  
  try {
    // Only redirect if not already on login/register page
    const currentPath = window.location.pathname;
    if (currentPath !== '/login' && currentPath !== '/register') {
      window.location.href = '/login';
    }
  } catch (e) {
    // ignore
  }
}

/**
 * Convenience methods for common HTTP methods
 */
export const api = {
  get: <T = unknown>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = unknown>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = unknown>(endpoint: string, data?: unknown, customHeaders?: Record<string, string>, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      headers: {
        ...options?.headers,
        ...customHeaders,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = unknown>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = unknown>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

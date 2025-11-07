import { useDiagramStore } from '../store/useDiagramStore';

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit, options?: { retryOn401?: boolean }) {
  const serverUrl = useDiagramStore.getState().serverUrl || 'http://localhost:4000';
  const retryOn401 = options?.retryOn401 ?? true;

  // Ensure credentials included by default
  const mergedInit: RequestInit = { credentials: 'include', ...(init || {}) };

  // For retry we need to preserve body if it's a stringifiable value. We assume callers pass serialized bodies where needed.
  let response: Response;
  try {
    response = await fetch(input, mergedInit);
  } catch (e) {
    throw e;
  }

  if (response.status !== 401 || !retryOn401) return response;

  // Attempt refresh once silently. If refresh succeeds, retry the original request.
  try {
    // Cookie-based refresh: no Authorization header needed
    const refreshResp = await fetch(`${serverUrl}/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (refreshResp.ok) {
      // Retry original request once after successful refresh
      const retryResp = await fetch(input, mergedInit);
      return retryResp;
    }

    // If refresh failed due to unauthorized (401) it means the user has been logged out
    // (refresh revoked/expired). In that case redirect to login so user can re-authenticate.
    // Do NOT auto-redirect on 403 (forbidden) because that often indicates a permission
    // issue for the requested resource and should not terminate the user's session.
    if (refreshResp.status === 401) {
      try {
        useDiagramStore.setState({ lastSaveError: 'Authentication required' } as any);
      } catch (e) {
        // ignore
      }
      try {
        window.location.href = '/login';
      } catch (e) {
        // ignore
      }
      return response;
    }

    // If the refresh returned 403 (forbidden) treat it as a permission issue for the
    // refresh operation and do NOT force a redirect to login. Return the original
    // response so callers can handle 403 as appropriate (e.g. show a 403 page or
    // redirect locally to dashboard without logging the user out).
    if (refreshResp.status === 403) {
      return response;
    }

    // For other refresh failures (e.g., server error), do not redirect — return the original 401 response
    return response;
  } catch (e) {
    // Network or unexpected error during refresh — don't redirect; surface original 401 to caller
    console.warn('Refresh attempt failed', e);
    return response;
  }
}

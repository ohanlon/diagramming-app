export type JwtPayload = {
  exp?: number;
  iat?: number;
  [key: string]: any;
};

function base64UrlDecode(input: string): string {
  try {
    const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 === 2 ? '==' : b64.length % 4 === 3 ? '=' : '';
    const fixed = b64 + pad;
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      return decodeURIComponent(
        Array.prototype.map
          .call(window.atob(fixed), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    }
    // Node.js fallback
    return Buffer.from(fixed, 'base64').toString('utf8');
  } catch (_e) {
    return '';
  }
}

export function decodeJwt(token: string): JwtPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payloadJson = base64UrlDecode(parts[1]);
    if (!payloadJson) return null;
    return JSON.parse(payloadJson);
  } catch (_e) {
    return null;
  }
}

export function isJwtExpired(token: string, skewSeconds: number = 0): boolean {
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== 'number') return true; // if no exp, treat as expired
  const nowSec = Math.floor(Date.now() / 1000);
  return nowSec >= (payload.exp - skewSeconds);
}

import { AuthTokens } from "@/types";

const ACCESS_TOKEN_KEY = "aios_access_token";
const REFRESH_TOKEN_KEY = "aios_refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(tokens: AuthTokens): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string;
  iat: number;
  exp: number;
}

export function decodeJWT(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload) return true;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

export function getTokenExpiresIn(token: string): number {
  const payload = decodeJWT(token);
  if (!payload) return 0;
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, payload.exp - now);
}

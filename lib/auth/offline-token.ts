import { createHmac, timingSafeEqual } from "node:crypto";

import type { SessionUser, UserRole } from "@/lib/auth/user";

const TOKEN_TTL_SECONDS = 45 * 24 * 60 * 60;

type OfflineSessionPayload = SessionUser & {
  exp: number;
  iat: number;
};

const isUserRole = (value: unknown): value is UserRole =>
  value === "admin" || value === "dueno" || value === "empleado";

const isSessionUserPayload = (
  value: unknown,
): value is OfflineSessionPayload => {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;

  return (
    typeof payload.id === "string" &&
    typeof payload.username === "string" &&
    typeof payload.name === "string" &&
    typeof payload.isAdmin === "boolean" &&
    typeof payload.iat === "number" &&
    typeof payload.exp === "number" &&
    isUserRole(payload.role) &&
    (typeof payload.email === "string" || payload.email === null)
  );
};

const getSecret = () => {
  const secret =
    process.env.ERP_OFFLINE_SESSION_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "";

  if (!secret) {
    throw new Error("Falta la clave para sesiones offline");
  }

  return secret;
};

const toBase64Url = (value: Buffer | string) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const fromBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(`${normalized}${padding}`, "base64");
};

const sign = (payloadPart: string) =>
  toBase64Url(createHmac("sha256", getSecret()).update(payloadPart).digest());

export const createOfflineSessionToken = (user: SessionUser) => {
  const now = Math.floor(Date.now() / 1000);
  const payload: OfflineSessionPayload = {
    ...user,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  };
  const payloadPart = toBase64Url(JSON.stringify(payload));
  return `${payloadPart}.${sign(payloadPart)}`;
};

export const getOfflineSessionUserFromToken = (
  token?: string | null,
): SessionUser | null => {
  if (!token) return null;

  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) return null;

  const expectedSignature = sign(payloadPart);
  const received = Buffer.from(signaturePart);
  const expected = Buffer.from(expectedSignature);
  if (
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(payloadPart).toString("utf8"));
    if (!isSessionUserPayload(payload)) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return {
      id: payload.id,
      email: payload.email,
      username: payload.username,
      name: payload.name,
      isAdmin: payload.isAdmin,
      role: payload.role,
    };
  } catch {
    return null;
  }
};

export const getOfflineSessionUserFromHeaders = (headers: Headers) =>
  getOfflineSessionUserFromToken(headers.get("x-erp-offline-session"));

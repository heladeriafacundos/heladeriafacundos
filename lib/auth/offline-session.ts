import type { SessionUser, UserRole } from "@/lib/auth/user";

type PasswordVerifier = {
  hash: string;
  iterations: number;
  salt: string;
};

type OfflineUserRecord = {
  syncToken?: string;
  updatedAt: string;
  user: SessionUser;
  verifier?: PasswordVerifier;
};

const CURRENT_SESSION_STORAGE_KEY = "gestion-local.sesion-offline";
const OFFLINE_USERS_STORAGE_KEY = "gestion-local.usuarios-offline";
const PASSWORD_HASH_ITERATIONS = 120000;

const isBrowser = () => typeof window !== "undefined";

const isUserRole = (value: unknown): value is UserRole =>
  value === "admin" || value === "dueno" || value === "empleado";

const isSessionUser = (value: unknown): value is SessionUser => {
  if (!value || typeof value !== "object") return false;
  const user = value as Record<string, unknown>;

  return (
    typeof user.id === "string" &&
    typeof user.username === "string" &&
    typeof user.name === "string" &&
    typeof user.isAdmin === "boolean" &&
    isUserRole(user.role) &&
    (typeof user.email === "string" || user.email === null)
  );
};

const normalizeLogin = (value: string) => value.trim().toLowerCase();

const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
};

const base64ToBytes = (value: string) => {
  const binary = window.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

const timingSafeEqual = (left: string, right: string) => {
  if (left.length !== right.length) return false;

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
};

const derivePasswordHash = async (
  password: string,
  salt: Uint8Array,
  iterations: number,
) => {
  if (!isBrowser() || !window.crypto?.subtle) {
    throw new Error("El inicio offline no esta disponible en este equipo");
  }

  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const saltBuffer = new Uint8Array(salt).buffer;
  const bits = await window.crypto.subtle.deriveBits(
    {
      hash: "SHA-256",
      iterations,
      name: "PBKDF2",
      salt: saltBuffer,
    },
    keyMaterial,
    256,
  );

  return bytesToBase64(new Uint8Array(bits));
};

const createPasswordVerifier = async (
  password: string,
): Promise<PasswordVerifier> => {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  return {
    hash: await derivePasswordHash(password, salt, PASSWORD_HASH_ITERATIONS),
    iterations: PASSWORD_HASH_ITERATIONS,
    salt: bytesToBase64(salt),
  };
};

const verifyPassword = async (password: string, verifier: PasswordVerifier) => {
  const hash = await derivePasswordHash(
    password,
    base64ToBytes(verifier.salt),
    verifier.iterations,
  );
  return timingSafeEqual(hash, verifier.hash);
};

export const getOfflineUsers = () => {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(OFFLINE_USERS_STORAGE_KEY);
    if (!raw) return [];

    const records = JSON.parse(raw) as OfflineUserRecord[];
    if (!Array.isArray(records)) return [];

    return records
      .filter(
        (record): record is OfflineUserRecord =>
          Boolean(record) &&
          typeof record === "object" &&
          typeof record.updatedAt === "string" &&
          isSessionUser((record as OfflineUserRecord).user),
      )
      .sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() -
          new Date(left.updatedAt).getTime(),
      );
  } catch {
    return [];
  }
};

const saveOfflineUsers = (records: OfflineUserRecord[]) => {
  window.localStorage.setItem(OFFLINE_USERS_STORAGE_KEY, JSON.stringify(records));
};

export const setCurrentOfflineSession = (user: SessionUser) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(CURRENT_SESSION_STORAGE_KEY, user.id);
};

export const clearCurrentOfflineSession = () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(CURRENT_SESSION_STORAGE_KEY);
};

export const getCurrentOfflineSession = () => {
  if (!isBrowser()) return null;

  try {
    const currentId = window.localStorage.getItem(CURRENT_SESSION_STORAGE_KEY);
    if (!currentId) return null;

    return getOfflineUsers().find((record) => record.user.id === currentId)?.user ?? null;
  } catch {
    clearCurrentOfflineSession();
    return null;
  }
};

export const getCurrentOfflineSyncToken = () => {
  if (!isBrowser()) return null;

  try {
    const currentId = window.localStorage.getItem(CURRENT_SESSION_STORAGE_KEY);
    if (!currentId) return null;

    return (
      getOfflineUsers().find((record) => record.user.id === currentId)
        ?.syncToken ?? null
    );
  } catch {
    return null;
  }
};

export const rememberOfflineSession = async (
  user: SessionUser,
  password?: string,
  syncToken?: string,
) => {
  if (!isBrowser()) return;

  const records = getOfflineUsers();
  const existing = records.find((record) => record.user.id === user.id);
  const verifier = password
    ? await createPasswordVerifier(password)
    : existing?.verifier;
  const nextRecord: OfflineUserRecord = {
    syncToken: syncToken ?? existing?.syncToken,
    updatedAt: new Date().toISOString(),
    user,
    ...(verifier ? { verifier } : {}),
  };

  saveOfflineUsers([
    nextRecord,
    ...records.filter((record) => record.user.id !== user.id),
  ]);
  setCurrentOfflineSession(user);
};

export const authenticateOfflineUser = async (
  login: string,
  password: string,
) => {
  const normalizedLogin = normalizeLogin(login);
  const record = getOfflineUsers().find((item) => {
    const username = normalizeLogin(item.user.username);
    const email = item.user.email ? normalizeLogin(item.user.email) : "";
    return username === normalizedLogin || email === normalizedLogin;
  });

  if (!record) {
    throw new Error("Ese usuario todavia no tiene acceso offline en esta PC");
  }

  if (!record.verifier) {
    setCurrentOfflineSession(record.user);
    return record.user;
  }

  const isValidPassword = await verifyPassword(password, record.verifier);
  if (!isValidPassword) {
    throw new Error("Usuario o contrasena incorrectos");
  }

  setCurrentOfflineSession(record.user);
  return record.user;
};

import type { AppData } from "../types";

const STORAGE_KEY = "pms_data_v1";
const SESSION_KEY = "pms_session_v1";

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    return JSON.parse(raw);
  } catch {
    return emptyData();
  }
}

export function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function emptyData(): AppData {
  return {
    users: [],
    companies: [],
    contracts: [],
    orders: [],
    vendors: [],
    auditLogs: [],
    inventoryItems: [],
    inventoryMovements: [],
  };
}

export function saveSession(userId: string) {
  const session = {
    userId,
    expiresAt: Date.now() + 1000 * 60 * 60 * 8, // 8 hours
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadSession(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session.expiresAt < Date.now()) {
      clearSession();
      return null;
    }
    return session.userId;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function hashPassword(password: string, salt = "pms_salt_v1"): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

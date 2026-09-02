import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { AppData, User, AuditLog } from "../types";
import { loadData, saveData, loadSession, saveSession, clearSession, hashPassword, uid } from "../utils/storage";
import { seedInitialData } from "../utils/seed";

interface AppContextValue {
  data: AppData;
  currentUser: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateData: (updater: (d: AppData) => AppData, audit?: Omit<AuditLog, "id" | "userId" | "username" | "timestamp">) => void;
  resetData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize: seed if empty, restore session
  useEffect(() => {
    (async () => {
      let initialData = loadData();
      if (initialData.users.length === 0) {
        initialData = await seedInitialData();
        saveData(initialData);
        setData(initialData);
      }
      const userId = loadSession();
      if (userId) {
        const u = initialData.users.find((u) => u.id === userId);
        if (u && u.active) setCurrentUser(u);
        else clearSession();
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const user = data.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
      if (!user) return { ok: false, error: "د کارن نوم یا پټنوم تېروتی دی / Invalid username or password" };
      if (!user.active) return { ok: false, error: "ستاسو حساب غیرفعال دی / Your account is inactive" };
      const hash = await hashPassword(password);
      if (hash !== user.passwordHash)
        return { ok: false, error: "د کارن نوم یا پټنوم تېروتی دی / Invalid username or password" };

      const updated: User = { ...user, lastLogin: new Date().toISOString() };
      const newData: AppData = {
        ...data,
        users: data.users.map((u) => (u.id === user.id ? updated : u)),
        auditLogs: [
          {
            id: uid("log"),
            userId: user.id,
            username: user.username,
            action: "login",
            entity: "auth",
            details: "User logged in",
            timestamp: new Date().toISOString(),
          },
          ...data.auditLogs,
        ].slice(0, 500),
      };
      saveData(newData);
      setData(newData);
      saveSession(user.id);
      setCurrentUser(updated);
      return { ok: true };
    },
    [data]
  );

  const logout = useCallback(() => {
    if (currentUser) {
      const newData: AppData = {
        ...data,
        auditLogs: [
          {
            id: uid("log"),
            userId: currentUser.id,
            username: currentUser.username,
            action: "logout",
            entity: "auth",
            details: "User logged out",
            timestamp: new Date().toISOString(),
          },
          ...data.auditLogs,
        ].slice(0, 500),
      };
      saveData(newData);
      setData(newData);
    }
    clearSession();
    setCurrentUser(null);
  }, [currentUser, data]);

  const updateData = useCallback(
    (updater: (d: AppData) => AppData, audit?: Omit<AuditLog, "id" | "userId" | "username" | "timestamp">) => {
      setData((prev) => {
        let next = updater(prev);
        if (audit && currentUser) {
          next = {
            ...next,
            auditLogs: [
              {
                id: uid("log"),
                userId: currentUser.id,
                username: currentUser.username,
                timestamp: new Date().toISOString(),
                ...audit,
              },
              ...next.auditLogs,
            ].slice(0, 500),
          };
        }
        saveData(next);
        return next;
      });
    },
    [currentUser]
  );

  const resetData = useCallback(async () => {
    const fresh = await seedInitialData();
    saveData(fresh);
    setData(fresh);
    clearSession();
    setCurrentUser(null);
  }, []);

  return (
    <AppContext.Provider value={{ data, currentUser, loading, login, logout, updateData, resetData }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

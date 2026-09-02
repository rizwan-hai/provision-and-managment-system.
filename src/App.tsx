import { useState } from "react";
import { AppProvider, useApp } from "./contexts/AppContext";
import { I18nProvider } from "./contexts/I18nContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./contexts/ToastContext";
import Login from "./pages/Login";
import Layout, { type PageKey } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import Contracts from "./pages/Contracts";
import Orders from "./pages/Orders";
import Inventory from "./pages/Inventory";
import Vendors from "./pages/Vendors";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Audit from "./pages/Audit";
import Backup from "./pages/Backup";
import Settings from "./pages/Settings";

function Shell() {
  const { currentUser, loading } = useApp();
  const [page, setPage] = useState<PageKey>("dashboard");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return <Login />;

  return (
    <Layout current={page} onNavigate={setPage}>
      {page === "dashboard" && <Dashboard onNavigate={setPage} />}
      {page === "companies" && <Companies />}
      {page === "contracts" && <Contracts />}
      {page === "orders" && <Orders />}
      {page === "inventory" && <Inventory />}
      {page === "vendors" && <Vendors />}
      {page === "reports" && <Reports />}
      {page === "users" && currentUser.role === "admin" && <Users />}
      {page === "audit" && currentUser.role === "admin" && <Audit />}
      {page === "backup" && <Backup />}
      {page === "settings" && <Settings />}
    </Layout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <ThemeProvider>
        <I18nProvider>
          <AppProvider>
            <Shell />
          </AppProvider>
        </I18nProvider>
      </ThemeProvider>
    </ToastProvider>
  );
}

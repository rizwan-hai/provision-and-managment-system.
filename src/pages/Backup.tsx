import { useState, useRef } from "react";
import { useApp } from "../contexts/AppContext";
import { useToast } from "../contexts/ToastContext";
import { Button, Card, ConfirmModal } from "../components/ui";
import { downloadJson, saveData } from "../utils/storage";

export default function Backup() {
  const { data, updateData, resetData, currentUser } = useApp();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmImport, setConfirmImport] = useState<unknown | null>(null);

  function handleExport() {
    const filename = `pms-backup-${new Date().toISOString().slice(0, 10)}.json`;
    downloadJson(data, filename);
    toast("بیک اپ ډاونلوډ شو / Backup downloaded", "success");
    updateData((d) => d, { action: "backup", entity: "system", details: filename });
  }

  function handleExportCsv(entity: "companies" | "contracts" | "orders" | "vendors") {
    const rows = data[entity] as unknown as Record<string, unknown>[];
    if (rows.length === 0) {
      toast("هیڅ معلومات نشته / No data to export", "warning");
      return;
    }
    const keys = Object.keys(rows[0]).filter((k) => !["violations"].includes(k));
    const csv = [
      keys.join(","),
      ...rows.map((r) => keys.map((k) => JSON.stringify(r[k] ?? "")).join(",")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${entity}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`${entity} CSV ډاونلوډ شو`, "success");
  }

  function handleImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed.users || !Array.isArray(parsed.users)) throw new Error("Invalid format");
        setConfirmImport(parsed);
      } catch {
        toast("د فایل ډول اشتباه دی / Invalid backup file", "error");
      }
    };
    reader.readAsText(file);
  }

  const sizes = {
    companies: data.companies.length,
    contracts: data.contracts.length,
    orders: data.orders.length,
    vendors: data.vendors.length,
    users: data.users.length,
    auditLogs: data.auditLogs.length,
  };
  const totalRecords = Object.values(sizes).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">د سیستم بیک اپ او بیا رغول</h2>
        <p className="text-sm text-slate-500 mt-1">Full system backup & restore · د ټولو معلوماتو خوندیتوب</p>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(sizes).map(([k, v]) => (
            <div key={k} className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{v}</p>
              <p className="text-xs text-slate-500 capitalize mt-1">{k}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-900">
          📊 مجموعي ریکارډونه: <strong className="tabular-nums">{totalRecords}</strong>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-6">
          <div className="text-3xl mb-3">📤</div>
          <h3 className="text-base font-semibold text-slate-900">د ټول سیستم بیک اپ</h3>
          <p className="text-sm text-slate-500 mt-1">د JSON فایل په توګه د ټولو معلوماتو بیک اپ واخلئ. دا کار باید په منظمه توګه ترسره شي.</p>
          <Button onClick={handleExport} icon={<span>💾</span>} className="mt-4">
            JSON بیک اپ ډاونلوډ کړئ
          </Button>
          <div className="mt-5 pt-5 border-t border-slate-200 space-y-2">
            <p className="text-xs font-semibold text-slate-700 uppercase">CSV Export</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => handleExportCsv("companies")}>شرکتونه CSV</Button>
              <Button size="sm" variant="secondary" onClick={() => handleExportCsv("contracts")}>قراردادونه CSV</Button>
              <Button size="sm" variant="secondary" onClick={() => handleExportCsv("orders")}>سپارښتنې CSV</Button>
              <Button size="sm" variant="secondary" onClick={() => handleExportCsv("vendors")}>وېنډرونه CSV</Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-3xl mb-3">📥</div>
          <h3 className="text-base font-semibold text-slate-900">د بیک اپ بیا رغول</h3>
          <p className="text-sm text-slate-500 mt-1">د مخکیني JSON بیک اپ فایل اپلوډ کړئ. ⚠ موجوده معلومات به ولاړ شي.</p>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportFile(f);
              e.target.value = "";
            }}
          />
          <Button onClick={() => fileRef.current?.click()} variant="secondary" icon={<span>📁</span>} className="mt-4">
            د بیک اپ فایل غوره کړئ
          </Button>
          {currentUser?.role === "admin" && (
            <div className="mt-5 pt-5 border-t border-slate-200">
              <p className="text-xs font-semibold text-red-700 uppercase">د خطر زون / Danger zone</p>
              <p className="text-xs text-slate-500 mt-1">دا کار ټول معلومات حذف کوي او سیستم بیا له پیله پیلوي.</p>
              <Button variant="danger" onClick={() => setConfirmReset(true)} className="mt-3" icon={<span>⚠</span>}>
                ټول سیستم ریسیټ کړئ
              </Button>
            </div>
          )}
        </Card>
      </div>

      <ConfirmModal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={async () => { await resetData(); toast("سیستم ریسیټ شو / System reset", "warning"); }}
        title="د سیستم ریسیټ"
        message="آیا تاسو ډاډه یاست؟ ټول معلومات به حذف شي او سیستم به بیرته د ازموینې حالت ته راګرځي. دا عمل غیرقابل د راګرځولو دی!"
        confirmText="هو، ریسیټ کړئ"
      />

      <ConfirmModal
        open={!!confirmImport}
        onClose={() => setConfirmImport(null)}
        onConfirm={() => {
          if (confirmImport) {
            saveData(confirmImport as never);
            updateData(() => confirmImport as never, { action: "restore", entity: "system", details: "Backup restored" });
            toast("بیک اپ بیا راغوښتل شو / Backup restored", "success");
            setTimeout(() => window.location.reload(), 600);
          }
        }}
        title="د بیک اپ بیا رغول"
        message="آیا غواړئ موجوده معلومات د دې بیک اپ فایل سره ځای ناستي کړئ؟ دا عمل غیرقابل د راګرځولو دی!"
        confirmText="بیا راغواړه / Restore"
      />
    </div>
  );
}

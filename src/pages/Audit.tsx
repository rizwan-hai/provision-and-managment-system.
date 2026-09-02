import { useState, useMemo } from "react";
import { useApp } from "../contexts/AppContext";
import { Card, Input, Badge, EmptyState, Select } from "../components/ui";

const ACTION_TONE: Record<string, "green" | "blue" | "amber" | "red" | "violet" | "slate"> = {
  create: "green",
  update: "blue",
  delete: "red",
  login: "violet",
  logout: "slate",
  backup: "amber",
  restore: "amber",
  blacklist: "red",
  unblacklist: "green",
  add_violation: "amber",
  reset_password: "red",
};

export default function Audit() {
  const { data } = useApp();
  const [q, setQ] = useState("");
  const [entity, setEntity] = useState("all");
  const [action, setAction] = useState("all");

  const entities = useMemo(() => Array.from(new Set(data.auditLogs.map((l) => l.entity))).sort(), [data.auditLogs]);
  const actions = useMemo(() => Array.from(new Set(data.auditLogs.map((l) => l.action))).sort(), [data.auditLogs]);

  const filtered = useMemo(() => {
    return data.auditLogs.filter((l) => {
      if (entity !== "all" && l.entity !== entity) return false;
      if (action !== "all" && l.action !== action) return false;
      if (q) {
        const s = q.toLowerCase();
        if (!l.username.toLowerCase().includes(s) && !l.details.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [data.auditLogs, q, entity, action]);

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input placeholder="🔍 د کاروونکي نوم یا توضیحاتو پسې لټون..." value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 min-w-[240px]" />
          <Select value={entity} onChange={(e) => setEntity(e.target.value)}>
            <option value="all">ټولې برخې</option>
            {entities.map((e) => <option key={e} value={e}>{e}</option>)}
          </Select>
          <Select value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="all">ټول عملونه</option>
            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
        </div>
        <p className="text-xs text-slate-500 mt-3">د سیستم ټول عملونه چې تر اوسه د کاروونکو لخوا ترسره شوي. وروستي ۵۰۰ ریکارډونه ساتل کیږي.</p>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon="📜" title="هیڅ لاګ نشته" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold">وخت / Time</th>
                  <th className="text-right px-4 py-3 font-semibold">کاروونکی</th>
                  <th className="text-right px-4 py-3 font-semibold">عمل</th>
                  <th className="text-right px-4 py-3 font-semibold">برخه</th>
                  <th className="text-right px-4 py-3 font-semibold">توضیحات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs text-slate-600 tabular-nums">{new Date(l.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">@{l.username}</td>
                    <td className="px-4 py-3"><Badge tone={ACTION_TONE[l.action] ?? "slate"}>{l.action}</Badge></td>
                    <td className="px-4 py-3 text-slate-700">{l.entity}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{l.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

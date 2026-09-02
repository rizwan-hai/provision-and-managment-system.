import { useMemo, useRef } from "react";
import { useApp } from "../contexts/AppContext";
import { Card, Badge, Button, ProgressBar } from "../components/ui";
import { TIER_LIMITS } from "../types";

export default function Reports() {
  const { data } = useApp();
  const printRef = useRef<HTMLDivElement>(null);

  const tierStats = useMemo(() => {
    return (["tier1", "tier2", "tier3", "tier4"] as const).map((t) => {
      const list = data.contracts.filter((c) => c.tier === t);
      const sum = list.reduce((s, c) => s + c.amount, 0);
      return { tier: t, count: list.length, sum };
    });
  }, [data.contracts]);

  const totalContractValue = data.contracts.reduce((s, c) => s + c.amount, 0);

  const statusStats = useMemo(() => {
    return (["draft", "active", "completed", "cancelled"] as const).map((s) => ({
      status: s,
      count: data.contracts.filter((c) => c.status === s).length,
    }));
  }, [data.contracts]);

  const orderPriorityStats = useMemo(() => {
    return (["urgent", "high", "medium", "low"] as const).map((p) => ({
      priority: p,
      count: data.orders.filter((o) => o.priority === p).length,
    }));
  }, [data.orders]);

  const companyTypeStats = useMemo(() => {
    return (["construction", "logistics", "retail", "services"] as const).map((t) => ({
      type: t,
      count: data.companies.filter((c) => c.type === t).length,
    }));
  }, [data.companies]);

  const topCompanies = useMemo(() => {
    const map = new Map<string, number>();
    data.contracts.forEach((c) => {
      map.set(c.companyId, (map.get(c.companyId) ?? 0) + c.amount);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, total]) => ({
        company: data.companies.find((c) => c.id === id),
        total,
      }));
  }, [data]);

  const maxTier = Math.max(1, ...tierStats.map((t) => t.count));
  const maxPriority = Math.max(1, ...orderPriorityStats.map((p) => p.count));
  const maxTopCompany = Math.max(1, ...topCompanies.map((t) => t.total));

  return (
    <div className="space-y-5" ref={printRef}>
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-base font-semibold text-slate-900">د سیستم راپورونه / System Reports</h2>
          <p className="text-xs text-slate-500">Standardized reporting & analytics</p>
        </div>
        <Button variant="secondary" onClick={() => window.print()} icon={<span>🖨</span>}>
          چاپ کول / Print
        </Button>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Tier distribution - bar chart */}
        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-900">د قراردادونو وېش پر ارزښت</h3>
          <p className="text-xs text-slate-500 mb-5">Contract distribution by amount tier</p>
          <div className="space-y-4">
            {tierStats.map((s) => {
              const colors = { tier1: "green", tier2: "blue", tier3: "amber", tier4: "red" } as const;
              return (
                <div key={s.tier}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <Badge tone={colors[s.tier]}>{TIER_LIMITS[s.tier].label}</Badge>
                    <div className="text-xs text-slate-600">
                      <span className="tabular-nums font-semibold">{s.count}</span> قرارداد · <span className="tabular-nums">${s.sum.toLocaleString()}</span>
                    </div>
                  </div>
                  <ProgressBar value={(s.count / maxTier) * 100} tone={colors[s.tier]} />
                </div>
              );
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-slate-200 text-sm text-slate-700">
            مجموعي ارزښت: <strong className="tabular-nums text-lg">${totalContractValue.toLocaleString()}</strong>
          </div>
        </Card>

        {/* Status pie (using SVG) */}
        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-900">د قراردادونو حالت</h3>
          <p className="text-xs text-slate-500 mb-5">Contract status breakdown</p>
          <DonutChart
            data={statusStats.map((s) => ({
              label: s.status,
              value: s.count,
              color: s.status === "active" ? "#10b981" : s.status === "completed" ? "#3b82f6" : s.status === "cancelled" ? "#ef4444" : "#94a3b8",
            }))}
          />
        </Card>

        {/* Priority bars */}
        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-900">د سپارښتنو لومړیتوب</h3>
          <p className="text-xs text-slate-500 mb-5">Order priority distribution</p>
          <div className="space-y-3">
            {orderPriorityStats.map((p) => {
              const tones = { urgent: "red", high: "amber", medium: "blue", low: "slate" } as const;
              return (
                <div key={p.priority}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="capitalize text-slate-700">{p.priority}</span>
                    <span className="tabular-nums font-semibold">{p.count}</span>
                  </div>
                  <ProgressBar value={(p.count / maxPriority) * 100} tone={p.priority === "urgent" ? "red" : p.priority === "high" ? "amber" : p.priority === "medium" ? "blue" : "blue"} />
                  {/* eslint-disable-next-line */}
                  <span className="hidden">{tones[p.priority]}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Company types */}
        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-900">د شرکتونو وېش</h3>
          <p className="text-xs text-slate-500 mb-5">Companies by type</p>
          <DonutChart
            data={companyTypeStats.map((s) => ({
              label: s.type,
              value: s.count,
              color: s.type === "construction" ? "#3b82f6" : s.type === "logistics" ? "#8b5cf6" : s.type === "retail" ? "#f59e0b" : "#64748b",
            }))}
          />
        </Card>

        {/* Top companies */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-base font-semibold text-slate-900">د پنځو غوره شرکتونو لیست (د قرارداد ارزښت)</h3>
          <p className="text-xs text-slate-500 mb-5">Top 5 companies by total contract value</p>
          {topCompanies.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">معلومات نشته / No data</p>
          ) : (
            <div className="space-y-3">
              {topCompanies.map((t, i) => (
                <div key={t.company?.id ?? i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="font-medium text-slate-900 truncate">{t.company?.name ?? "Unknown"}</p>
                      <p className="text-sm font-semibold tabular-nums text-slate-900">${t.total.toLocaleString()}</p>
                    </div>
                    <ProgressBar value={(t.total / maxTopCompany) * 100} tone="blue" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="flex items-center gap-6">
      <svg width="180" height="180" viewBox="0 0 180 180" className="shrink-0">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="22" />
        {data.map((d, i) => {
          const len = (d.value / total) * circumference;
          const dash = `${len} ${circumference}`;
          const el = (
            <circle
              key={i}
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth="22"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              transform="rotate(-90 90 90)"
            />
          );
          offset += len;
          return el;
        })}
        <text x="90" y="86" textAnchor="middle" className="fill-slate-900 text-xl font-bold">{total}</text>
        <text x="90" y="104" textAnchor="middle" className="fill-slate-500 text-[10px]">Total</text>
      </svg>
      <div className="flex-1 space-y-2 min-w-0">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: d.color }} aria-hidden />
            <span className="flex-1 capitalize text-slate-700 truncate">{d.label}</span>
            <span className="tabular-nums font-semibold text-slate-900">{d.value}</span>
            <span className="text-xs text-slate-500 tabular-nums w-10 text-left">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

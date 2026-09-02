import { useMemo } from "react";
import { useApp } from "../contexts/AppContext";
import { Card, StatCard, Badge, ProgressBar, EmptyState } from "../components/ui";
import { TIER_LIMITS } from "../types";
import type { PageKey } from "../components/Layout";

export default function Dashboard({ onNavigate }: { onNavigate: (k: PageKey) => void }) {
  const { data } = useApp();

  const stats = useMemo(() => {
    const totalCompanies = data.companies.length;
    const blacklisted = data.companies.filter((c) => c.blacklisted).length;
    const activeContracts = data.contracts.filter((c) => c.status === "active").length;
    const totalContractValue = data.contracts.reduce((s, c) => s + c.amount, 0);
    const pendingOrders = data.orders.filter((o) => o.status === "pending" || o.status === "in_progress").length;
    const urgentOrders = data.orders.filter((o) => o.priority === "urgent" && o.status !== "completed").length;
    const incompleteOrders = data.orders.filter((o) => o.status === "incomplete").length;

    const tierCounts = {
      tier1: data.contracts.filter((c) => c.tier === "tier1").length,
      tier2: data.contracts.filter((c) => c.tier === "tier2").length,
      tier3: data.contracts.filter((c) => c.tier === "tier3").length,
      tier4: data.contracts.filter((c) => c.tier === "tier4").length,
    };
    const maxTier = Math.max(1, ...Object.values(tierCounts));

    return {
      totalCompanies,
      blacklisted,
      activeContracts,
      totalContractValue,
      pendingOrders,
      urgentOrders,
      incompleteOrders,
      tierCounts,
      maxTier,
    };
  }, [data]);

  const recentContracts = data.contracts.slice(0, 5);
  const urgentOrdersList = data.orders.filter((o) => o.priority === "urgent" || o.priority === "high").slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <Card className="p-6 bg-gradient-to-br from-brand-600 to-brand-800 text-white border-0">
        <h2 className="text-xl font-bold">ښه راغلاست! / Welcome back</h2>
        <p className="text-sm text-white/80 mt-1">
          دلته د سیستم د عمومي حالت لنډه کتنه ده. د لاندې کارتونو څخه ګټه واخلئ ترڅو په چټکۍ سره ولاړ شئ.
        </p>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="ټول شرکتونه / Companies" value={stats.totalCompanies} icon="🏢" tone="blue" hint={`${stats.blacklisted} بلاک شوي`} />
        <StatCard label="فعال قراردادونه / Active" value={stats.activeContracts} icon="📑" tone="green" hint={`له ${data.contracts.length} څخه`} />
        <StatCard label="د قراردادونو ارزښت / Value" value={formatMoney(stats.totalContractValue)} icon="💰" tone="violet" hint="USD" />
        <StatCard label="سپارښتنې / Orders" value={stats.pendingOrders} icon="📦" tone="amber" hint={`${stats.urgentOrders} بیړنۍ`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tier breakdown chart */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900">د قراردادونو وېش پر اساس د ارزښت</h3>
              <p className="text-xs text-slate-500">Contract Distribution by Amount Tier</p>
            </div>
            <button onClick={() => onNavigate("contracts")} className="text-xs font-medium text-brand-600 hover:text-brand-700">
              ټول وګورئ ←
            </button>
          </div>
          <div className="space-y-4">
            {(["tier1", "tier2", "tier3", "tier4"] as const).map((t, idx) => {
              const tones = ["green", "blue", "amber", "red"] as const;
              const count = stats.tierCounts[t];
              const pct = (count / stats.maxTier) * 100;
              return (
                <div key={t}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <Badge tone={tones[idx]}>{TIER_LIMITS[t].label}</Badge>
                      <span className="text-xs text-slate-500">{TIER_LIMITS[t].labelEn}</span>
                    </div>
                    <span className="font-semibold tabular-nums text-slate-700">{count}</span>
                  </div>
                  <ProgressBar value={pct} tone={tones[idx]} />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Alerts */}
        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-1">خبرتیاوې / Alerts</h3>
          <p className="text-xs text-slate-500 mb-4">د پاملرنې وړ موارد</p>
          <div className="space-y-2.5">
            <AlertRow icon="🚫" label="بلاک لست شرکتونه" labelEn="Blacklisted companies" count={stats.blacklisted} tone="red" onClick={() => onNavigate("companies")} />
            <AlertRow icon="⚡" label="بیړنۍ سپارښتنې" labelEn="Urgent orders" count={stats.urgentOrders} tone="amber" onClick={() => onNavigate("orders")} />
            <AlertRow icon="⏳" label="ناتمامې سپارښتنې" labelEn="Incomplete orders" count={stats.incompleteOrders} tone="violet" onClick={() => onNavigate("orders")} />
          </div>
        </Card>
      </div>

      {/* Recent contracts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">وروستي قراردادونه / Recent Contracts</h3>
            <button onClick={() => onNavigate("contracts")} className="text-xs font-medium text-brand-600 hover:text-brand-700">
              ټول ←
            </button>
          </div>
          {recentContracts.length === 0 ? (
            <EmptyState icon="📑" title="هیڅ قرارداد نشته" description="No contracts yet" />
          ) : (
            <div className="space-y-2">
              {recentContracts.map((c) => {
                const company = data.companies.find((x) => x.id === c.companyId);
                return (
                  <div key={c.id} className="p-3 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/30 transition-base">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{c.title}</p>
                        <p className="text-xs text-slate-500 truncate">{company?.name} · {c.contractNo}</p>
                      </div>
                      <div className="text-left shrink-0">
                        <p className="text-sm font-semibold text-slate-900 tabular-nums">{formatMoney(c.amount)} {c.currency}</p>
                        <Badge tone={c.status === "active" ? "green" : c.status === "completed" ? "blue" : "slate"}>
                          {c.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center gap-2">
                      <ProgressBar value={c.progressPercent} tone={c.progressPercent === 100 ? "green" : "blue"} />
                      <span className="text-xs text-slate-500 tabular-nums w-10 text-left">{c.progressPercent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">لومړیتوب لرونکې سپارښتنې / Priority Orders</h3>
            <button onClick={() => onNavigate("orders")} className="text-xs font-medium text-brand-600 hover:text-brand-700">
              ټول ←
            </button>
          </div>
          {urgentOrdersList.length === 0 ? (
            <EmptyState icon="📦" title="هیڅ بیړنۍ سپارښتنه نشته" description="No urgent orders" />
          ) : (
            <div className="space-y-2">
              {urgentOrdersList.map((o) => (
                <div key={o.id} className="p-3 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 transition-base flex items-center gap-3">
                  <div className={`w-2 h-12 rounded-full ${o.priority === "urgent" ? "bg-red-500" : "bg-amber-500"}`} aria-hidden />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{o.title}</p>
                    <p className="text-xs text-slate-500">{o.orderNo} · {new Date(o.requiredDate).toLocaleDateString()}</p>
                  </div>
                  <Badge tone={o.priority === "urgent" ? "red" : "amber"}>{o.priority}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function AlertRow({
  icon, label, labelEn, count, tone, onClick,
}: { icon: string; label: string; labelEn: string; count: number; tone: "red" | "amber" | "violet"; onClick: () => void }) {
  const tones = {
    red: "bg-red-50 border-red-200 hover:bg-red-100",
    amber: "bg-amber-50 border-amber-200 hover:bg-amber-100",
    violet: "bg-violet-50 border-violet-200 hover:bg-violet-100",
  };
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-base text-right ${tones[tone]}`}
    >
      <span className="text-xl" aria-hidden>{icon}</span>
      <div className="flex-1 text-right">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{labelEn}</p>
      </div>
      <span className="text-2xl font-bold tabular-nums text-slate-900">{count}</span>
    </button>
  );
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

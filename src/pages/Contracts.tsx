import { useState, useMemo, type FormEvent } from "react";
import { useApp } from "../contexts/AppContext";
import { useToast } from "../contexts/ToastContext";
import { Button, Card, Input, Field, Modal, Badge, ConfirmModal, EmptyState, Select, Textarea, ProgressBar } from "../components/ui";
import type { Contract, ContractStatus, ContractTier } from "../types";
import { TIER_LIMITS, getTierFromAmount } from "../types";
import { uid } from "../utils/storage";

const STATUS_TONE = {
  draft: "slate", active: "green", completed: "blue", cancelled: "red",
} as const;

export default function Contracts() {
  const { data, updateData, currentUser } = useApp();
  const { toast } = useToast();

  const [q, setQ] = useState("");
  const [tier, setTier] = useState<"all" | ContractTier>("all");
  const [status, setStatus] = useState<"all" | ContractStatus>("all");

  const [editing, setEditing] = useState<Contract | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Contract | null>(null);

  const filtered = useMemo(() => {
    return data.contracts.filter((c) => {
      if (tier !== "all" && c.tier !== tier) return false;
      if (status !== "all" && c.status !== status) return false;
      if (q) {
        const s = q.toLowerCase();
        const company = data.companies.find((x) => x.id === c.companyId);
        if (!c.title.toLowerCase().includes(s) && !c.contractNo.toLowerCase().includes(s) && !company?.name.toLowerCase().includes(s))
          return false;
      }
      return true;
    });
  }, [data, q, tier, status]);

  const totalValue = filtered.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-5">
      {/* Tier summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(["tier1", "tier2", "tier3", "tier4"] as const).map((t) => {
          const list = data.contracts.filter((c) => c.tier === t);
          const sum = list.reduce((s, c) => s + c.amount, 0);
          const tones = { tier1: "from-emerald-500 to-emerald-600", tier2: "from-blue-500 to-blue-600", tier3: "from-amber-500 to-amber-600", tier4: "from-red-500 to-red-600" };
          const active = tier === t;
          return (
            <button
              key={t}
              onClick={() => setTier(active ? "all" : t)}
              className={`p-4 rounded-2xl border-2 text-right transition-base ${active ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
            >
              <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white bg-gradient-to-br ${tones[t]}`}>
                {TIER_LIMITS[t].label}
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">{list.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">{TIER_LIMITS[t].labelEn}</p>
              <p className="text-xs text-slate-700 font-medium mt-1 tabular-nums">${sum.toLocaleString()}</p>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input placeholder="🔍 لټون / Search by title, number, company..." value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 min-w-[240px]" />
          <Select value={status} onChange={(e) => setStatus(e.target.value as never)}>
            <option value="all">ټول حالات / All statuses</option>
            <option value="draft">مسوده / Draft</option>
            <option value="active">فعال / Active</option>
            <option value="completed">بشپړ / Completed</option>
            <option value="cancelled">لغوه / Cancelled</option>
          </Select>
          <Button onClick={() => setCreating(true)} icon={<span>＋</span>}>نوی قرارداد / New contract</Button>
        </div>
        <div className="mt-3 text-xs text-slate-500 flex items-center gap-4">
          <span>{filtered.length} قراردادونه</span>
          <span>·</span>
          <span>مجموعي ارزښت: <strong className="text-slate-700">${totalValue.toLocaleString()}</strong></span>
        </div>
      </Card>

      {/* List */}
      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon="📑" title="هیڅ قرارداد ونه موندل شو" description="No contracts match your filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold">قرارداد / Contract</th>
                  <th className="text-right px-4 py-3 font-semibold">شرکت / Company</th>
                  <th className="text-right px-4 py-3 font-semibold">ارزښت / Amount</th>
                  <th className="text-right px-4 py-3 font-semibold">پرمختګ / Progress</th>
                  <th className="text-right px-4 py-3 font-semibold">حالت / Status</th>
                  <th className="text-right px-4 py-3 font-semibold">سند / Doc</th>
                  <th className="text-left px-4 py-3 font-semibold">عملونه</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => {
                  const company = data.companies.find((x) => x.id === c.companyId);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{c.title}</p>
                        <p className="text-xs text-slate-500">{c.contractNo}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-800">{company?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold tabular-nums text-slate-900">{c.amount.toLocaleString()} {c.currency}</p>
                        <p className="text-xs text-slate-500">{TIER_LIMITS[c.tier].labelEn}</p>
                      </td>
                      <td className="px-4 py-3 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={c.progressPercent} tone={c.progressPercent === 100 ? "green" : "blue"} />
                          <span className="text-xs tabular-nums text-slate-700 w-10 text-left">{c.progressPercent}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge></td>
                      <td className="px-4 py-3">
                        {c.attachmentName ? (
                          <Badge tone={c.attachmentType === "pdf" ? "red" : "green"}>
                            {c.attachmentType === "pdf" ? "📄 PDF" : "📊 Excel"}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => setEditing(c)}>سمول</Button>
                          {currentUser?.role === "admin" && (
                            <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setConfirmDelete(c)}>حذف</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {(creating || editing) && (
        <ContractForm
          initial={editing ?? undefined}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={(c) => {
            if (editing) {
              updateData(
                (d) => ({ ...d, contracts: d.contracts.map((x) => (x.id === c.id ? c : x)) }),
                { action: "update", entity: "contract", details: c.contractNo }
              );
              toast("قرارداد ثبت شو / Updated", "success");
            } else {
              updateData(
                (d) => ({ ...d, contracts: [c, ...d.contracts] }),
                { action: "create", entity: "contract", details: c.contractNo }
              );
              toast("نوی قرارداد اضافه شو / Added", "success");
            }
            setCreating(false); setEditing(null);
          }}
        />
      )}

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            updateData(
              (d) => ({ ...d, contracts: d.contracts.filter((x) => x.id !== confirmDelete.id) }),
              { action: "delete", entity: "contract", details: confirmDelete.contractNo }
            );
            toast("حذف شو / Deleted", "info");
          }
        }}
        title="د حذف تایید"
        message={`آیا د "${confirmDelete?.contractNo}" حذف کول غواړئ؟`}
      />
    </div>
  );
}

function ContractForm({ initial, onClose, onSave }: { initial?: Contract; onClose: () => void; onSave: (c: Contract) => void }) {
  const { currentUser, data } = useApp();
  const [form, setForm] = useState<Contract>(
    initial ?? {
      id: uid("ct"),
      contractNo: `CT-${new Date().getFullYear()}-${String(data.contracts.length + 1).padStart(4, "0")}`,
      companyId: data.companies[0]?.id ?? "",
      title: "",
      amount: 0,
      currency: "USD",
      tier: "tier1",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
      status: "draft",
      progressPercent: 0,
      description: "",
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.id ?? "",
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!form.title.trim()) err.title = "اړین دی";
    if (!form.companyId) err.companyId = "شرکت غوره کړئ";
    if (form.amount <= 0) err.amount = "ارزښت باید له صفر څخه ډېر وي";
    if (new Date(form.endDate) <= new Date(form.startDate)) err.endDate = "د پای نېټه باید د پیل نېټې وروسته وي";

    if (Object.keys(err).length) { setErrors(err); return; }
    onSave({ ...form, tier: getTierFromAmount(form.amount) });
  }

  const detectedTier = getTierFromAmount(form.amount);

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? "د قرارداد سمول" : "نوی قرارداد"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>کنسل</Button>
          <Button onClick={submit as never}>{initial ? "ثبت" : "اضافه"}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4" noValidate>
        <Field label="د قرارداد شمېره / Contract No." required>
          <Input value={form.contractNo} onChange={(e) => setForm({ ...form, contractNo: e.target.value })} />
        </Field>
        <Field label="شرکت / Company" required error={errors.companyId}>
          <Select value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })}>
            <option value="">— انتخاب —</option>
            {data.companies.filter((c) => !c.blacklisted).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="عنوان / Title" required error={errors.title}>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} invalid={!!errors.title} />
          </Field>
        </div>
        <Field label="ارزښت / Amount" required error={errors.amount} hint={`Tier: ${TIER_LIMITS[detectedTier].labelEn}`}>
          <Input type="number" min={0} value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) || 0 })} invalid={!!errors.amount} />
        </Field>
        <Field label="پیسې / Currency">
          <Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as never })}>
            <option value="USD">USD</option>
            <option value="AFN">AFN</option>
            <option value="EUR">EUR</option>
          </Select>
        </Field>
        <Field label="د پیل نېټه / Start date">
          <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </Field>
        <Field label="د پای نېټه / End date" error={errors.endDate}>
          <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} invalid={!!errors.endDate} />
        </Field>
        <Field label="حالت / Status">
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as never })}>
            <option value="draft">مسوده / Draft</option>
            <option value="active">فعال / Active</option>
            <option value="completed">بشپړ / Completed</option>
            <option value="cancelled">لغوه / Cancelled</option>
          </Select>
        </Field>
        <Field label="د پرمختګ سلنه / Progress %" hint="۰ څخه ۱۰۰">
          <Input type="number" min={0} max={100} value={form.progressPercent} onChange={(e) => setForm({ ...form, progressPercent: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} />
        </Field>
        <div className="sm:col-span-2 grid grid-cols-2 gap-4">
          <Field label="د سند نوم / Document name">
            <Input value={form.attachmentName ?? ""} onChange={(e) => setForm({ ...form, attachmentName: e.target.value })} placeholder="contract.pdf" />
          </Field>
          <Field label="د سند ډول / Type">
            <Select value={form.attachmentType ?? ""} onChange={(e) => setForm({ ...form, attachmentType: (e.target.value || undefined) as never })}>
              <option value="">—</option>
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </Select>
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="شرحه / Description">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}

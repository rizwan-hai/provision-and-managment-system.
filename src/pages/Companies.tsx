import { useState, useMemo, type FormEvent } from "react";
import { useApp } from "../contexts/AppContext";
import { useToast } from "../contexts/ToastContext";
import { Button, Card, Input, Field, Modal, Badge, ConfirmModal, EmptyState, Select, Textarea } from "../components/ui";
import type { Company, CompanyType } from "../types";
import { uid } from "../utils/storage";

const TYPE_LABELS: Record<CompanyType, { fa: string; en: string }> = {
  construction: { fa: "ساختماني", en: "Construction" },
  logistics: { fa: "لوژستیکي", en: "Logistics" },
  retail: { fa: "پرچون", en: "Retail" },
  services: { fa: "خدماتي", en: "Services" },
};

export default function Companies() {
  const { data, updateData, currentUser } = useApp();
  const { toast } = useToast();

  const [q, setQ] = useState("");
  const [filterType, setFilterType] = useState<"all" | CompanyType>("all");
  const [showBlacklisted, setShowBlacklisted] = useState<"all" | "yes" | "no">("all");

  const [editing, setEditing] = useState<Company | null>(null);
  const [creating, setCreating] = useState(false);
  const [violationFor, setViolationFor] = useState<Company | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Company | null>(null);

  const filtered = useMemo(() => {
    return data.companies.filter((c) => {
      if (filterType !== "all" && c.type !== filterType) return false;
      if (showBlacklisted === "yes" && !c.blacklisted) return false;
      if (showBlacklisted === "no" && c.blacklisted) return false;
      if (q) {
        const s = q.toLowerCase();
        if (!c.name.toLowerCase().includes(s) && !c.registrationNo.toLowerCase().includes(s) && !c.contactPerson.toLowerCase().includes(s))
          return false;
      }
      return true;
    });
  }, [data.companies, q, filterType, showBlacklisted]);

  function handleDelete(c: Company) {
    updateData(
      (d) => ({ ...d, companies: d.companies.filter((x) => x.id !== c.id) }),
      { action: "delete", entity: "company", details: `Deleted ${c.name}` }
    );
    toast(`شرکت "${c.name}" حذف شو / Deleted`, "success");
  }

  function handleToggleBlacklist(c: Company, reason?: string) {
    updateData(
      (d) => ({
        ...d,
        companies: d.companies.map((x) =>
          x.id === c.id ? { ...x, blacklisted: !x.blacklisted, blacklistReason: !x.blacklisted ? reason : undefined } : x
        ),
      }),
      { action: c.blacklisted ? "unblacklist" : "blacklist", entity: "company", details: c.name }
    );
    toast(c.blacklisted ? "له بلاک لست څخه ووتل / Removed from blacklist" : "بلاک لست شو / Blacklisted", "success");
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="🔍 د شرکت په نوم، راجستر یا اړیکیال پسې لټون / Search..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 min-w-[240px]"
            aria-label="Search companies"
          />
          <Select value={filterType} onChange={(e) => setFilterType(e.target.value as never)} aria-label="Filter by type">
            <option value="all">ټول ډولونه / All types</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.fa} / {v.en}</option>
            ))}
          </Select>
          <Select value={showBlacklisted} onChange={(e) => setShowBlacklisted(e.target.value as never)} aria-label="Blacklist filter">
            <option value="all">ټول / All</option>
            <option value="no">فعال / Active</option>
            <option value="yes">بلاک شوي / Blacklisted</option>
          </Select>
          <Button onClick={() => setCreating(true)} icon={<span>＋</span>}>
            نوی شرکت / New company
          </Button>
        </div>
        <div className="mt-3 text-xs text-slate-500">
          مجموع: <strong className="text-slate-700">{filtered.length}</strong> له <strong>{data.companies.length}</strong> شرکتونو څخه
        </div>
      </Card>

      {/* Table */}
      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon="🏢" title="هیڅ شرکت ونه موندل شو" description="No companies found. Try changing filters or add a new one." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase tracking-wide">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold">شرکت / Company</th>
                  <th className="text-right px-4 py-3 font-semibold">ډول / Type</th>
                  <th className="text-right px-4 py-3 font-semibold">اړیکیال / Contact</th>
                  <th className="text-right px-4 py-3 font-semibold">حالت / Status</th>
                  <th className="text-right px-4 py-3 font-semibold">تخلفات / Violations</th>
                  <th className="text-left px-4 py-3 font-semibold">عملونه / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => {
                  const contractCount = data.contracts.filter((ct) => ct.companyId === c.id).length;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-base">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.registrationNo} · {contractCount} قرارداد</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={c.type === "construction" ? "blue" : c.type === "logistics" ? "violet" : "slate"}>
                          {TYPE_LABELS[c.type].fa}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-800">{c.contactPerson}</p>
                        <p className="text-xs text-slate-500" dir="ltr">{c.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        {c.blacklisted ? (
                          <Badge tone="red">🚫 بلاک شوی</Badge>
                        ) : (
                          <Badge tone="green">✓ فعال</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {c.violations.length > 0 ? (
                          <button
                            onClick={() => setViolationFor(c)}
                            className="text-xs text-amber-700 hover:text-amber-900 font-medium"
                          >
                            ⚠ {c.violations.length} تخلف
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => setViolationFor(c)}>تخلف</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditing(c)}>سمول</Button>
                          {c.blacklisted ? (
                            <Button size="sm" variant="ghost" onClick={() => handleToggleBlacklist(c)}>ازاد کول</Button>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => {
                              const reason = prompt("د بلاک کولو دلیل / Reason for blacklisting:");
                              if (reason) handleToggleBlacklist(c, reason);
                            }}>بلاک</Button>
                          )}
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
        <CompanyForm
          initial={editing ?? undefined}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={(c) => {
            if (editing) {
              updateData(
                (d) => ({ ...d, companies: d.companies.map((x) => (x.id === c.id ? c : x)) }),
                { action: "update", entity: "company", details: c.name }
              );
              toast("بدلونونه ثبت شول / Changes saved", "success");
            } else {
              updateData(
                (d) => ({ ...d, companies: [c, ...d.companies] }),
                { action: "create", entity: "company", details: c.name }
              );
              toast("نوی شرکت اضافه شو / New company added", "success");
            }
            setCreating(false); setEditing(null);
          }}
        />
      )}

      {violationFor && (
        <ViolationsModal
          company={violationFor}
          onClose={() => setViolationFor(null)}
          onAdd={(desc, severity) => {
            updateData(
              (d) => ({
                ...d,
                companies: d.companies.map((x) =>
                  x.id === violationFor.id
                    ? { ...x, violations: [...x.violations, { id: uid("v"), date: new Date().toISOString(), description: desc, severity }] }
                    : x
                ),
              }),
              { action: "add_violation", entity: "company", details: `${violationFor.name}: ${desc}` }
            );
            toast("تخلف ثبت شو / Violation recorded", "success");
          }}
          onRemove={(vid) => {
            updateData((d) => ({
              ...d,
              companies: d.companies.map((x) =>
                x.id === violationFor.id ? { ...x, violations: x.violations.filter((v) => v.id !== vid) } : x
              ),
            }));
            toast("تخلف لرې شو / Removed", "info");
          }}
        />
      )}

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        title="د حذف تایید / Confirm Delete"
        message={`آیا تاسو غواړئ "${confirmDelete?.name}" حذف کړئ؟ دا عمل بیرته نه راګرځي / This action cannot be undone.`}
        confirmText="حذف کړه / Delete"
      />
    </div>
  );
}

function CompanyForm({ initial, onClose, onSave }: { initial?: Company; onClose: () => void; onSave: (c: Company) => void }) {
  const { currentUser, data } = useApp();
  const [form, setForm] = useState<Company>(
    initial ?? {
      id: uid("co"),
      name: "",
      type: "construction",
      registrationNo: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      blacklisted: false,
      violations: [],
      experience: "",
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.id ?? "",
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!form.name.trim()) err.name = "نوم اړین دی";
    if (!form.registrationNo.trim()) err.registrationNo = "د راجستر شمېره اړینه ده";
    if (data.companies.some((c) => c.registrationNo === form.registrationNo && c.id !== form.id))
      err.registrationNo = "دا راجستر شمېره مخکې شته";
    if (!form.contactPerson.trim()) err.contactPerson = "اړیکیال اړین دی";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = "ایمیل اشتباه دی";

    if (Object.keys(err).length) {
      setErrors(err);
      return;
    }
    onSave(form);
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? "د شرکت سمول / Edit company" : "نوی شرکت / New company"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>کنسل / Cancel</Button>
          <Button onClick={submit as never}>{initial ? "ثبت / Save" : "اضافه کول / Add"}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4" noValidate>
        <Field label="د شرکت نوم / Company name" required error={errors.name}>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} invalid={!!errors.name} />
        </Field>
        <Field label="د راجستر شمېره / Registration No." required error={errors.registrationNo}>
          <Input value={form.registrationNo} onChange={(e) => setForm({ ...form, registrationNo: e.target.value })} invalid={!!errors.registrationNo} />
        </Field>
        <Field label="ډول / Type" required>
          <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CompanyType })}>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.fa} / {v.en}</option>
            ))}
          </Select>
        </Field>
        <Field label="اړیکیال / Contact person" required error={errors.contactPerson}>
          <Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} invalid={!!errors.contactPerson} />
        </Field>
        <Field label="تلیفون / Phone">
          <Input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+93 700 000 000" />
        </Field>
        <Field label="ایمیل / Email" error={errors.email}>
          <Input dir="ltr" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} invalid={!!errors.email} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="پته / Address">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="د کاري تجربې شرحه / Work experience">
            <Textarea value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}

function ViolationsModal({
  company, onClose, onAdd, onRemove,
}: {
  company: Company;
  onClose: () => void;
  onAdd: (desc: string, severity: "low" | "medium" | "high") => void;
  onRemove: (id: string) => void;
}) {
  const [desc, setDesc] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium");
  return (
    <Modal open onClose={onClose} title={`تخلفات / Violations - ${company.name}`} size="md">
      <div className="space-y-4">
        <div className="space-y-2">
          {company.violations.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">هیڅ تخلف نشته / No violations recorded</p>
          ) : (
            company.violations.map((v) => (
              <div key={v.id} className="p-3 border border-slate-200 rounded-xl flex items-start gap-3">
                <Badge tone={v.severity === "high" ? "red" : v.severity === "medium" ? "amber" : "slate"}>{v.severity}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800">{v.description}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{new Date(v.date).toLocaleString()}</p>
                </div>
                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => onRemove(v.id)}>حذف</Button>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-slate-200 pt-4 space-y-3">
          <h4 className="text-sm font-semibold text-slate-900">نوی تخلف اضافه کړئ / Add violation</h4>
          <Textarea placeholder="د تخلف شرحه" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <div className="flex items-center justify-between gap-3">
            <Select value={severity} onChange={(e) => setSeverity(e.target.value as never)} className="w-40">
              <option value="low">ټیټ / Low</option>
              <option value="medium">متوسط / Medium</option>
              <option value="high">لوړ / High</option>
            </Select>
            <Button onClick={() => { if (desc.trim()) { onAdd(desc.trim(), severity); setDesc(""); } }}>
              اضافه کول / Add
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

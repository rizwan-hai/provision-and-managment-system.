import { useState, type FormEvent } from "react";
import { useApp } from "../contexts/AppContext";
import { useToast } from "../contexts/ToastContext";
import { Button, Card, Input, Field, Modal, Badge, ConfirmModal, EmptyState, Select } from "../components/ui";
import type { Vendor, CompanyType } from "../types";
import { uid } from "../utils/storage";

const TYPE_LABELS: Record<CompanyType, string> = {
  construction: "ساختماني",
  logistics: "لوژستیکي",
  retail: "پرچون",
  services: "خدماتي",
};

export default function Vendors() {
  const { data, updateData, currentUser } = useApp();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Vendor | null>(null);

  const filtered = data.vendors.filter((v) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return v.vendorName.toLowerCase().includes(s) || v.accountNo.toLowerCase().includes(s) || v.taxId.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input placeholder="🔍 د وېنډر په نوم، حساب شمېره... / Search vendors..." value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 min-w-[240px]" />
          <Button onClick={() => setCreating(true)} icon={<span>＋</span>}>نوی وېنډر / New vendor</Button>
        </div>
        <p className="text-xs text-slate-500 mt-2">Vendor Form · د "Account-N" نمبر هر وېنډر ته اړین دی</p>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon="🤝" title="هیڅ وېنډر نشته" description="No vendors registered yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold">Account-N</th>
                  <th className="text-right px-4 py-3 font-semibold">وېنډر / Vendor</th>
                  <th className="text-right px-4 py-3 font-semibold">ډول</th>
                  <th className="text-right px-4 py-3 font-semibold">د مالیې شمېره</th>
                  <th className="text-right px-4 py-3 font-semibold">د بانک حساب</th>
                  <th className="text-left px-4 py-3 font-semibold">عملونه</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3"><Badge tone="violet">{v.accountNo}</Badge></td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{v.vendorName}</p>
                      <p className="text-xs text-slate-500">{v.contactInfo}</p>
                    </td>
                    <td className="px-4 py-3">{TYPE_LABELS[v.type]}</td>
                    <td className="px-4 py-3 font-mono text-xs">{v.taxId}</td>
                    <td className="px-4 py-3 font-mono text-xs">{v.bankAccount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setEditing(v)}>سمول</Button>
                        {currentUser?.role === "admin" && (
                          <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setConfirmDelete(v)}>حذف</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {(creating || editing) && (
        <VendorForm
          initial={editing ?? undefined}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={(v) => {
            if (editing) {
              updateData((d) => ({ ...d, vendors: d.vendors.map((x) => (x.id === v.id ? v : x)) }), { action: "update", entity: "vendor", details: v.accountNo });
              toast("بدلونونه ثبت شول", "success");
            } else {
              updateData((d) => ({ ...d, vendors: [v, ...d.vendors] }), { action: "create", entity: "vendor", details: v.accountNo });
              toast("وېنډر اضافه شو", "success");
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
            updateData((d) => ({ ...d, vendors: d.vendors.filter((x) => x.id !== confirmDelete.id) }), { action: "delete", entity: "vendor", details: confirmDelete.accountNo });
            toast("حذف شو", "info");
          }
        }}
        title="د حذف تایید"
        message={`آیا د "${confirmDelete?.vendorName}" حذف کول غواړئ؟`}
      />
    </div>
  );
}

function VendorForm({ initial, onClose, onSave }: { initial?: Vendor; onClose: () => void; onSave: (v: Vendor) => void }) {
  const { data } = useApp();
  const [form, setForm] = useState<Vendor>(
    initial ?? {
      id: uid("vn"),
      accountNo: `ACC-N-${1000 + data.vendors.length + 1}`,
      vendorName: "",
      type: "construction",
      taxId: "",
      bankAccount: "",
      contactInfo: "",
      createdAt: new Date().toISOString(),
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!form.vendorName.trim()) err.vendorName = "نوم اړین";
    if (!form.accountNo.trim()) err.accountNo = "حساب شمېره اړینه";
    if (data.vendors.some((v) => v.accountNo === form.accountNo && v.id !== form.id))
      err.accountNo = "دا شمېره مخکې شته";
    if (Object.keys(err).length) { setErrors(err); return; }
    onSave(form);
  }

  return (
    <Modal open onClose={onClose} title={initial ? "د وېنډر سمول" : "نوی وېنډر"} size="md"
      footer={<><Button variant="secondary" onClick={onClose}>کنسل</Button><Button onClick={submit as never}>ثبت</Button></>}
    >
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4" noValidate>
        <Field label="Account-N" required error={errors.accountNo}>
          <Input value={form.accountNo} onChange={(e) => setForm({ ...form, accountNo: e.target.value })} invalid={!!errors.accountNo} />
        </Field>
        <Field label="ډول">
          <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as never })}>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="د وېنډر نوم" required error={errors.vendorName}>
            <Input value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} invalid={!!errors.vendorName} />
          </Field>
        </div>
        <Field label="د مالیې شمېره / Tax ID">
          <Input value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
        </Field>
        <Field label="د بانک حساب">
          <Input dir="ltr" value={form.bankAccount} onChange={(e) => setForm({ ...form, bankAccount: e.target.value })} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="د اړیکې معلومات">
            <Input value={form.contactInfo} onChange={(e) => setForm({ ...form, contactInfo: e.target.value })} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}

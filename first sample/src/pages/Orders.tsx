import { useState, useMemo, type FormEvent } from "react";
import { useApp } from "../contexts/AppContext";
import { useToast } from "../contexts/ToastContext";
import { Button, Card, Input, Field, Modal, Badge, ConfirmModal, EmptyState, Select, Textarea } from "../components/ui";
import type { ProcurementOrder, Priority, OrderStatus } from "../types";
import { uid } from "../utils/storage";

const PRIORITY_TONE = { low: "slate", medium: "blue", high: "amber", urgent: "red" } as const;
const PRIORITY_RANK: Record<Priority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
const STATUS_LABEL = {
  pending: { fa: "په تمه", en: "Pending", tone: "amber" as const },
  in_progress: { fa: "په جریان کې", en: "In progress", tone: "blue" as const },
  completed: { fa: "بشپړ", en: "Completed", tone: "green" as const },
  incomplete: { fa: "ناتمام", en: "Incomplete", tone: "red" as const },
};

export default function Orders() {
  const { data, updateData, currentUser } = useApp();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [filterPriority, setFilterPriority] = useState<"all" | Priority>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | OrderStatus>("all");
  const [filterCategory, setFilterCategory] = useState<"all" | "retail" | "contract">("all");
  const [sortByPriority, setSortByPriority] = useState(true);

  const [editing, setEditing] = useState<ProcurementOrder | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ProcurementOrder | null>(null);

  const filtered = useMemo(() => {
    let arr = data.orders.filter((o) => {
      if (filterPriority !== "all" && o.priority !== filterPriority) return false;
      if (filterStatus !== "all" && o.status !== filterStatus) return false;
      if (filterCategory !== "all" && o.category !== filterCategory) return false;
      if (q) {
        const s = q.toLowerCase();
        if (!o.title.toLowerCase().includes(s) && !o.orderNo.toLowerCase().includes(s)) return false;
      }
      return true;
    });
    if (sortByPriority) {
      arr = [...arr].sort((a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]);
    }
    return arr;
  }, [data.orders, q, filterPriority, filterStatus, filterCategory, sortByPriority]);

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input placeholder="🔍 لټون / Search orders..." value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 min-w-[200px]" />
          <Select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as never)} aria-label="Priority">
            <option value="all">ټول لومړیتوبونه</option>
            <option value="urgent">بیړنی / Urgent</option>
            <option value="high">لوړ / High</option>
            <option value="medium">متوسط / Medium</option>
            <option value="low">ټیټ / Low</option>
          </Select>
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as never)} aria-label="Status">
            <option value="all">ټول حالات</option>
            <option value="pending">په تمه</option>
            <option value="in_progress">په جریان کې</option>
            <option value="completed">بشپړ</option>
            <option value="incomplete">ناتمام</option>
          </Select>
          <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as never)} aria-label="Category">
            <option value="all">ټولې کټګورۍ</option>
            <option value="retail">پرچون / Retail</option>
            <option value="contract">قراردادي / Contract</option>
          </Select>
          <label className="flex items-center gap-2 text-xs text-slate-600 px-2 cursor-pointer">
            <input type="checkbox" checked={sortByPriority} onChange={(e) => setSortByPriority(e.target.checked)} />
            د لومړیتوب لخوا ترتیب
          </label>
          <Button onClick={() => setCreating(true)} icon={<span>＋</span>}>نوې سپارښتنه</Button>
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon="📦" title="هیڅ سپارښتنه ونه موندل شوه" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold">لومړیتوب</th>
                  <th className="text-right px-4 py-3 font-semibold">سپارښتنه / Order</th>
                  <th className="text-right px-4 py-3 font-semibold">کټګوري</th>
                  <th className="text-right px-4 py-3 font-semibold">ارزښت</th>
                  <th className="text-right px-4 py-3 font-semibold">اړینه نېټه</th>
                  <th className="text-right px-4 py-3 font-semibold">حالت</th>
                  <th className="text-left px-4 py-3 font-semibold">عملونه</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((o) => {
                  const company = data.companies.find((c) => c.id === o.companyId);
                  const overdue = new Date(o.requiredDate) < new Date() && o.status !== "completed";
                  return (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Badge tone={PRIORITY_TONE[o.priority]}>
                          {o.priority === "urgent" && "⚡ "}
                          {o.priority}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{o.title}</p>
                        <p className="text-xs text-slate-500">{o.orderNo} {company && `· ${company.name}`}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={o.category === "retail" ? "violet" : "blue"}>
                          {o.category === "retail" ? "پرچون" : "قراردادي"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-slate-900">${o.amount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <p className={`text-xs ${overdue ? "text-red-600 font-semibold" : "text-slate-600"}`}>
                          {new Date(o.requiredDate).toLocaleDateString()}
                          {overdue && " ⚠"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={STATUS_LABEL[o.status].tone}>{STATUS_LABEL[o.status].fa}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => setEditing(o)}>سمول</Button>
                          {currentUser?.role === "admin" && (
                            <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setConfirmDelete(o)}>حذف</Button>
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
        <OrderForm
          initial={editing ?? undefined}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={(o) => {
            if (editing) {
              updateData((d) => ({ ...d, orders: d.orders.map((x) => (x.id === o.id ? o : x)) }), { action: "update", entity: "order", details: o.orderNo });
              toast("سپارښتنه ثبت شوه", "success");
            } else {
              updateData((d) => ({ ...d, orders: [o, ...d.orders] }), { action: "create", entity: "order", details: o.orderNo });
              toast("نوې سپارښتنه اضافه شوه", "success");
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
            updateData((d) => ({ ...d, orders: d.orders.filter((x) => x.id !== confirmDelete.id) }), { action: "delete", entity: "order", details: confirmDelete.orderNo });
            toast("حذف شو", "info");
          }
        }}
        title="د حذف تایید"
        message={`آیا د "${confirmDelete?.orderNo}" حذف کول غواړئ؟`}
      />
    </div>
  );
}

function OrderForm({ initial, onClose, onSave }: { initial?: ProcurementOrder; onClose: () => void; onSave: (o: ProcurementOrder) => void }) {
  const { currentUser, data } = useApp();
  const [form, setForm] = useState<ProcurementOrder>(
    initial ?? {
      id: uid("or"),
      orderNo: `PO-${new Date().getFullYear()}-${String(data.orders.length + 1).padStart(4, "0")}`,
      title: "",
      companyId: undefined,
      category: "retail",
      priority: "medium",
      status: "pending",
      requestedDate: new Date().toISOString().slice(0, 10),
      requiredDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      amount: 0,
      description: "",
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.id ?? "",
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!form.title.trim()) err.title = "عنوان اړین دی";
    if (form.amount < 0) err.amount = "اشتباه";
    if (Object.keys(err).length) { setErrors(err); return; }
    onSave(form);
  }

  return (
    <Modal
      open onClose={onClose}
      title={initial ? "د سپارښتنې سمول" : "نوې سپارښتنه"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>کنسل</Button>
          <Button onClick={submit as never}>{initial ? "ثبت" : "اضافه"}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4" noValidate>
        <Field label="د سپارښتنې شمېره" required><Input value={form.orderNo} onChange={(e) => setForm({ ...form, orderNo: e.target.value })} /></Field>
        <Field label="کټګوري / Category" required>
          <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as never })}>
            <option value="retail">پرچون اخیستل / Retail purchase</option>
            <option value="contract">قراردادي / Contract</option>
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="عنوان / Title" required error={errors.title}>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} invalid={!!errors.title} />
          </Field>
        </div>
        <Field label="لومړیتوب / Priority" required>
          <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as never })}>
            <option value="urgent">⚡ بیړنی / Urgent</option>
            <option value="high">لوړ / High</option>
            <option value="medium">متوسط / Medium</option>
            <option value="low">ټیټ / Low</option>
          </Select>
        </Field>
        <Field label="حالت / Status" required>
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as never })}>
            <option value="pending">په تمه</option>
            <option value="in_progress">په جریان کې</option>
            <option value="completed">بشپړ</option>
            <option value="incomplete">ناتمام</option>
          </Select>
        </Field>
        <Field label="شرکت / Company (optional)">
          <Select value={form.companyId ?? ""} onChange={(e) => setForm({ ...form, companyId: e.target.value || undefined })}>
            <option value="">—</option>
            {data.companies.filter((c) => !c.blacklisted).map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </Select>
        </Field>
        <Field label="ارزښت / Amount" error={errors.amount}>
          <Input type="number" min={0} value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) || 0 })} invalid={!!errors.amount} />
        </Field>
        <Field label="د غوښتنې نېټه"><Input type="date" value={form.requestedDate} onChange={(e) => setForm({ ...form, requestedDate: e.target.value })} /></Field>
        <Field label="د اړتیا نېټه"><Input type="date" value={form.requiredDate} onChange={(e) => setForm({ ...form, requiredDate: e.target.value })} /></Field>
        <div className="sm:col-span-2">
          <Field label="شرحه">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}

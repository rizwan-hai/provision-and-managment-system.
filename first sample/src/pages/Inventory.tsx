import { useState, useMemo, type FormEvent } from "react";
import { useApp } from "../contexts/AppContext";
import { useI18n } from "../contexts/I18nContext";
import { useToast } from "../contexts/ToastContext";
import { Button, Card, Input, Field, Modal, Badge, ConfirmModal, EmptyState, Select, Textarea } from "../components/ui";
import type { InventoryItem, InventoryMovement, InventoryItemType, MovementType } from "../types";
import { uid } from "../utils/storage";

const TYPE_TONES: Record<InventoryItemType, "blue" | "violet" | "amber" | "green"> = {
  sample: "violet",
  equipment: "blue",
  supply: "amber",
  asset: "green",
};

const STATUS_TONES = {
  in_stock: "green",
  low_stock: "amber",
  out_of_stock: "red",
} as const;

export default function Inventory() {
  const { data, updateData, currentUser } = useApp();
  const { t, lang } = useI18n();
  const { toast } = useToast();

  const [q, setQ] = useState("");
  const [filterType, setFilterType] = useState<"all" | InventoryItemType>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");

  const [viewing, setViewing] = useState<InventoryItem | null>(null);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [movementFor, setMovementFor] = useState<{ item: InventoryItem; type: MovementType } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<InventoryItem | null>(null);

  const filtered = useMemo(() => {
    return data.inventoryItems.filter((item) => {
      if (filterType !== "all" && item.type !== filterType) return false;
      if (filterStatus !== "all") {
        const status = getItemStatus(item);
        if (status !== filterStatus) return false;
      }
      if (q) {
        const s = q.toLowerCase();
        if (!item.name.toLowerCase().includes(s) && !item.code.toLowerCase().includes(s) && !item.category.toLowerCase().includes(s))
          return false;
      }
      return true;
    });
  }, [data.inventoryItems, q, filterType, filterStatus]);

  const stats = useMemo(() => {
    const total = data.inventoryItems.length;
    const samples = data.inventoryItems.filter((i) => i.type === "sample").length;
    const lowStock = data.inventoryItems.filter((i) => getItemStatus(i) === "low_stock").length;
    const outOfStock = data.inventoryItems.filter((i) => getItemStatus(i) === "out_of_stock").length;
    return { total, samples, lowStock, outOfStock };
  }, [data.inventoryItems]);

  function getItemStatus(item: InventoryItem): "in_stock" | "low_stock" | "out_of_stock" {
    if (item.quantity === 0) return "out_of_stock";
    if (item.quantity <= item.minStock) return "low_stock";
    return "in_stock";
  }

  function getStatusLabel(status: "in_stock" | "low_stock" | "out_of_stock"): string {
    if (status === "in_stock") return t.inStock;
    if (status === "low_stock") return t.lowStock;
    return t.outOfStock;
  }

  function handleDelete(item: InventoryItem) {
    updateData(
      (d) => ({ ...d, inventoryItems: d.inventoryItems.filter((i) => i.id !== item.id) }),
      { action: "delete", entity: "inventory_item", details: item.name }
    );
    toast(`${t.delete}: "${item.name}"`, "success");
  }

  function handleMovement(item: InventoryItem, type: MovementType, qty: number, notes: string, reference?: string) {
    const newQty = type === "stock_in" ? item.quantity + qty : type === "stock_out" ? Math.max(0, item.quantity - qty) : qty;
    const movement: InventoryMovement = {
      id: uid("mov"),
      itemId: item.id,
      type,
      quantity: qty,
      previousQuantity: item.quantity,
      newQuantity: newQty,
      reference,
      notes,
      date: new Date().toISOString(),
      performedBy: currentUser?.id ?? "",
    };

    updateData(
      (d) => ({
        ...d,
        inventoryItems: d.inventoryItems.map((i) =>
          i.id === item.id ? { ...i, quantity: newQty, updatedAt: new Date().toISOString() } : i
        ),
        inventoryMovements: [movement, ...d.inventoryMovements],
      }),
      { action: type, entity: "inventory", details: `${item.name}: ${qty}` }
    );
    toast(t.save, "success");
  }

  const typeOptions = [
    { value: "sample", label: t.samples },
    { value: "equipment", label: lang === "en" ? "Equipment" : lang === "ps" ? "تجهیزات" : "تجهیزات" },
    { value: "supply", label: lang === "en" ? "Supply" : lang === "ps" ? "تمویل" : "تدارک" },
    { value: "asset", label: lang === "en" ? "Asset" : lang === "ps" ? "شتمني" : "دارایی" },
  ];

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <p className="text-xs opacity-90">{t.items}</p>
          <p className="text-2xl font-bold tabular-nums">{stats.total}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-violet-500 to-violet-600 text-white">
          <p className="text-xs opacity-90">{t.samples}</p>
          <p className="text-2xl font-bold tabular-nums">{stats.samples}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <p className="text-xs opacity-90">{t.lowStock}</p>
          <p className="text-2xl font-bold tabular-nums">{stats.lowStock}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-red-500 to-red-600 text-white">
          <p className="text-xs opacity-90">{t.outOfStock}</p>
          <p className="text-2xl font-bold tabular-nums">{stats.outOfStock}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input placeholder={`🔍 ${t.search}...`} value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 min-w-[200px]" />
          <Select value={filterType} onChange={(e) => setFilterType(e.target.value as never)}>
            <option value="all">{t.category}</option>
            {typeOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </Select>
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as never)}>
            <option value="all">{t.status}</option>
            <option value="in_stock">{t.inStock}</option>
            <option value="low_stock">{t.lowStock}</option>
            <option value="out_of_stock">{t.outOfStock}</option>
          </Select>
          <Button onClick={() => setCreating(true)} icon={<span>＋</span>}>{t.addItem}</Button>
        </div>
      </Card>

      {/* Items Table */}
      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon="📦" title={t.noData} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold">{t.code}</th>
                  <th className="text-right px-4 py-3 font-semibold">{t.name}</th>
                  <th className="text-right px-4 py-3 font-semibold">{t.type}</th>
                  <th className="text-right px-4 py-3 font-semibold">{t.quantity}</th>
                  <th className="text-right px-4 py-3 font-semibold">{t.status}</th>
                  <th className="text-right px-4 py-3 font-semibold">{t.location}</th>
                  <th className="text-left px-4 py-3 font-semibold">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => {
                  const status = getItemStatus(item);
                  const typeLabel = typeOptions.find((o) => o.value === item.type)?.label || item.type;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3"><Badge tone="slate">{item.code}</Badge></td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.category}</p>
                      </td>
                      <td className="px-4 py-3"><Badge tone={TYPE_TONES[item.type]}>{typeLabel}</Badge></td>
                      <td className="px-4 py-3 font-semibold tabular-nums">{item.quantity} {item.unit}</td>
                      <td className="px-4 py-3"><Badge tone={STATUS_TONES[status]}>{getStatusLabel(status)}</Badge></td>
                      <td className="px-4 py-3 text-slate-600">{item.location}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => setViewing(item)}>{lang === "en" ? "View" : lang === "ps" ? "کتل" : "مشاهده"}</Button>
                          <Button size="sm" variant="ghost" onClick={() => setMovementFor({ item, type: "stock_in" })}>+</Button>
                          <Button size="sm" variant="ghost" onClick={() => setMovementFor({ item, type: "stock_out" })}>-</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditing(item)}>{t.edit}</Button>
                          {currentUser?.role === "admin" && (
                            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setConfirmDelete(item)}>{t.delete}</Button>
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

      {/* Modals */}
      {viewing && <ItemDetailsModal item={viewing} onClose={() => setViewing(null)} movements={data.inventoryMovements.filter((m) => m.itemId === viewing.id)} />}
      {(creating || editing) && (
        <ItemForm
          initial={editing ?? undefined}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={(item) => {
            if (editing) {
              updateData((d) => ({ ...d, inventoryItems: d.inventoryItems.map((i) => (i.id === item.id ? item : i)) }), { action: "update", entity: "inventory_item", details: item.name });
              toast(t.save, "success");
            } else {
              updateData((d) => ({ ...d, inventoryItems: [item, ...d.inventoryItems] }), { action: "create", entity: "inventory_item", details: item.name });
              toast(t.add, "success");
            }
            setCreating(false); setEditing(null);
          }}
        />
      )}
      {movementFor && (
        <MovementModal
          item={movementFor.item}
          type={movementFor.type}
          onClose={() => setMovementFor(null)}
          onConfirm={(qty, notes, ref) => handleMovement(movementFor.item, movementFor.type, qty, notes, ref)}
        />
      )}
      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        title={t.confirm}
        message={`${t.delete} "${confirmDelete?.name}"?`}
        confirmText={t.delete}
      />
    </div>
  );
}

function ItemForm({ initial, onClose, onSave }: { initial?: InventoryItem; onClose: () => void; onSave: (i: InventoryItem) => void }) {
  const { t, lang } = useI18n();
  const { currentUser } = useApp();
  const now = new Date().toISOString();
  const [form, setForm] = useState<InventoryItem>(
    initial ?? {
      id: uid("inv"),
      code: `INV-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      name: "",
      type: "sample",
      category: "",
      description: "",
      unit: lang === "en" ? "pcs" : lang === "ps" ? "عدد" : "عدد",
      quantity: 0,
      minStock: 10,
      maxStock: 100,
      reorderPoint: 15,
      location: "",
      condition: "new",
      notes: "",
      createdAt: now,
      updatedAt: now,
      createdBy: currentUser?.id ?? "",
    }
  );

  function submit(e: FormEvent) {
    e.preventDefault();
    onSave({ ...form, updatedAt: new Date().toISOString() });
  }

  const typeOptions = [
    { value: "sample", label: t.samples },
    { value: "equipment", label: lang === "en" ? "Equipment" : lang === "ps" ? "تجهیزات" : "تجهیزات" },
    { value: "supply", label: lang === "en" ? "Supply" : lang === "ps" ? "تمویل" : "تدارک" },
    { value: "asset", label: lang === "en" ? "Asset" : lang === "ps" ? "شتمې" : "دارایی" },
  ];

  return (
    <Modal open onClose={onClose} title={initial ? t.editItem : t.addItem} size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>{t.cancel}</Button><Button onClick={submit as never}>{t.save}</Button></>}
    >
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t.code} required><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
        <Field label={t.type} required>
          <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as InventoryItemType })}>
            {typeOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field label={t.name} required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        </div>
        <Field label={t.category} required><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
        <Field label={t.unit} required><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></Field>
        <Field label={t.quantity} required><Input type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></Field>
        <Field label={t.location} required><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
        <Field label={t.minStock}><Input type="number" min={0} value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} /></Field>
        <Field label={t.maxStock}><Input type="number" min={0} value={form.maxStock} onChange={(e) => setForm({ ...form, maxStock: Number(e.target.value) })} /></Field>
        <Field label={t.batchNumber}><Input value={form.batchNumber ?? ""} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })} /></Field>
        <Field label={t.serialNumber}><Input value={form.serialNumber ?? ""} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} /></Field>
        <div className="sm:col-span-2">
          <Field label={t.description}><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        </div>
      </form>
    </Modal>
  );
}

function MovementModal({ item, type, onClose, onConfirm }: { item: InventoryItem; type: MovementType; onClose: () => void; onConfirm: (qty: number, notes: string, ref?: string) => void }) {
  const { t, lang } = useI18n();
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [ref, setRef] = useState("");

  const title = type === "stock_in" ? t.stockIn : t.stockOut;
  const currentStockLabel = lang === "en" ? "Current Stock" : lang === "ps" ? "اوسنی سټاک" : "موجودی فعلی";

  return (
    <Modal open onClose={onClose} title={title} size="sm"
      footer={<><Button variant="secondary" onClick={onClose}>{t.cancel}</Button><Button onClick={() => onConfirm(qty, notes, ref)}>{t.confirm}</Button></>}
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">{item.name} <Badge tone="slate">{item.code}</Badge></p>
        <p className="text-xs text-slate-500">{currentStockLabel}: <strong>{item.quantity}</strong></p>
        <Field label={t.quantity} required>
          <Input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} />
        </Field>
        <Field label="Reference"><Input value={ref} onChange={(e) => setRef(e.target.value)} /></Field>
        <Field label={t.notes}><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

function ItemDetailsModal({ item, onClose, movements }: { item: InventoryItem; onClose: () => void; movements: InventoryMovement[] }) {
  const { t } = useI18n();
  
  return (
    <Modal open onClose={onClose} title={t.itemDetails} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-xs text-slate-500">{t.code}</p><p className="font-semibold">{item.code}</p></div>
          <div><p className="text-xs text-slate-500">{t.name}</p><p className="font-semibold">{item.name}</p></div>
          <div><p className="text-xs text-slate-500">{t.type}</p><p><Badge tone="violet">{item.type}</Badge></p></div>
          <div><p className="text-xs text-slate-500">{t.category}</p><p>{item.category}</p></div>
          <div><p className="text-xs text-slate-500">{t.quantity}</p><p className="font-semibold">{item.quantity} {item.unit}</p></div>
          <div><p className="text-xs text-slate-500">{t.location}</p><p>{item.location}</p></div>
        </div>
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">{t.history}</h4>
          {movements.length === 0 ? <p className="text-sm text-slate-500">{t.noData}</p> : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {movements.map((m) => (
                <div key={m.id} className="p-2 bg-slate-50 rounded-lg text-sm">
                  <div className="flex items-center justify-between">
                    <Badge tone={m.type === "stock_in" ? "green" : m.type === "stock_out" ? "red" : "blue"}>{m.type}</Badge>
                    <span className="text-xs text-slate-500">{new Date(m.date).toLocaleString()}</span>
                  </div>
                  <p className="mt-1">{m.quantity} → {m.newQuantity} {t.quantity}</p>
                  {m.notes && <p className="text-xs text-slate-500">{m.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

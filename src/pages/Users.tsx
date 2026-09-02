import { useState, type FormEvent } from "react";
import { useApp } from "../contexts/AppContext";
import { useToast } from "../contexts/ToastContext";
import { Button, Card, Input, Field, Modal, Badge, ConfirmModal, EmptyState, Select } from "../components/ui";
import type { User, Role } from "../types";
import { uid, hashPassword } from "../utils/storage";

const ROLE_TONE: Record<Role, "red" | "blue" | "slate"> = {
  admin: "red", manager: "blue", user: "slate",
};
const ROLE_LABEL: Record<Role, string> = {
  admin: "مدیر / Admin", manager: "مدیر / Manager", user: "کاروونکی / User",
};

export default function Users() {
  const { data, updateData, currentUser } = useApp();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [resetPwd, setResetPwd] = useState<User | null>(null);

  return (
    <div className="space-y-5">
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">د سیستم کاروونکي</h2>
          <p className="text-xs text-slate-500">User management with role-based access control</p>
        </div>
        <Button onClick={() => setCreating(true)} icon={<span>＋</span>}>نوی کاروونکی</Button>
      </Card>

      <Card>
        {data.users.length === 0 ? (
          <EmptyState icon="👥" title="هیڅ کاروونکی نشته" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold">کاروونکی</th>
                  <th className="text-right px-4 py-3 font-semibold">ایمیل</th>
                  <th className="text-right px-4 py-3 font-semibold">رول</th>
                  <th className="text-right px-4 py-3 font-semibold">حالت</th>
                  <th className="text-right px-4 py-3 font-semibold">وروستی ننوتل</th>
                  <th className="text-left px-4 py-3 font-semibold">عملونه</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-xs font-bold uppercase">
                          {u.username.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{u.fullName}</p>
                          <p className="text-xs text-slate-500">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700" dir="ltr">{u.email}</td>
                    <td className="px-4 py-3"><Badge tone={ROLE_TONE[u.role]}>{ROLE_LABEL[u.role]}</Badge></td>
                    <td className="px-4 py-3">
                      {u.active ? <Badge tone="green">✓ فعال</Badge> : <Badge tone="slate">غیرفعال</Badge>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setEditing(u)}>سمول</Button>
                        <Button size="sm" variant="ghost" onClick={() => setResetPwd(u)}>پټنوم</Button>
                        {u.id !== currentUser?.id && (
                          <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setConfirmDelete(u)}>حذف</Button>
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
        <UserForm
          initial={editing ?? undefined}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={async (u, plainPwd) => {
            if (editing) {
              updateData((d) => ({ ...d, users: d.users.map((x) => (x.id === u.id ? u : x)) }), { action: "update", entity: "user", details: u.username });
              toast("کاروونکی نوی شو", "success");
            } else {
              const hash = await hashPassword(plainPwd!);
              const fullUser: User = { ...u, passwordHash: hash };
              updateData((d) => ({ ...d, users: [...d.users, fullUser] }), { action: "create", entity: "user", details: u.username });
              toast("کاروونکی اضافه شو", "success");
            }
            setCreating(false); setEditing(null);
          }}
        />
      )}

      {resetPwd && (
        <ResetPasswordModal
          user={resetPwd}
          onClose={() => setResetPwd(null)}
          onSave={async (pwd) => {
            const hash = await hashPassword(pwd);
            updateData((d) => ({ ...d, users: d.users.map((x) => (x.id === resetPwd.id ? { ...x, passwordHash: hash } : x)) }), { action: "reset_password", entity: "user", details: resetPwd.username });
            toast("پټنوم بدل شو", "success");
            setResetPwd(null);
          }}
        />
      )}

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            updateData((d) => ({ ...d, users: d.users.filter((x) => x.id !== confirmDelete.id) }), { action: "delete", entity: "user", details: confirmDelete.username });
            toast("حذف شو", "info");
          }
        }}
        title="د حذف تایید"
        message={`آیا د "${confirmDelete?.username}" کاروونکي حذف کول غواړئ؟`}
      />
    </div>
  );
}

function UserForm({ initial, onClose, onSave }: { initial?: User; onClose: () => void; onSave: (u: User, plainPwd?: string) => void }) {
  const { data } = useApp();
  const [form, setForm] = useState<User>(
    initial ?? {
      id: uid("usr"),
      username: "",
      fullName: "",
      email: "",
      role: "user",
      passwordHash: "",
      createdAt: new Date().toISOString(),
      active: true,
    }
  );
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!form.username.trim()) err.username = "اړین";
    else if (!/^[a-zA-Z0-9_]{3,}$/.test(form.username)) err.username = "لږ تر لږه ۳ حروف، یوازې حروف/شمېرې/_";
    else if (data.users.some((u) => u.username.toLowerCase() === form.username.toLowerCase() && u.id !== form.id))
      err.username = "دا نوم مخکې شته";
    if (!form.fullName.trim()) err.fullName = "اړین";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = "اشتباه ایمیل";

    if (!initial) {
      if (pwd.length < 8) err.pwd = "پټنوم باید لږ تر لږه ۸ توري وي";
      else if (!/[A-Z]/.test(pwd) || !/[a-z]/.test(pwd) || !/[0-9]/.test(pwd))
        err.pwd = "پټنوم باید لوی او واړه حروف او یوه شمېره ولري";
      if (pwd !== pwd2) err.pwd2 = "پټنومونه سره نه برابرېږي";
    }

    if (Object.keys(err).length) { setErrors(err); return; }
    onSave(form, initial ? undefined : pwd);
  }

  const pwdStrength = passwordStrength(pwd);
  const strengthColors = ["bg-red-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500"];

  return (
    <Modal open onClose={onClose} title={initial ? "د کاروونکي سمول" : "نوی کاروونکی"} size="md"
      footer={<><Button variant="secondary" onClick={onClose}>کنسل</Button><Button onClick={submit as never}>{initial ? "ثبت" : "اضافه"}</Button></>}
    >
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4" noValidate>
        <Field label="د کارن نوم / Username" required error={errors.username}>
          <Input dir="ltr" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} invalid={!!errors.username} disabled={!!initial} />
        </Field>
        <Field label="بشپړ نوم / Full name" required error={errors.fullName}>
          <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} invalid={!!errors.fullName} />
        </Field>
        <Field label="ایمیل / Email" error={errors.email}>
          <Input dir="ltr" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} invalid={!!errors.email} />
        </Field>
        <Field label="رول / Role" required>
          <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            <option value="user">کاروونکی / User</option>
            <option value="manager">مدیر / Manager</option>
            <option value="admin">سیستم مدیر / Admin</option>
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            فعال حساب / Active account
          </label>
        </div>
        {!initial && (
          <>
            <Field label="پټنوم / Password" required error={errors.pwd} hint="لږ تر لږه ۸ توري، لوی/واړه حروف او شمېره">
              <Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} invalid={!!errors.pwd} />
              {pwd && (
                <div className="flex gap-1 mt-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${i < pwdStrength ? strengthColors[pwdStrength - 1] : "bg-slate-200"}`} />
                  ))}
                </div>
              )}
            </Field>
            <Field label="بیا پټنوم / Confirm" required error={errors.pwd2}>
              <Input type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} invalid={!!errors.pwd2} />
            </Field>
          </>
        )}
      </form>
    </Modal>
  );
}

function ResetPasswordModal({ user, onClose, onSave }: { user: User; onClose: () => void; onSave: (pwd: string) => void }) {
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [err, setErr] = useState("");

  function submit() {
    if (pwd.length < 8) { setErr("پټنوم باید لږ تر لږه ۸ توري وي"); return; }
    if (!/[A-Z]/.test(pwd) || !/[a-z]/.test(pwd) || !/[0-9]/.test(pwd)) { setErr("پټنوم باید لوی/واړه حروف او شمېره ولري"); return; }
    if (pwd !== pwd2) { setErr("پټنومونه سره نه برابرېږي"); return; }
    onSave(pwd);
  }

  return (
    <Modal open onClose={onClose} title={`د پټنوم بدلون - ${user.username}`} size="sm"
      footer={<><Button variant="secondary" onClick={onClose}>کنسل</Button><Button onClick={submit}>ثبت</Button></>}
    >
      <div className="space-y-3">
        {err && <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg px-3 py-2">{err}</div>}
        <Field label="نوی پټنوم" required><Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} /></Field>
        <Field label="بیا پټنوم" required><Input type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

function passwordStrength(pwd: string): number {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
}

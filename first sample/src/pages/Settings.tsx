import { useState } from "react";
import { useApp } from "../contexts/AppContext";
import { useToast } from "../contexts/ToastContext";
import { Button, Card, Input, Field } from "../components/ui";
import { hashPassword } from "../utils/storage";

export default function Settings() {
  const { currentUser, updateData } = useApp();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(currentUser?.fullName ?? "");
  const [email, setEmail] = useState(currentUser?.email ?? "");

  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwd2, setNewPwd2] = useState("");
  const [pwdErr, setPwdErr] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  function saveProfile() {
    if (!currentUser) return;
    updateData(
      (d) => ({ ...d, users: d.users.map((u) => (u.id === currentUser.id ? { ...u, fullName, email } : u)) }),
      { action: "update", entity: "user", details: "Updated own profile" }
    );
    toast("پروفایل نوی شو / Profile updated", "success");
  }

  async function changePassword() {
    if (!currentUser) return;
    setPwdErr("");
    if (newPwd.length < 8) { setPwdErr("نوی پټنوم باید لږ تر لږه ۸ توري وي"); return; }
    if (!/[A-Z]/.test(newPwd) || !/[a-z]/.test(newPwd) || !/[0-9]/.test(newPwd)) {
      setPwdErr("پټنوم باید لوی/واړه حروف او شمېره ولري"); return;
    }
    if (newPwd !== newPwd2) { setPwdErr("نوي پټنومونه سره نه برابرېږي"); return; }

    setPwdLoading(true);
    const curHash = await hashPassword(curPwd);
    if (curHash !== currentUser.passwordHash) {
      setPwdErr("اوسنی پټنوم اشتباه دی");
      setPwdLoading(false);
      return;
    }
    const newHash = await hashPassword(newPwd);
    updateData(
      (d) => ({ ...d, users: d.users.map((u) => (u.id === currentUser.id ? { ...u, passwordHash: newHash } : u)) }),
      { action: "change_password", entity: "user", details: "Changed own password" }
    );
    setCurPwd(""); setNewPwd(""); setNewPwd2("");
    setPwdLoading(false);
    toast("پټنوم په کامیابۍ سره بدل شو / Password changed", "success");
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">د پروفایل معلومات</h2>
        <p className="text-sm text-slate-500 mt-1">د خپل حساب معلومات تنظیم کړئ</p>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="د کارن نوم / Username">
            <Input value={currentUser?.username ?? ""} disabled />
          </Field>
          <Field label="رول / Role">
            <Input value={currentUser?.role ?? ""} disabled />
          </Field>
          <Field label="بشپړ نوم / Full name" required>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label="ایمیل / Email">
            <Input dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
        </div>
        <div className="mt-5 flex justify-end">
          <Button onClick={saveProfile}>ثبت / Save</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">د پټنوم بدلون</h2>
        <p className="text-sm text-slate-500 mt-1">د خپل حساب پټنوم په محفوظه توګه بدل کړئ</p>
        {pwdErr && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg px-3 py-2">{pwdErr}</div>
        )}
        <div className="mt-5 space-y-4">
          <Field label="اوسنی پټنوم / Current password" required>
            <Input type="password" value={curPwd} onChange={(e) => setCurPwd(e.target.value)} />
          </Field>
          <Field label="نوی پټنوم / New password" required hint="لږ تر لږه ۸ توري، لوی/واړه حروف او شمېره">
            <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
          </Field>
          <Field label="بیا نوی پټنوم / Confirm new password" required>
            <Input type="password" value={newPwd2} onChange={(e) => setNewPwd2(e.target.value)} />
          </Field>
        </div>
        <div className="mt-5 flex justify-end">
          <Button onClick={changePassword} loading={pwdLoading}>پټنوم بدل کړئ / Change password</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">د سیستم په اړه</h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <Info label="نوم" value="د تدارکاتو سیستم" />
          <Info label="Version" value="1.0.0" />
          <Info label="Storage" value="Local browser storage" />
          <Info label="د پټنوم خوندیتوب" value="SHA-256 hashing + salt" />
          <Info label="د سیشن وخت" value="۸ ساعته" />
          <Info label="د لاګ اعظمي شمېر" value="۵۰۰ ریکارډ" />
        </div>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-slate-50 rounded-lg">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-900 mt-0.5">{value}</p>
    </div>
  );
}

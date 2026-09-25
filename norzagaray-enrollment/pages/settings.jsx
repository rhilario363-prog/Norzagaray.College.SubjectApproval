import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const emptyForm = { firstName: '', middleName: '', lastName: '', email: '', currentPassword: '', newPassword: '', confirmPassword: '' };

export default function Settings() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [account, setAccount] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/auth/settings')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Sign in to manage your settings.')))
      .then(({ user }) => {
        setAccount(user);
        setForm((current) => ({ ...current, firstName: user.firstName, middleName: user.middleName, lastName: user.lastName, email: user.email }));
      })
      .catch((loadError) => { setError(loadError.message); router.replace('/'); });
  }, [router]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const save = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setVerificationUrl('');
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/auth/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Settings could not be saved.');
      setAccount(data.user);
      setForm((current) => ({ ...current, currentPassword: '', newPassword: '', confirmPassword: '' }));
      window.localStorage.setItem('norzagaray_user_profile', JSON.stringify({ userName: data.user.name, userRole: `${data.user.role} - ${data.user.department}`, department: data.user.department, program: data.user.program }));
      setMessage(data.message || 'Your account settings were saved.');
      setVerificationUrl(data.verificationUrl || '');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  if (!account) return <div className="min-h-screen flex items-center justify-center bg-slate-100 text-blue-950 font-bold">Loading settings...</div>;

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
          <div><p className="text-xs font-black uppercase tracking-widest text-yellow-600">Account settings</p><h1 className="text-2xl font-black text-blue-950">Manage your profile</h1><p className="text-sm text-slate-500 mt-1">Update your contact details and secure your account.</p></div>
          <button type="button" onClick={() => router.push(`/${account.role.toLowerCase()}/dashboard`)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold text-blue-950">Back</button>
        </div>
        <form onSubmit={save} className="space-y-6">
          <section><h2 className="text-sm font-black uppercase tracking-wider text-blue-950 mb-3">Personal details</h2><div className="grid sm:grid-cols-3 gap-3"><label className="text-sm font-semibold text-slate-700">First name<input required value={form.firstName} onChange={(event) => update('firstName', event.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg p-3" /></label><label className="text-sm font-semibold text-slate-700">Middle name<input value={form.middleName} onChange={(event) => update('middleName', event.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg p-3" /></label><label className="text-sm font-semibold text-slate-700">Last name<input required value={form.lastName} onChange={(event) => update('lastName', event.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg p-3" /></label></div><label className="block text-sm font-semibold text-slate-700 mt-3">Gmail address<input required type="email" value={form.email} onChange={(event) => update('email', event.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg p-3" /></label></section>
          <section><h2 className="text-sm font-black uppercase tracking-wider text-blue-950 mb-3">Change password</h2><p className="text-xs text-slate-500 mb-3">Leave these fields blank to keep your current password.</p><div className="grid sm:grid-cols-3 gap-3"><label className="text-sm font-semibold text-slate-700">Current password<input type="password" value={form.currentPassword} onChange={(event) => update('currentPassword', event.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg p-3" /></label><label className="text-sm font-semibold text-slate-700">New password<input type="password" minLength="8" value={form.newPassword} onChange={(event) => update('newPassword', event.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg p-3" /></label><label className="text-sm font-semibold text-slate-700">Confirm password<input type="password" minLength="8" value={form.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg p-3" /></label></div></section>
          {message && <p className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg p-3 text-sm font-semibold">{message}{verificationUrl && <><br /><a className="underline break-all" href={verificationUrl}>Open development verification link</a></>}</p>}
          {error && <p className="bg-rose-50 text-rose-700 border border-rose-200 rounded-lg p-3 text-sm font-semibold">{error}</p>}
          <button disabled={saving} className="w-full bg-blue-950 text-yellow-400 font-bold rounded-lg py-3 disabled:opacity-60" type="submit">{saving ? 'Saving settings...' : 'Save settings'}</button>
        </form>
      </div>
    </main>
  );
}

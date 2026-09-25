import { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';

const DEPARTMENTS = [
  { value: 'GENERAL', label: 'General Administration' },
  { value: 'BEED', label: 'BEED' },
  { value: 'BSED', label: 'BSEd' },
  { value: 'BSHM', label: 'BSHM' },
  { value: 'ACT', label: 'ACT' },
];

export default function StaffRegistrationForm({ role }) {
  const router = useRouter();
  const initialForm = { username: '', password: '', confirmPassword: '', firstName: '', middleName: '', lastName: '', email: '', department: 'BEED' };
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/auth/register-staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, role }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Staff account could not be created.');
      setMessage(`Professor account request created for ${data.user.name}. An administrator must approve it.`);
      setForm(initialForm);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-5">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5"><Image src="/norzagaray-college-logo.png" alt="Norzagaray College Seal" width={64} height={64} /><div><p className="text-xs font-black uppercase tracking-widest text-yellow-600">Professor account request</p><h1 className="text-2xl font-black text-blue-950">Create professor account</h1><p className="text-sm text-slate-500">An administrator reviews every professor account before access is granted.</p></div></div>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm font-semibold text-slate-700">First name<input required value={form.firstName} onChange={(event) => update('firstName', event.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg p-3" /></label>
          <label className="text-sm font-semibold text-slate-700">Middle name<input value={form.middleName} onChange={(event) => update('middleName', event.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg p-3" /></label>
          <label className="text-sm font-semibold text-slate-700">Last name<input required value={form.lastName} onChange={(event) => update('lastName', event.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg p-3" /></label>
          <label className="text-sm font-semibold text-slate-700">Gmail address<input required type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="staff@gmail.com" className="mt-1 w-full border border-slate-300 rounded-lg p-3" /></label>
          <label className="text-sm font-semibold text-slate-700">Username<input required minLength="4" value={form.username} onChange={(event) => update('username', event.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg p-3" /></label>
          <label className="text-sm font-semibold text-slate-700">Professor department<select value={form.department} onChange={(event) => update('department', event.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg p-3">{DEPARTMENTS.filter((department) => department.value !== 'GENERAL').map((department) => <option key={department.value} value={department.value}>{department.label}</option>)}</select></label>
          <label className="text-sm font-semibold text-slate-700">Password<input required minLength="8" type="password" value={form.password} onChange={(event) => update('password', event.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg p-3" /></label>
          <label className="text-sm font-semibold text-slate-700">Confirm password<input required minLength="8" type="password" value={form.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg p-3" /></label>
        </div>
        {message && <p className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg p-3 text-sm font-semibold">{message}</p>}
        {error && <p className="bg-rose-50 text-rose-700 border border-rose-200 rounded-lg p-3 text-sm font-semibold">{error}</p>}
        <div className="flex gap-3"><button disabled={saving} className="flex-1 bg-blue-950 text-yellow-400 font-bold rounded-lg py-3 disabled:opacity-60">{saving ? 'Creating request...' : 'Request professor account'}</button><button type="button" onClick={() => router.push('/login')} className="px-5 border border-slate-300 rounded-lg font-semibold">Back</button></div>
      </form>
    </main>
  );
}

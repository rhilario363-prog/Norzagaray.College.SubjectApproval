import { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';

const DEPARTMENTS = [
  { value: 'BEED', label: 'BEED - Elementary Education' },
  { value: 'BSED', label: 'BSEd - Secondary Education' },
  { value: 'BSHM', label: 'BSHM - Hospitality Management' },
  { value: 'BSCS', label: 'BSCS - Computer Science' },
  { value: 'ACT', label: 'ACT - Associate in Computer Technology' },
];

const PROGRAMS = {
  BEED: { label: 'Bachelor of Elementary Education', years: 4 },
  BSED: { label: 'Bachelor of Secondary Education', years: 4 },
  BSHM: { label: 'Bachelor of Science in Hospitality Management', years: 4 },
  BSCS: { label: 'Bachelor of Science in Computer Science', years: 4 },
  ACT: { label: 'Associate in Computer Technology', years: 2 },
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', firstName: '', middleName: '', lastName: '', email: '', department: 'BEED', program: PROGRAMS.BEED.label, studentIdNo: '', studentType: 'TRANSFEREE', transferSchool: '', transferCredits: 0 });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const selectDepartment = (department) => setForm((current) => ({ ...current, department, program: PROGRAMS[department].label }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    if (!/^[^\s@]+@gmail\.com$/i.test(form.email)) {
      setError('Enter a valid Gmail address, for example student@gmail.com.');
      setSaving(false);
      return;
    }
    if (!/(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}/.test(form.password)) {
      setError('Password must be at least 8 characters and include a number and special character.');
      setSaving(false);
      return;
    }
    if (!/^\d{4}-\d{4}$/.test(form.studentIdNo)) {
      setError('Student number must follow the format 2024-0008.');
      setSaving(false);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      setSaving(false);
      return;
    }
    try {
      const response = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Account could not be created.');
      setMessage(data.message);
      setVerificationUrl(data.verificationUrl || '');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-5">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5"><Image src="/norzagaray-college-logo.png" alt="Norzagaray College Seal" width={64} height={64} /><div><h1 className="text-2xl font-black text-blue-950">Create irregular student account</h1><p className="text-sm text-slate-500">Verify your email, then wait for administrator approval before signing in.</p></div></div>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm font-semibold text-slate-700">First name<input required value={form.firstName} onChange={(event) => update('firstName', event.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg p-3" /></label>
          <label className="text-sm font-semibold text-slate-700">Middle name<input value={form.middleName} onChange={(event) => update('middleName', event.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg p-3" /></label>
          <label className="text-sm font-semibold text-slate-700">Last name<input required value={form.lastName} onChange={(event) => update('lastName', event.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg p-3" /></label>
          <label className="text-sm font-semibold text-slate-700">Gmail address<input required type="email" pattern="^[^\s@]+@gmail\.com$" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="student@gmail.com" className="mt-1 w-full border border-slate-300 rounded-lg p-3" /></label>
          <label className="text-sm font-semibold text-slate-700">Username<input required minLength="4" value={form.username} onChange={(event) => update('username', event.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg p-3" /></label>
          <label className="text-sm font-semibold text-slate-700">Password<input required minLength="8" pattern="(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}" title="Minimum 8 characters with a number and special character" type="password" value={form.password} onChange={(event) => update('password', event.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg p-3" /></label>
          <label className="text-sm font-semibold text-slate-700">Confirm password<input required minLength="8" type="password" value={form.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg p-3" /></label>
          <label className="text-sm font-semibold text-slate-700">Department<select value={form.department} onChange={(event) => selectDepartment(event.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg p-3">{DEPARTMENTS.map((department) => <option key={department.value} value={department.value}>{department.label}</option>)}</select></label>
          <label className="text-sm font-semibold text-slate-700">Program<input required readOnly value={form.program} className="mt-1 w-full border border-slate-300 rounded-lg p-3 bg-slate-50 text-slate-600" /></label>
          <p className="md:col-span-2 text-xs text-blue-800 bg-blue-50 border border-blue-100 rounded-lg p-3">{PROGRAMS[form.department].label} is a {PROGRAMS[form.department].years}-year program.</p>
          <label className="text-sm font-semibold text-slate-700">Student type<select value={form.studentType} onChange={(event) => update('studentType', event.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg p-3"><option value="TRANSFEREE">Transferee</option><option value="RETURNEE">Returnee</option></select></label>
          <label className="text-sm font-semibold text-slate-700">Student number<input required pattern="^\d{4}-\d{4}$" title="Use the format 2024-0008" value={form.studentIdNo} onChange={(event) => update('studentIdNo', event.target.value)} placeholder="2024-0008" className="mt-1 w-full border border-slate-300 rounded-lg p-3" /></label>
          {form.studentType === 'TRANSFEREE' && <><label className="text-sm font-semibold text-slate-700">Previous school<input required value={form.transferSchool} onChange={(event) => update('transferSchool', event.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg p-3" /></label><label className="text-sm font-semibold text-slate-700">Transferable credits<input required type="number" min="0" value={form.transferCredits} onChange={(event) => update('transferCredits', event.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg p-3" /></label></>}
        </div>
        {message && <p className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg p-3 text-sm font-semibold">{message}{verificationUrl && <><br /><a className="underline break-all" href={verificationUrl}>Open development verification link</a></>}</p>}
        {error && <p className="bg-rose-50 text-rose-700 border border-rose-200 rounded-lg p-3 text-sm font-semibold">{error}</p>}
        <div className="flex gap-3"><button disabled={saving} className="flex-1 bg-blue-950 text-yellow-400 font-bold rounded-lg py-3 disabled:opacity-60">{saving ? 'Creating account...' : 'Create account'}</button><button type="button" onClick={() => router.push('/')} className="px-5 border border-slate-300 rounded-lg font-semibold">Back to login</button></div>
      </form>
    </main>
  );
}

import { useEffect, useState } from 'react';
import RoleGuard from '../../components/RoleGuard';
import Header from '../../components/Header';
import GeminiChatWidget from '../../components/GeminiChatWidget';

function AdminDashboardContent() {
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [courses, setCourses] = useState([]);

  const loadAccounts = async () => {
    const response = await fetch('/api/admin/accounts');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Accounts could not be loaded.');
    setAccounts(data.accounts);
  };

  const loadCourses = async () => {
    const response = await fetch('/api/courses');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Subjects could not be loaded.');
    setCourses(data.courses);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => Promise.all([loadAccounts(), loadCourses()]).catch((loadError) => setError(loadError.message)), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const decide = async (userId, accountStatus) => {
    setBusyId(userId);
    setError('');
    try {
      const response = await fetch('/api/admin/accounts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, accountStatus }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Account decision could not be saved.');
      setAccounts((current) => current.map((account) => account.id === userId ? { ...account, accountStatus: data.account.accountStatus } : account));
    } catch (decisionError) {
      setError(decisionError.message);
    } finally {
      setBusyId('');
    }
  };

  const decideCourse = async (id, status) => {
    setBusyId(id);
    try {
      const response = await fetch('/api/courses', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Subject decision could not be saved.');
      setCourses((current) => current.map((course) => course.id === id ? data.course : course));
    } catch (decisionError) {
      setError(decisionError.message);
    } finally {
      setBusyId('');
    }
  };

  const pending = accounts.filter((account) => account.accountStatus === 'PENDING');

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      <Header title="Administrator Approval" />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div><p className="text-xs font-black uppercase tracking-widest text-yellow-600">Account control</p><h1 className="text-2xl font-black text-blue-950">Review account requests</h1><p className="text-sm text-slate-500">Approve legitimate students and professors before they can enter the system.</p></div>
            <span className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 text-sm font-bold">{pending.length} pending</span>
          </div>
          {error && <p className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-3 text-sm font-semibold">{error}</p>}
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500"><th className="p-3">Applicant</th><th className="p-3">Access</th><th className="p-3">Department</th><th className="p-3">Email</th><th className="p-3">Status</th><th className="p-3 text-right">Decision</th></tr></thead><tbody className="divide-y divide-slate-100">{accounts.map((account) => <tr key={account.id}><td className="p-3"><span className="font-bold text-blue-950">{account.name}</span><span className="block text-xs text-slate-500">@{account.username}</span></td><td className="p-3">{account.role === 'ADVISER' ? 'Professor' : 'Student'}</td><td className="p-3">{account.department}</td><td className="p-3 text-slate-500">{account.email}</td><td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${account.accountStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : account.accountStatus === 'REJECTED' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{account.accountStatus}</span></td><td className="p-3 text-right whitespace-nowrap">{account.accountStatus !== 'APPROVED' && <button type="button" disabled={busyId === account.id} onClick={() => decide(account.id, 'APPROVED')} className="text-xs font-bold text-emerald-700 hover:underline disabled:opacity-50 mr-3">Approve</button>}{account.accountStatus !== 'REJECTED' && <button type="button" disabled={busyId === account.id} onClick={() => decide(account.id, 'REJECTED')} className="text-xs font-bold text-rose-700 hover:underline disabled:opacity-50">Reject</button>}</td></tr>)}{!accounts.length && <tr><td colSpan="6" className="p-8 text-center text-slate-500">No account requests yet.</td></tr>}</tbody></table></div>
        </section>
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between gap-3 mb-5"><div><p className="text-xs font-black uppercase tracking-widest text-yellow-600">Academic catalog control</p><h2 className="text-xl font-black text-blue-950">Subject requests</h2><p className="text-sm text-slate-500">Confirm the professor department before publishing a subject.</p></div><span className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 text-sm font-bold">{courses.filter((course) => course.status === 'PENDING').length} pending</span></div>
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500"><th className="p-3">Subject</th><th className="p-3">Department</th><th className="p-3">Units</th><th className="p-3">Schedule</th><th className="p-3">Status</th><th className="p-3 text-right">Decision</th></tr></thead><tbody className="divide-y divide-slate-100">{courses.map((course) => <tr key={course.id}><td className="p-3"><span className="font-bold text-blue-950">{course.code}</span><span className="block text-xs text-slate-500">{course.title}</span></td><td className="p-3 font-bold">{course.department}</td><td className="p-3">{course.units}</td><td className="p-3 text-slate-500">{course.schedule}</td><td className="p-3"><span className="rounded-full px-2 py-1 text-xs font-bold">{course.status}</span></td><td className="p-3 text-right whitespace-nowrap">{course.status !== 'APPROVED' && <button type="button" disabled={busyId === course.id} onClick={() => decideCourse(course.id, 'APPROVED')} className="text-xs font-bold text-emerald-700 hover:underline mr-3">Approve</button>}{course.status !== 'REJECTED' && <button type="button" disabled={busyId === course.id} onClick={() => decideCourse(course.id, 'REJECTED')} className="text-xs font-bold text-rose-700 hover:underline">Reject</button>}</td></tr>)}{!courses.length && <tr><td colSpan="6" className="p-8 text-center text-slate-500">No subjects recorded.</td></tr>}</tbody></table></div>
        </section>
      </main>
      <GeminiChatWidget studentContext={{ role: 'administrator', pendingAccounts: pending.length, pendingSubjects: courses.filter((course) => course.status === 'PENDING').length }} />
    </div>
  );
}

export default function AdminDashboard() {
  return <RoleGuard allowedRole="admin"><AdminDashboardContent /></RoleGuard>;
}

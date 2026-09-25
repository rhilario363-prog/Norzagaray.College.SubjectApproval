import { useState } from 'react';
import { useRouter } from 'next/router';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault(); setMessage(''); setError('');
    if (!router.isReady || !router.query.token) { setError('Open the password reset link from your email.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    const response = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: router.query.token, password }) });
    const data = await response.json();
    if (!response.ok) setError(data.error); else setMessage(data.message);
  };
  return <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4"><form onSubmit={submit} className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full space-y-4"><h1 className="text-2xl font-black text-blue-950">Set a new password</h1><input required minLength="8" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full border border-slate-300 rounded-lg p-3" placeholder="New password" /><input required minLength="8" type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="w-full border border-slate-300 rounded-lg p-3" placeholder="Confirm new password" />{message && <p className="bg-emerald-50 text-emerald-800 p-3 rounded-lg text-sm">{message}</p>}{error && <p className="bg-rose-50 text-rose-700 p-3 rounded-lg text-sm">{error}</p>}<button className="w-full bg-blue-950 text-yellow-400 font-bold rounded-lg py-3">Update password</button></form></main>;
}

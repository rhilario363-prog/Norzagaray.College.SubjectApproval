import { useState } from 'react';
import { useRouter } from 'next/router';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setMessage(''); setError(''); setSubmitting(true);
    try {
      const response = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await response.json();
      if (!response.ok) setError(data.error || 'Password recovery is unavailable right now.'); else setMessage(<>{data.message}{data.resetUrl && <><br /><a className="underline break-all" href={data.resetUrl}>Open development reset link</a></>}</>);
    } catch {
      setError('Cannot reach the server. Make sure npm run dev is running.');
    } finally {
      setSubmitting(false);
    }
  };
  return <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4"><form onSubmit={submit} className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full space-y-4"><h1 className="text-2xl font-black text-blue-950">Forgot password</h1><p className="text-sm text-slate-500">Enter the email address attached to your account.</p><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full border border-slate-300 rounded-lg p-3" placeholder="you@example.com" />{message && <p className="bg-emerald-50 text-emerald-800 p-3 rounded-lg text-sm">{message}</p>}{error && <p className="bg-rose-50 text-rose-700 p-3 rounded-lg text-sm">{error}</p>}<button disabled={submitting} className="w-full bg-blue-950 text-yellow-400 font-bold rounded-lg py-3 disabled:opacity-60">{submitting ? 'Sending...' : 'Send reset link'}</button><button type="button" onClick={() => router.push('/')} className="w-full text-sm font-bold text-blue-900">Back to sign in</button></form></main>;
}

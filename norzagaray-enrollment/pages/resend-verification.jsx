import { useState } from 'react';
import { useRouter } from 'next/router';

export default function ResendVerificationPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    setVerificationUrl('');
    setError('');
    try {
      const response = await fetch('/api/auth/resend-verification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await response.json();
      if (!response.ok) setError(data.error || 'Could not resend verification.');
      else { setMessage(data.message); setVerificationUrl(data.verificationUrl || ''); }
    } catch {
      setError('The verification service is unavailable. Please try again.');
    }
  };
  return <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4"><form onSubmit={submit} className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full space-y-4"><h1 className="text-2xl font-black text-blue-950">Resend verification</h1><p className="text-sm text-slate-500">Enter the Gmail address used during registration.</p><input required type="email" pattern="^[^\s@]+@gmail\.com$" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="student@gmail.com" className="w-full border border-slate-300 rounded-lg p-3" />{message && <p className="bg-emerald-50 text-emerald-800 p-3 rounded-lg text-sm">{message}{verificationUrl && <><br /><a className="underline break-all" href={verificationUrl}>Open development verification link</a></>}</p>}{error && <p className="bg-rose-50 text-rose-700 p-3 rounded-lg text-sm">{error}</p>}<button className="w-full bg-blue-950 text-yellow-400 font-bold rounded-lg py-3">Resend verification</button><button type="button" onClick={() => router.push('/')} className="w-full text-sm font-bold text-blue-900">Back to sign in</button></form></main>;
}

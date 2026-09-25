import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Verifying your email...');
  const [complete, setComplete] = useState(false);
  useEffect(() => {
    if (!router.isReady) return;
    const token = Array.isArray(router.query.token) ? router.query.token[0] : router.query.token;
    if (!token) {
      const timer = window.setTimeout(() => setMessage('This page needs the verification link from your Gmail message.'), 0);
      return () => window.clearTimeout(timer);
    }
    fetch('/api/auth/verify-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); setMessage(data.message); setComplete(true); })
      .catch((error) => setMessage(error.message));
  }, [router.isReady, router.query.token]);
  return <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center border border-slate-200"><p className="text-xs font-black uppercase tracking-widest text-yellow-600">Norzagaray College</p><h1 className="text-2xl font-black text-blue-950 mt-2">Email verification</h1><p className="mt-4 text-slate-600">{message}</p>{complete && <p className="mt-3 text-sm text-emerald-700 font-semibold">Your account is ready to use.</p>}<button onClick={() => router.push('/')} className="mt-6 bg-blue-950 text-yellow-400 font-bold rounded-lg px-5 py-3">Return to sign in</button></div></main>;
}

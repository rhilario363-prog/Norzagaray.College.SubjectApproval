import { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Invalid username or password.');
      localStorage.setItem('norzagaray_user_role', data.user.role.toLowerCase());
      localStorage.setItem('norzagaray_user_profile', JSON.stringify({ userName: data.user.name, userRole: `${data.user.role} - ${data.user.department}`, department: data.user.department, program: data.user.program }));
      router.push(`/${data.user.role.toLowerCase()}/dashboard`);
    } catch (loginError) {
      setError(loginError.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        
        {/* Left Side: Branding & Info */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-950 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-yellow-500/10 rounded-full blur-2xl"></div>
          <div>
            <Image src="/norzagaray-college-logo.png" alt="Norzagaray College Seal" width={72} height={72} className="mx-auto mb-4 object-contain" />
            <div className="inline-block px-3 py-1 bg-yellow-500/20 text-yellow-400 font-semibold text-xs rounded-full mb-4 border border-yellow-500/30">
              Norzagaray College Portal
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">Student Load & AI Scheduling</h1>
            <p className="text-blue-200 text-sm leading-relaxed">
              Integrated portal for automated course advising, UniFAST (RA 10931) compliance tracking, and administrator approvals.
            </p>
          </div>
          <div className="mt-8 pt-6 border-t border-blue-800/60 text-xs text-blue-300">
            Secure Academic Gateway &bull; Powered by Gemini AI
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back</h2>
          <p className="text-sm text-gray-500 mb-6">Use one account. Your approved access is detected automatically.</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Username</label>
              <input required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none transition text-sm text-gray-800" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Password</label>
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none transition text-sm text-gray-800" />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-600 text-blue-950 font-extrabold rounded-xl shadow-md transition-all duration-200 text-sm tracking-wide"
            >
              Sign In to Dashboard
            </button>
            {error && <p className="text-sm font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">{error}</p>}
            <p className="text-xs text-gray-500">New accounts become available after email verification and administrator approval.</p>
            <button type="button" onClick={() => router.push('/register')} className="text-sm font-bold text-blue-900 hover:underline">Create a student account</button>
            <button type="button" onClick={() => router.push('/register/adviser')} className="block text-sm font-bold text-blue-900 hover:underline">Request a professor account</button>
            <button type="button" onClick={() => router.push('/forgot-password')} className="block text-sm font-bold text-blue-900 hover:underline">Forgot password?</button>
            <button type="button" onClick={() => router.push('/resend-verification')} className="block text-sm font-bold text-blue-900 hover:underline">Didn&apos;t receive verification email?</button>
          </form>
        </div>

      </div>
    </div>
  );
}
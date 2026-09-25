import { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const data = await response.json().catch(() => ({ error: `The server returned an invalid response (HTTP ${response.status}).` }));
      if (!response.ok) throw new Error(data.error || 'Invalid username or password.');
      localStorage.setItem('norzagaray_user_role', data.user.role.toLowerCase());
      localStorage.setItem('norzagaray_user_profile', JSON.stringify({ userName: data.user.name, userRole: `${data.user.role} - ${data.user.department}`, department: data.user.department, program: data.user.program }));
      router.push(`/${data.user.role.toLowerCase()}/dashboard`);
    } catch (loginError) {
      setError(loginError.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border-t-8 border-blue-900">
        <div className="text-center mb-6">
          <Image src="/norzagaray-college-logo.png" alt="Norzagaray College Seal" width={72} height={72} className="mx-auto mb-3 object-contain" />
          <h1 className="text-2xl font-bold text-blue-900">Norzagaray College</h1>
          <p className="text-yellow-600 font-semibold text-sm">Enrollment & AI Scheduling Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full border-gray-300 rounded-lg p-2.5 border text-gray-800" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="flex gap-2"><input required type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="min-w-0 flex-1 border-gray-300 rounded-lg p-2.5 border text-gray-800" /><button type="button" onClick={() => setShowPassword((current) => !current)} className="border border-gray-300 rounded-lg px-3 text-sm font-bold text-blue-900">{showPassword ? 'Hide' : 'Show'}</button></div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-900 hover:bg-blue-800 text-yellow-400 font-bold py-3 rounded-lg shadow transition"
          >
            Access Portal
          </button>
          {error && <p className="text-sm font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">{error}</p>}
          <p className="text-xs text-gray-500">Use one login. Your approved student, professor, or admin access is detected automatically.</p>
          <button type="button" onClick={() => router.push('/register')} className="text-sm font-bold text-blue-900 hover:underline">Create a student account</button>
          <button type="button" onClick={() => router.push('/register/adviser')} className="block text-sm font-bold text-blue-900 hover:underline">Request a professor account</button>
          <button type="button" onClick={() => router.push('/forgot-password')} className="block text-sm font-bold text-blue-900 hover:underline">Forgot password?</button>
          <button type="button" onClick={() => router.push('/resend-verification')} className="block text-sm font-bold text-blue-900 hover:underline">Didn&apos;t receive verification email?</button>
        </form>
      </div>
    </div>
  );
}
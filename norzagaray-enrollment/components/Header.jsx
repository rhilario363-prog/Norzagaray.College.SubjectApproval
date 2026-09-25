import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';

export default function Header({ title, userName = 'Juan Dela Cruz', userRole = 'Irregular Student (BSCS)' }) {
  const router = useRouter();
  const [profile, setProfile] = useState({ userName, userRole });

  useEffect(() => {
    const storedProfile = window.localStorage.getItem('norzagaray_user_profile');
    if (!storedProfile) return undefined;
    const timer = window.setTimeout(() => setProfile(JSON.parse(storedProfile)), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to log out?')) return;
    fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
      window.localStorage.removeItem('norzagaray_user_role');
      window.localStorage.removeItem('norzagaray_user_profile');
      router.replace('/').then(() => router.reload());
    });
  };
  return (
    <header className="bg-blue-900 text-white shadow-md border-b-4 border-yellow-400 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image
            src="/norzagaray-college-logo.png"
            alt="Norzagaray College Seal"
            width={48}
            height={48}
            className="w-12 h-12 bg-white rounded-full p-1 shadow-md object-contain border-2 border-yellow-400"
          />
          <div>
            <h1 className="text-lg font-extrabold tracking-wide text-white uppercase leading-tight">
              Norzagaray College
            </h1>
            <p className="text-xs font-semibold text-yellow-300 tracking-wider">
              College Enrollment System
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <div className="text-sm font-bold text-white">{profile.userName}</div>
            <div className="text-xs text-yellow-300 font-medium">{profile.userRole}</div>
          </div>
          <span className="bg-yellow-400 text-blue-950 font-bold text-xs px-3 py-1.5 rounded-full uppercase tracking-wider shadow-xs">
            A.Y. 2026–2027
          </span>
          {title && <span className="hidden xl:block text-xs text-blue-200 border-l border-blue-700 pl-4">{title}</span>}
          <Link href="/settings" className="text-xs font-bold text-white/80 hover:text-white transition">Settings</Link>
          <button onClick={handleLogout} className="text-xs font-bold text-white/80 hover:text-white transition" type="button">
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
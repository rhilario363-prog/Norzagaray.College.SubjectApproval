import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function RoleGuard({ allowedRole, children }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('unauthorized')))
      .then(({ user }) => {
        const userRole = user.role.toLowerCase();
        localStorage.setItem('norzagaray_user_role', userRole);
        localStorage.setItem('norzagaray_user_profile', JSON.stringify({ userName: user.name, userRole: `${user.role} - ${user.department}`, department: user.department, program: user.program }));
        if (userRole !== allowedRole) router.replace(`/${userRole}/dashboard`);
        else if (active) setAuthorized(true);
      })
      .catch(() => router.replace('/'));
    return () => { active = false; };
  }, [router, allowedRole]);

  if (!authorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-blue-900 text-yellow-400 font-bold text-lg">
        Verifying Credentials...
      </div>
    );
  }

  return <>{children}</>;
}
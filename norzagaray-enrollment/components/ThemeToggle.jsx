import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('norzagaray_theme');
    const isDark = savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', isDark);
    const timer = window.setTimeout(() => setDark(isDark), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const nextDark = !dark;
    document.documentElement.classList.toggle('dark', nextDark);
    window.localStorage.setItem('norzagaray_theme', nextDark ? 'dark' : 'light');
    setDark(nextDark);
  };

  return <button type="button" onClick={toggleTheme} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'} title={dark ? 'Light theme' : 'Dark theme'} className="theme-toggle">{dark ? 'Light' : 'Dark'}</button>;
}
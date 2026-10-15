import '../styles/globals.css';
import { useRouter } from 'next/router';
import ThemeToggle from '../components/ThemeToggle';

export default function App({ Component, pageProps }) {
  const { pathname } = useRouter();
  const hasDashboardHeader = ['/admin/dashboard', '/adviser/dashboard', '/student/dashboard'].includes(pathname);
  return <><Component {...pageProps} />{!hasDashboardHeader && <ThemeToggle floating />}</>;
}

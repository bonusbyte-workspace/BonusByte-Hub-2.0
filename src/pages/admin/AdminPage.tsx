import { useAuth } from '@/hooks/useAuth';
import AdminLogin  from '@/components/admin/AdminLogin';
import AdminPortal from '@/components/admin/AdminPortal';

/**
 * AdminPage — accessible ONLY via direct URL entry of VITE_ADMIN_ROUTE (/bb-nexus-7k).
 * Zero navigation links point here. Authentication + role check happen inside.
 */
export default function AdminPage() {
  const { isAuthorized, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-8 h-8 border border-chrome-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return isAuthorized ? <AdminPortal /> : <AdminLogin />;
}

import { ADMIN_EMAILS } from '@/lib/constants';
import { getUser } from '@/lib/supabase/server';
import AdminLayoutClient from './AdminLayoutClient';

export const dynamic = 'force-dynamic';

/**
 * Admin layout — auth is handled by middleware.
 * This just passes user info to the client component.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  // Middleware already verified admin status — this is defensive
  const email = user?.email || '';
  const isAdmin = ADMIN_EMAILS.some(
    (a) => a.toLowerCase() === email.toLowerCase()
  );

  return (
    <AdminLayoutClient isAdmin={isAdmin} email={email}>
      {children}
    </AdminLayoutClient>
  );
}

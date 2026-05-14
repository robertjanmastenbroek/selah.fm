import { redirect } from 'next/navigation';
import { ADMIN_EMAILS } from '@/lib/constants';
import { getUser } from '@/lib/supabase/server';
import AdminLayoutClient from './AdminLayoutClient';

// Force dynamic rendering — auth check on every request
export const dynamic = 'force-dynamic';

/**
 * Admin layout — server component.
 * Uses Supabase Auth to verify the user is authenticated and an admin.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  if (!user?.email) {
    redirect('/login?redirect=/admin');
  }

  const isAdmin = ADMIN_EMAILS.some(
    (a) => a.toLowerCase() === user.email!.toLowerCase()
  );

  if (!isAdmin) {
    redirect('/');
  }

  return (
    <AdminLayoutClient isAdmin={isAdmin} email={user.email}>
      {children}
    </AdminLayoutClient>
  );
}

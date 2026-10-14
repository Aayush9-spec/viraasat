import { requireRole } from '@/features/auth/services/require-role';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole('admin');
  return children;
}
import { redirect } from 'next/navigation';

export default function OrdersPage() {
  redirect('/dashboard?tab=orders');
}

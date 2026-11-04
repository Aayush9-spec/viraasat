import { redirect } from 'next/navigation';

export default function WishlistPage() {
  redirect('/dashboard?tab=wishlist');
}

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="text-7xl font-extrabold text-primary/30 mb-4 font-serif">404</div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Masterpiece Not Found</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        The page or artisan craft you are looking for might have been moved, renamed, or is currently unavailable.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Button asChild variant="default" size="lg">
          <Link href="/shop">Explore Marketplace</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    </div>
  );
}

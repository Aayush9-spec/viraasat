import Link from 'next/link';

export function ViraasatLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center space-x-2 ${className}`}>
      <span className="font-serif text-2xl font-bold text-primary">Heritage</span>
    </Link>
  );
}

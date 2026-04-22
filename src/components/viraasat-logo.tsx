import Link from 'next/link';

export function ViraasatLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center space-x-2 ${className}`}>
      <span className="font-heading text-3xl font-bold text-amber-900">Viraasat</span>
    </Link>
  );
}

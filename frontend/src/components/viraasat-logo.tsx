import Link from 'next/link';

export function ViraasatLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center space-x-2 group ${className}`}>
      <span className="font-heading text-3xl font-bold text-primary transition-colors duration-300 group-hover:text-primary/80">Viraasat</span>
    </Link>
  );
}

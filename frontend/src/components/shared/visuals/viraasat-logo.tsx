'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/core/utils/utils';

export interface ViraasatLogoProps {
  className?: string;
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  priority?: boolean;
  href?: string;
  onClick?: () => void;
}

export function ViraasatLogo({
  className,
  variant = 'full',
  size = 'md',
  priority = true,
  href = '/',
  onClick,
}: ViraasatLogoProps) {
  // Dimension mappings keeping exact aspect ratios:
  // Full logo: 755 x 472 (aspect ratio ~ 1.6 : 1)
  // Icon logo: 485 x 485 (aspect ratio 1 : 1)
  const fullSizeClasses = {
    sm: 'h-8 w-auto min-w-[48px]',
    md: 'h-10 sm:h-11 w-auto min-w-[62px]',
    lg: 'h-14 sm:h-16 w-auto min-w-[88px]',
    xl: 'h-20 sm:h-24 w-auto min-w-[126px]',
  };

  const iconSizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9 sm:h-10 sm:w-10',
    lg: 'h-12 w-12 sm:h-14 sm:w-14',
    xl: 'h-18 w-18 sm:h-20 sm:w-20',
  };

  const isIcon = variant === 'icon';
  const src = isIcon ? '/viraasat-logo-icon.png' : '/viraasat-logo-full.png';
  const width = isIcon ? 485 : 755;
  const height = isIcon ? 485 : 472;

  const content = (
    <div className={cn('relative inline-flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-[1.02]', className)}>
      <Image
        src={src}
        alt="Viraasat – Indian Handicraft Marketplace"
        width={width}
        height={height}
        priority={priority}
        className={cn(
          'object-contain transition-opacity duration-200',
          isIcon ? iconSizeClasses[size] : fullSizeClasses[size]
        )}
      />
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className="inline-flex items-center shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B4B] rounded-lg"
      aria-label="Viraasat – Indian Handicraft Marketplace"
    >
      {content}
    </Link>
  );
}

export default ViraasatLogo;

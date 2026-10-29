'use client';

import { ProductForm } from '@/features/artisan/components/product-form';
import { useTranslation } from '@/core/hooks/use-translation';

export default function ArtisanNewProductPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold">
          {t('artisan.listNewProduct') || 'List New Heritage Product'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t('artisan.listNewProductSubtitle') || 'Fill in details, run computer vision scans, and apply AI pricing recommendations.'}
        </p>
      </div>
      <ProductForm />
    </div>
  );
}

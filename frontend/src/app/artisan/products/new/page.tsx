import { ProductForm } from '@/features/artisan/components/product-form';

export default function ArtisanNewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold">List New Heritage Product</h1>
        <p className="text-muted-foreground text-sm">
          Fill in details, run computer vision scans, and apply AI pricing recommendations.
        </p>
      </div>
      <ProductForm />
    </div>
  );
}

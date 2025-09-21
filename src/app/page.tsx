'use client';
import ProductCard from '@/components/product-card';
import { products } from '@/lib/data';
import { useTranslation } from '@/hooks/use-translation';

export default function Marketplace() {
  const { t } = useTranslation();
  const missionProducts = products.slice(0, 8);
  const gridProducts = products.slice(8, 12);

  return (
    <div>
      <header className="relative overflow-hidden text-center py-20 md:py-28 bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-lg text-amber-800 mb-2">{t('home.hero.subtitle')}</p>
          <h1 className="font-heading text-7xl md:text-9xl font-semibold text-amber-900">
            Viraasat
          </h1>
          <p className="text-base text-gray-600 mt-4 max-w-xl mx-auto">
            {t('home.hero.description')}
          </p>
        </div>
      </header>

      <section id="mission" className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
           <h2 className="text-4xl font-heading font-semibold text-amber-900 mb-4">{t('home.mission.title')}</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              {t('home.mission.description')}
            </p>
        </div>
      </section>

      <section id="product-grid" className="py-16 bg-gradient-to-b from-orange-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                variant="grid"
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

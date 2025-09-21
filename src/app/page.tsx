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
      <header className="relative overflow-hidden text-center hero-section">
        <div className="max-w-4xl mx-auto px-4 pt-20 md:pt-28 pb-12 md:pb-20">
          <p className="text-lg text-amber-800 mb-2">{t('home.hero.subtitle')}</p>
          <h1 className="font-heading text-7xl md:text-9xl font-semibold text-amber-900">
            Viraasat
          </h1>
          <p className="text-base text-gray-600 mt-4 max-w-xl mx-auto">
            {t('home.hero.description')}
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M1440 120H0V26.2205C159.549 34.9398 325.753 38.6479 495.733 36.837C778.361 33.722 1056.49 14.8687 1440 0V120Z" fill="#FFFFFF"/>
            <path d="M0 26.2205C159.549 34.9398 325.753 38.6479 495.733 36.837C778.361 33.722 1056.49 14.8687 1440 0V26.2205C1236.42 41.5977 945.71 52.0017 662.006 49.3172C427.351 47.1121 213.385 36.9698 0 26.2205Z" fill="#FDFBF8" fillOpacity="0.5"/>
          </svg>
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

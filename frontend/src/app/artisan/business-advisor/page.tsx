import { BusinessAdvisor } from '@/features/analytics/components/business-advisor';

export default function ArtisanBusinessAdvisorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold">AI Business Advisor</h1>
        <p className="text-muted-foreground text-sm">
          Predictive demand forecasting, price optimization, and raw materials hedging.
        </p>
      </div>
      <BusinessAdvisor />
    </div>
  );
}

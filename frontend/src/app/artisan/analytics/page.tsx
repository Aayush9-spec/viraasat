import { SocialImpact } from '@/features/analytics/components/social-impact';

export default function ArtisanAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold">Artisan Analytics & Social Impact</h1>
        <p className="text-muted-foreground text-sm">
          Track sales performance, income multipliers, and community empowerment metrics.
        </p>
      </div>
      <SocialImpact />
    </div>
  );
}

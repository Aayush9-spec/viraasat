import { SustainabilityAnalytics } from '@/components/sustainability-analytics';
import { SocialImpact } from '@/components/social-impact';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SustainabilityDashboardPage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="sustainability" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/50 backdrop-blur-sm">
          <TabsTrigger value="sustainability" className="py-3 data-[state=active]:bg-background">
            Sustainability Analytics
          </TabsTrigger>
          <TabsTrigger value="social-impact" className="py-3 data-[state=active]:bg-background">
            Social Impact & Community
          </TabsTrigger>
        </TabsList>
        <TabsContent value="sustainability">
          <SustainabilityAnalytics />
        </TabsContent>
        <TabsContent value="social-impact">
          <SocialImpact />
        </TabsContent>
      </Tabs>
    </div>
  );
}

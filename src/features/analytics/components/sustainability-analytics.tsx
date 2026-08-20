'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Leaf, Award, Globe, Scale, Droplet, Wind } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const carbonData = [
  { name: 'Pottery Vases', footprint: 0.82, target: 0.90 },
  { name: 'Woolen Shawls', footprint: 1.45, target: 1.80 },
  { name: 'Silver Jewelry', footprint: 2.10, target: 2.50 },
  { name: 'Khadi Scarves', footprint: 0.35, target: 0.50 }
];

const materialMixData = [
  { name: 'Eco-certified Wool', value: 45, color: '#8b4513' },
  { name: 'Local Clay & Quartz', value: 30, color: '#d2b48c' },
  { name: 'Organic Cotton', value: 20, color: '#556b2f' },
  { name: 'Recycled Metals', value: 5, color: '#708090' }
];

export function SustainabilityAnalytics() {
  return (
    <div className="space-y-6">
      {/* Upper Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-none border-amber-900/10 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs uppercase tracking-widest font-bold text-amber-900/50">Sustainability Score</CardTitle>
            <Award className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-bold font-heading text-[#5e2c18]">94 / 100</div>
            <p className="text-[10px] text-green-600 uppercase font-bold tracking-wider mt-1">Excellent (Top 5% of Artisans)</p>
          </CardContent>
        </Card>
        
        <Card className="rounded-none border-amber-900/10 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs uppercase tracking-widest font-bold text-amber-900/50">Carbon Offsets</CardTitle>
            <Leaf className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-bold font-heading text-[#5e2c18]">1.25 Tonnes</div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">CO2 equivalent offset this year</p>
          </CardContent>
        </Card>

        <Card className="rounded-none border-amber-900/10 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs uppercase tracking-widest font-bold text-amber-900/50">Local Sourcing Ratio</CardTitle>
            <Globe className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-bold font-heading text-[#5e2c18]">95.8%</div>
            <p className="text-[10px] text-green-600 uppercase font-bold tracking-wider mt-1">Sourced within 50km radius</p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-none border-amber-900/10 bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-heading text-[#5e2c18]">Product Carbon Intensity (kg CO2e)</CardTitle>
            <CardDescription>Product footprint compared to industry maximum benchmarks.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={carbonData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" stroke="#5e2c18" fontSize={10} tickLine={false} />
                <YAxis stroke="#5e2c18" fontSize={10} tickLine={false} />
                <Tooltip />
                <Bar dataKey="footprint" name="Our Footprint" fill="#556b2f" radius={[0, 0, 0, 0]} />
                <Bar dataKey="target" name="Industry Limit" fill="#d2b48c" opacity={0.3} radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-none border-amber-900/10 bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-heading text-[#5e2c18]">Ecological Material Composition</CardTitle>
            <CardDescription>Raw materials verified by blockchain certification.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] flex items-center justify-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={materialMixData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {materialMixData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2 text-left">
              {materialMixData.map((mat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 shrink-0" style={{ backgroundColor: mat.color }} />
                  <span className="text-xs font-semibold truncate">{mat.name} ({mat.value}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sustainable Practices Audit checklist */}
      <Card className="rounded-none border-amber-900/10 bg-white text-left">
        <CardHeader>
          <CardTitle className="text-lg font-heading text-[#5e2c18]">Environmental Compliance Checklist</CardTitle>
          <CardDescription>Verified sustainability criteria matching global retail directives.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { icon: Droplet, title: "Zero Toxic Effluents", desc: "Dyeing techniques filtered and checked for water source safety.", status: "Verified" },
            { icon: Scale, title: "Fair Wages & Ethics", desc: "Artisan wages mapped and logged on ledger chain above average rural minimums.", status: "Verified" },
            { icon: Wind, title: "Carbon Neutral Shipping Integration", desc: "All shipments packed in 100% biodegradable corrugated boxes.", status: "Verified" }
          ].map((item, i) => (
            <div key={i} className="flex gap-4 items-start p-3 bg-[#fbf7f0]/30 border border-amber-900/5">
              <item.icon className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-xs font-bold text-[#5e2c18]">{item.title}</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
              <Badge className="bg-green-600 rounded-none text-[9px] font-bold py-0.5 px-2 uppercase tracking-wider">{item.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

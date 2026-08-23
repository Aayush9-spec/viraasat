'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, Legend } from 'recharts';
import { Heart, Users, Map, Star, Coins } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const densityData = [
  { state: 'Rajasthan', artisans: 850, density: 92 },
  { state: 'Bihar', artisans: 640, density: 78 },
  { state: 'Gujarat', artisans: 720, density: 85 },
  { state: 'Kashmir', artisans: 410, density: 60 },
  { state: 'Andhra Pradesh', artisans: 320, density: 45 }
];

const incomeGrowthData = [
  { year: '2023', baseline: 12000, current: 12000 },
  { year: '2024', baseline: 12800, current: 15400 },
  { year: '2025', baseline: 13500, current: 20100 },
  { year: '2026', baseline: 14200, current: 27800 }
];

export function SocialImpact() {
  return (
    <div className="space-y-6 text-left">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-none border-amber-900/10 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-amber-900/50">Artisan Guilds</CardTitle>
            <Users className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-bold font-heading text-[#5e2c18]">2,940</div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Active Rural Families</p>
          </CardContent>
        </Card>

        <Card className="rounded-none border-amber-900/10 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-amber-900/50">Women Employment</CardTitle>
            <Heart className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-bold font-heading text-[#5e2c18]">68.4%</div>
            <p className="text-[10px] text-green-600 uppercase font-bold tracking-wider mt-1">+12.4% YoY Growth</p>
          </CardContent>
        </Card>

        <Card className="rounded-none border-amber-900/10 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-amber-900/50">Income Multiplier</CardTitle>
            <Coins className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-bold font-heading text-[#5e2c18]">1.95x</div>
            <p className="text-[10px] text-green-600 uppercase font-bold tracking-wider mt-1">Earnings vs Local Farm Hand</p>
          </CardContent>
        </Card>

        <Card className="rounded-none border-amber-900/10 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-amber-900/50">GI Preservation</CardTitle>
            <Map className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-bold font-heading text-[#5e2c18]">14 active</div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Certified GI craft guilds</p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Growth Chart */}
        <Card className="rounded-none border-amber-900/10 bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-heading text-[#5e2c18]">Average Artisan Monthly Income (INR)</CardTitle>
            <CardDescription>Viraasat direct platform earnings vs local middleman market baseline.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={incomeGrowthData}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b4513" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b4513" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="year" stroke="#5e2c18" fontSize={10} tickLine={false} />
                <YAxis stroke="#5e2c18" fontSize={10} tickLine={false} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="current" name="Viraasat Direct Income" stroke="#8b4513" fillOpacity={1} fill="url(#colorCurrent)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="baseline" name="Middleman Baseline Market" stroke="#d2b48c" fillOpacity={0} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* State wise Density Chart */}
        <Card className="rounded-none border-amber-900/10 bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-heading text-[#5e2c18]">State-wise Artisan Density & Engagement</CardTitle>
            <CardDescription>Number of registered families per state with platform participation index.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={densityData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="state" stroke="#5e2c18" fontSize={10} tickLine={false} />
                <YAxis stroke="#5e2c18" fontSize={10} tickLine={false} />
                <Tooltip />
                <Bar dataKey="artisans" name="Registered Artisans" fill="#5e2c18" radius={[0, 0, 0, 0]} />
                <Bar dataKey="density" name="Platform Engagement Index" fill="#b45309" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { AlertCircle, Brain, Sparkles, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

import { BACKEND_URL } from '@/services/backend/client';

export function BusinessAdvisor() {
  const [region, setRegion] = useState('Rajasthan');
  const [category, setCategory] = useState('Home Decor');
  const [forecast, setForecast] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchForecast() {
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/forecast-demand?region=${region}&category=${category}`);
        if (res.ok) {
          const data = await res.json();
          setForecast(data.time_series || []);
          setWarnings(data.warnings || []);
        } else {
          throw new Error();
        }
      } catch (err) {
        // Fallback simulated demand forecast
        setForecast([
          { month: 'Jan', demand_index: 45, tourist_inflow_k: 120 },
          { month: 'Feb', demand_index: 50, tourist_inflow_k: 130 },
          { month: 'Mar', demand_index: 48, tourist_inflow_k: 110 },
          { month: 'Apr', demand_index: 40, tourist_inflow_k: 80 },
          { month: 'May', demand_index: 35, tourist_inflow_k: 50 },
          { month: 'Jun', demand_index: 30, tourist_inflow_k: 40 },
          { month: 'Jul', demand_index: 38, tourist_inflow_k: 60 },
          { month: 'Aug', demand_index: 55, tourist_inflow_k: 90 },
          { month: 'Sep', demand_index: 62, tourist_inflow_k: 100 },
          { month: 'Oct', demand_index: 85, tourist_inflow_k: 150 },
          { month: 'Nov', demand_index: 95, tourist_inflow_k: 180 },
          { month: 'Dec', demand_index: 80, tourist_inflow_k: 140 }
        ]);
        setWarnings([
          "Diwali festival spikes demand: Recommended to double production batches for Blue Pottery vases.",
          "High tourism season in November: Ready stocks for Home Decor items in Rajasthan region."
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchForecast();
  }, [region, category]);

  return (
    <div className="space-y-6 text-left">
      {/* AI Header */}
      <Card className="rounded-none border-amber-900/10 bg-[#fbf7f0] shadow-sm">
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="p-3 bg-[#5e2c18] text-white">
            <Brain className="h-6 w-6 text-amber-300" />
          </div>
          <div>
            <CardTitle className="text-xl font-heading text-[#5e2c18] flex items-center gap-2">
              Viraasat AI Business Advisor
              <Badge variant="outline" className="border-amber-900/20 text-[#5e2c18] font-mono text-[9px]">LSTM & XGBoost Models</Badge>
            </CardTitle>
            <CardDescription>Predictive intelligence for optimizing artisan sales, inventory, and materials sourcing.</CardDescription>
          </div>
        </CardHeader>
      </Card>

      {/* Warnings & Actionable Alerts */}
      {warnings.length > 0 && (
        <div className="space-y-3">
          {warnings.map((warn, i) => (
            <Alert key={i} className="rounded-none bg-amber-50/50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-xs font-bold text-[#5e2c18]">AI Strategic Alert</AlertTitle>
              <AlertDescription className="text-xs text-amber-900/80 mt-1 flex justify-between items-center gap-4 flex-wrap">
                <span>{warn}</span>
                <Button size="sm" className="bg-[#5e2c18] hover:bg-[#4a2315] text-white text-[10px] uppercase font-bold rounded-none tracking-wider gap-1.5 h-8">
                  Optimize Inventory <ArrowRight className="h-3 w-3" />
                </Button>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Demand Curve Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="rounded-none border-amber-900/10 bg-white lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <CardTitle className="text-lg font-heading text-[#5e2c18]">12-Month Demand Forecast</CardTitle>
                <CardDescription>Predicted market demand index mapped against historical tourist inflow.</CardDescription>
              </div>
              <div className="flex gap-2">
                <select 
                  value={region} 
                  onChange={(e) => setRegion(e.target.value)} 
                  className="text-xs bg-[#fbf7f0] border border-amber-900/10 p-1.5 rounded-none font-bold text-[#5e2c18]"
                >
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Kashmir">Kashmir</option>
                  <option value="Kutch">Kutch</option>
                  <option value="Bihar">Bihar</option>
                </select>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  className="text-xs bg-[#fbf7f0] border border-amber-900/10 p-1.5 rounded-none font-bold text-[#5e2c18]"
                >
                  <option value="Home Decor">Home Decor</option>
                  <option value="Textiles">Textiles</option>
                  <option value="Jewelry">Jewelry</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Running ML forecast...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecast}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="month" stroke="#5e2c18" fontSize={10} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#5e2c18" fontSize={10} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#b45309" fontSize={10} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="demand_index" name="Demand Index" stroke="#5e2c18" strokeWidth={2.5} activeDot={{ r: 8 }} />
                  <Line yAxisId="right" type="monotone" dataKey="tourist_inflow_k" name="Tourist Inflow (K)" stroke="#b45309" strokeWidth={1.5} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Advisor recommendations */}
        <Card className="rounded-none border-amber-900/10 bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-heading text-[#5e2c18]">AI Strategic Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 border-l-2 border-l-[#5e2c18] bg-[#fbf7f0]/40">
              <h4 className="text-xs font-bold text-[#5e2c18]">Recommended pricing strategy</h4>
              <p className="text-[11px] text-muted-foreground mt-1">Based on current low stock, increase vase listing prices by 5% ahead of festive season.</p>
            </div>
            <div className="p-3 border-l-2 border-l-amber-500 bg-amber-50/10">
              <h4 className="text-xs font-bold text-[#5e2c18]">Raw material hedging</h4>
              <p className="text-[11px] text-muted-foreground mt-1">Quartz and glaze prices in Jaipur are forecast to rise. Sourcing 2 months of surplus inventory now saves ₹4,200.</p>
            </div>
            <div className="p-3 border-l-2 border-l-green-600 bg-green-50/10">
              <h4 className="text-xs font-bold text-[#5e2c18]">Adviser Marketing Plan</h4>
              <p className="text-[11px] text-muted-foreground mt-1">Highly matches user clusters interested in &apos;Minimalist/Coastal&apos; decor. Promoted campaign suggested on Instagram.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

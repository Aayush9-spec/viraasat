'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Truck, CheckCircle2, Clock } from 'lucide-react';

const mockArtisanOrders = [
  {
    id: 'ORD-8821',
    customer: 'Aarav Sharma',
    item: 'Hand-Carved Wooden Jharokha',
    amount: 14500,
    status: 'In Production',
    date: '2026-08-30',
  },
  {
    id: 'ORD-8819',
    customer: 'Meera Patel',
    item: 'Blue Pottery Ceramic Urn',
    amount: 3800,
    status: 'Ready to Ship',
    date: '2026-08-28',
  },
  {
    id: 'ORD-8790',
    customer: 'Kabir Verma',
    item: 'Pashmina Shawl - Natural Dye',
    amount: 22000,
    status: 'Delivered',
    date: '2026-08-25',
  },
];

export default function ArtisanOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold">Artisan Orders & Fulfillment</h1>
        <p className="text-muted-foreground text-sm">
          Track customer orders, update production status, and manage shipments.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-900 dark:text-amber-200">Pending Dispatch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-amber-700 dark:text-amber-300">2 Orders</div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-emerald-900 dark:text-emerald-200">Completed This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-emerald-700 dark:text-emerald-300">18 Orders</div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-900 dark:text-blue-200">Total Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-blue-700 dark:text-blue-300">₹68,300</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Orders</CardTitle>
          <CardDescription>Live fulfillment queue for your craft workshop</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Craft Item</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockArtisanOrders.map((ord) => (
                <TableRow key={ord.id}>
                  <TableCell className="font-mono font-medium">{ord.id}</TableCell>
                  <TableCell>{ord.customer}</TableCell>
                  <TableCell>{ord.item}</TableCell>
                  <TableCell className="font-semibold">₹{ord.amount.toLocaleString('en-IN')}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        ord.status === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.status === 'Ready to Ship'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }
                    >
                      {ord.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{ord.date}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      Manage Order
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

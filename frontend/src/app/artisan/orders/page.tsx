'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  User,
  Calendar,
  IndianRupee,
  ClipboardList,
  ArrowRight,
} from 'lucide-react';

type OrderStatus = 'In Production' | 'Ready to Ship' | 'Shipped' | 'Delivered' | 'Cancelled';

interface ArtisanOrder {
  id: string;
  customer: string;
  customerPhone: string;
  customerAddress: string;
  item: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  status: OrderStatus;
  date: string;
  notes: string;
  trackingId: string;
}

const STATUS_FLOW: OrderStatus[] = ['In Production', 'Ready to Ship', 'Shipped', 'Delivered'];

const STATUS_CONFIG: Record<OrderStatus, { color: string; icon: React.ReactNode; label: string }> = {
  'In Production': {
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: <Clock className="w-3 h-3" />,
    label: 'In Production',
  },
  'Ready to Ship': {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <Package className="w-3 h-3" />,
    label: 'Ready to Ship',
  },
  Shipped: {
    color: 'bg-violet-100 text-violet-800 border-violet-200',
    icon: <Truck className="w-3 h-3" />,
    label: 'Shipped',
  },
  Delivered: {
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: <CheckCircle2 className="w-3 h-3" />,
    label: 'Delivered',
  },
  Cancelled: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: <ClipboardList className="w-3 h-3" />,
    label: 'Cancelled',
  },
};

const initialOrders: ArtisanOrder[] = [
  {
    id: 'ORD-8821',
    customer: 'Aarav Sharma',
    customerPhone: '+91 98765 43210',
    customerAddress: '12, Lajpat Nagar, New Delhi, Delhi - 110024',
    item: 'Hand-Carved Wooden Jharokha',
    quantity: 1,
    unitPrice: 14500,
    amount: 14500,
    status: 'In Production',
    date: '2026-08-30',
    notes: '',
    trackingId: '',
  },
  {
    id: 'ORD-8819',
    customer: 'Meera Patel',
    customerPhone: '+91 91234 56789',
    customerAddress: '7, Navrangpura, Ahmedabad, Gujarat - 380009',
    item: 'Blue Pottery Ceramic Urn',
    quantity: 2,
    unitPrice: 1900,
    amount: 3800,
    status: 'Ready to Ship',
    date: '2026-08-28',
    notes: 'Please pack carefully with bubble wrap.',
    trackingId: '',
  },
  {
    id: 'ORD-8790',
    customer: 'Kabir Verma',
    customerPhone: '+91 87654 32109',
    customerAddress: '45, Civil Lines, Jaipur, Rajasthan - 302006',
    item: 'Pashmina Shawl - Natural Dye',
    quantity: 1,
    unitPrice: 22000,
    amount: 22000,
    status: 'Delivered',
    date: '2026-08-25',
    notes: 'Customer requested gift wrapping.',
    trackingId: 'DTDC1234567890',
  },
];

function getNextStatus(current: OrderStatus): OrderStatus | null {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx === STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

export default function ArtisanOrdersPage() {
  const [orders, setOrders] = useState<ArtisanOrder[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<ArtisanOrder | null>(null);
  const [editStatus, setEditStatus] = useState<OrderStatus>('In Production');
  const [editNotes, setEditNotes] = useState('');
  const [editTrackingId, setEditTrackingId] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const { toast } = useToast();

  const pendingDispatch = orders.filter(
    (o) => o.status === 'In Production' || o.status === 'Ready to Ship',
  ).length;
  const completedThisMonth = orders.filter((o) => o.status === 'Delivered').length;
  const totalVolume = orders.reduce((sum, o) => sum + o.amount, 0);

  function openManage(order: ArtisanOrder) {
    setSelectedOrder(order);
    setEditStatus(order.status);
    setEditNotes(order.notes);
    setEditTrackingId(order.trackingId);
    setSheetOpen(true);
  }

  function handleSave() {
    if (!selectedOrder) return;

    if (editStatus === 'Shipped' && !editTrackingId.trim()) {
      toast({
        title: 'Tracking ID required',
        description: 'Please enter a tracking ID before marking the order as Shipped.',
        variant: 'destructive',
      });
      return;
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === selectedOrder.id
          ? { ...o, status: editStatus, notes: editNotes, trackingId: editTrackingId }
          : o,
      ),
    );

    toast({
      title: 'Order updated',
      description: `${selectedOrder.id} is now marked as "${editStatus}".`,
    });

    setSheetOpen(false);
  }

  function handleQuickAdvance(order: ArtisanOrder) {
    const next = getNextStatus(order.status);
    if (!next) return;

    if (next === 'Shipped' && !order.trackingId.trim()) {
      openManage(order);
      toast({
        title: 'Add tracking ID',
        description: 'Enter a tracking ID to mark this order as Shipped.',
      });
      return;
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: next } : o)),
    );

    toast({
      title: `${order.id} advanced`,
      description: `Status updated to "${next}".`,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold">Artisan Orders & Fulfillment</h1>
        <p className="text-muted-foreground text-sm">
          Track customer orders, update production status, and manage shipments.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-900 dark:text-amber-200">Pending Dispatch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-amber-700 dark:text-amber-300">
              {pendingDispatch} {pendingDispatch === 1 ? 'Order' : 'Orders'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-emerald-900 dark:text-emerald-200">Completed This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-emerald-700 dark:text-emerald-300">
              {completedThisMonth} {completedThisMonth === 1 ? 'Order' : 'Orders'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-900 dark:text-blue-200">Total Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-blue-700 dark:text-blue-300">
              ₹{totalVolume.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
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
              {orders.map((ord) => {
                const cfg = STATUS_CONFIG[ord.status];
                const next = getNextStatus(ord.status);
                return (
                  <TableRow key={ord.id}>
                    <TableCell className="font-mono font-medium">{ord.id}</TableCell>
                    <TableCell>{ord.customer}</TableCell>
                    <TableCell>{ord.item}</TableCell>
                    <TableCell className="font-semibold">₹{ord.amount.toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      <Badge className={`${cfg.color} flex items-center gap-1 w-fit border`}>
                        {cfg.icon}
                        {cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{ord.date}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {next && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-muted-foreground gap-1"
                            onClick={() => handleQuickAdvance(ord)}
                            title={`Advance to ${next}`}
                          >
                            <ArrowRight className="w-3 h-3" />
                            {next}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openManage(ord)}
                        >
                          Manage Order
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Manage Order Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedOrder && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="font-heading text-lg">Manage Order</SheetTitle>
                <SheetDescription className="font-mono text-sm">{selectedOrder.id}</SheetDescription>
              </SheetHeader>

              {/* Customer Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Customer Details
                </h3>
                <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="font-medium">{selectedOrder.customer}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>{selectedOrder.customerPhone}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{selectedOrder.customerAddress}</span>
                  </div>
                </div>

                <Separator />

                {/* Order Summary */}
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Order Summary
                </h3>
                <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Item</span>
                    <span className="font-medium text-right max-w-[55%]">{selectedOrder.item}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Qty</span>
                    <span>{selectedOrder.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unit Price</span>
                    <span>₹{selectedOrder.unitPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex justify-between font-semibold">
                    <div className="flex items-center gap-1">
                      <IndianRupee className="w-3.5 h-3.5" />
                      Total
                    </div>
                    <span>₹{selectedOrder.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Order Date
                    </div>
                    <span>{selectedOrder.date}</span>
                  </div>
                </div>

                <Separator />

                {/* Status Update */}
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Update Status
                </h3>
                <div className="space-y-1">
                  <Label htmlFor="status-select" className="text-sm">Order Status</Label>
                  <Select
                    value={editStatus}
                    onValueChange={(v) => setEditStatus(v as OrderStatus)}
                  >
                    <SelectTrigger id="status-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>
                          <div className="flex items-center gap-2">
                            {STATUS_CONFIG[s].icon}
                            {STATUS_CONFIG[s].label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tracking ID */}
                <div className="space-y-1">
                  <Label htmlFor="tracking-id" className="text-sm">
                    Tracking ID
                    {editStatus === 'Shipped' && (
                      <span className="text-red-500 ml-1">*required</span>
                    )}
                  </Label>
                  <input
                    id="tracking-id"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="e.g. DTDC1234567890"
                    value={editTrackingId}
                    onChange={(e) => setEditTrackingId(e.target.value)}
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <Label htmlFor="order-notes" className="text-sm">Internal Notes</Label>
                  <Textarea
                    id="order-notes"
                    placeholder="Add any notes about this order…"
                    className="resize-none text-sm"
                    rows={3}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button className="flex-1" onClick={handleSave}>
                    Save Changes
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setSheetOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { orders } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export default function OrdersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
        <CardDescription>
          A list of orders for your products.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Update Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>{format(new Date(order.orderDate), 'PPP')}</TableCell>
                <TableCell className="text-right">${order.totalAmount.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      order.status === 'Delivered' ? 'default' :
                      order.status === 'Shipped' ? 'outline' :
                      order.status === 'Pending' || order.status === 'Processing' ? 'secondary' :
                      'destructive'
                    }
                  >
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select defaultValue={order.status}>
                    <SelectTrigger className="h-8 w-[150px] mx-auto">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Processing">Processing</SelectItem>
                      <SelectItem value="Shipped">Shipped</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

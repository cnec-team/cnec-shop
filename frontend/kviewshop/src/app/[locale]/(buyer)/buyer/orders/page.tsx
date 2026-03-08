'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/lib/hooks/use-user';
import { getBuyerOrders } from '@/lib/actions/buyer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ShoppingBag,
  ChevronRight,
  Search,
  Loader2,
  Star,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

const statusConfig: Record<string, { icon: typeof Clock; color: string; bgColor: string; label: string }> = {
  PENDING: { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-500/10', label: 'Pending' },
  PAID: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-500/10', label: 'Paid' },
  PREPARING: { icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-500/10', label: 'Preparing' },
  SHIPPING: { icon: Truck, color: 'text-purple-600', bgColor: 'bg-purple-500/10', label: 'Shipped' },
  DELIVERED: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-500/10', label: 'Delivered' },
  CONFIRMED: { icon: CheckCircle, color: 'text-green-700', bgColor: 'bg-green-600/10', label: 'Confirmed' },
  CANCELLED: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-500/10', label: 'Cancelled' },
  REFUNDED: { icon: XCircle, color: 'text-gray-600', bgColor: 'bg-gray-500/10', label: 'Refunded' },
};

export default function BuyerOrdersPage() {
  const params = useParams();
  const locale = params.locale as string;
  const { buyer } = useUser();

  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadOrders = async () => {
      if (!buyer) return;

      try {
        const ordersData = await getBuyerOrders(buyer.id);
        setOrders(ordersData || []);
        setFilteredOrders(ordersData || []);
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [buyer]);

  useEffect(() => {
    let filtered = orders;

    // Filter by tab
    if (activeTab !== 'all') {
      if (activeTab === 'active') {
        filtered = filtered.filter((o) =>
          ['PENDING', 'PAID', 'PREPARING', 'SHIPPING'].includes(o.status)
        );
      } else {
        filtered = filtered.filter((o) => o.status === activeTab.toUpperCase());
      }
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(query) ||
          o.creator?.displayName?.toLowerCase().includes(query) ||
          o.orderItems?.some((item: any) => (item.productName || item.product?.name || '').toLowerCase().includes(query))
      );
    }

    setFilteredOrders(filtered);
  }, [activeTab, searchQuery, orders]);

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return '₩' + Number(amount).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold flex items-center gap-3">
          <Package className="h-8 w-8" />
          My Orders
        </h1>
        <p className="text-muted-foreground mt-1">
          Track and manage your orders
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-16">
                <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h2 className="text-xl font-semibold mb-2">No orders found</h2>
                <p className="text-muted-foreground mb-6">
                  {activeTab === 'all'
                    ? "You haven't placed any orders yet"
                    : 'No orders match this filter'}
                </p>
                <Link href={'/' + locale + '/buyer/subscriptions'}>
                  <Button>Start Shopping</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const status = statusConfig[order.status] || statusConfig.PENDING;
                const StatusIcon = status.icon;

                return (
                  <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="pb-3 bg-muted/30">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Order Number</p>
                            <p className="font-mono font-semibold">{order.orderNumber}</p>
                          </div>
                          <div className="hidden sm:block">
                            <p className="text-sm text-muted-foreground">Date</p>
                            <p className="font-medium">{formatDate(order.createdAt)}</p>
                          </div>
                        </div>
                        <Badge className={status.bgColor + ' ' + status.color + ' border-0'}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {/* Creator Info */}
                      {order.creator && (
                        <Link
                          href={'/' + locale + '/@' + (order.creator.shopId || order.creator.username)}
                          className="flex items-center gap-2 mb-4 text-sm hover:text-primary transition-colors"
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: order.creator.themeColor || order.creator.backgroundColor || '#000' }}
                          />
                          <span>{order.creator.displayName || order.creator.shopId || order.creator.username}</span>
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      )}

                      {/* Order Items */}
                      <div className="space-y-3">
                        {order.orderItems?.slice(0, 3).map((item: any) => {
                          const itemName = item.productName || item.product?.name || 'Product';
                          const itemImage = item.productImage || item.product?.imageUrl;
                          return (
                          <div key={item.id} className="flex gap-3">
                            <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                              {itemImage ? (
                                <Image
                                  src={itemImage}
                                  alt={itemName}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ShoppingBag className="h-6 w-6 text-muted-foreground/50" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{itemName}</p>
                              <p className="text-sm text-muted-foreground">
                                Qty: {item.quantity} x {formatCurrency(Number(item.unitPrice))}
                              </p>
                            </div>
                          </div>
                          );
                        })}
                        {order.orderItems && order.orderItems.length > 3 && (
                          <p className="text-sm text-muted-foreground">
                            +{order.orderItems.length - 3} more item(s)
                          </p>
                        )}
                      </div>

                      {/* Tracking Info */}
                      {order.trackingNumber && (
                        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">Tracking Number</p>
                          <p className="font-mono">{order.trackingNumber}</p>
                        </div>
                      )}

                      {/* Order Total and Actions */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div>
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="text-lg font-semibold">
                            {formatCurrency(Number(order.totalAmount))}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {order.status === 'DELIVERED' && (
                            <Link href={'/' + locale + '/buyer/reviews?orderId=' + order.id}>
                              <Button variant="outline" size="sm" className="gap-1">
                                <Star className="h-4 w-4" />
                                Write Review
                              </Button>
                            </Link>
                          )}
                          <Link href={'/' + locale + '/buyer/orders/' + order.id}>
                            <Button variant="ghost" size="sm">
                              View Details
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingCart,
  Loader2,
  DollarSign,
  Package,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatCurrency } from '@/lib/i18n/config';
import { getClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import type { OrderStatus } from '@/types/database';

interface CreatorOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total_amount: number;
  creator_revenue: number;
  currency: string;
  country: string;
  status: OrderStatus;
  tracking_number?: string;
  created_at: string;
  brand?: { company_name: string; company_name_en?: string };
  items?: { product_id: string; quantity: number; unit_price: number; product?: { name_en: string; name_ko: string } }[];
}

function getStatusColor(status: OrderStatus) {
  switch (status) {
    case 'PENDING': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    case 'PAID': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'PREPARING': return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
    case 'SHIPPING': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    case 'DELIVERED': return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'CONFIRMED': return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'CANCELLED': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    case 'REFUNDED': return 'bg-red-500/10 text-red-500 border-red-500/20';
    default: return 'bg-muted text-muted-foreground border-muted';
  }
}

export default function CreatorOrdersPage() {
  const t = useTranslations('order');
  const tCreator = useTranslations('creator');

  // Read auth state from zustand store (populated by Header's useUser hook)
  const { creator, isLoading: authLoading } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<CreatorOrder[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth store to finish loading
    if (authLoading) return;

    // No creator = not logged in or wrong role
    if (!creator) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 8000);

    async function loadOrders(creatorId: string) {
      try {
        const supabase = getClient();
        const { data } = await supabase
          .from('orders')
          .select(`
            *,
            brand:brands(company_name, company_name_en),
            items:order_items(
              product_id,
              quantity,
              unit_price,
              product:products(name_en, name_ko)
            )
          `)
          .eq('creator_id', creatorId)
          .order('created_at', { ascending: false });

        if (!cancelled) {
          setOrders((data as unknown as CreatorOrder[]) || []);
        }
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrders(creator.id);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [authLoading, creator]);

  const totalRevenue = orders
    .filter(o => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.creator_revenue || 0), 0);

  const pendingRevenue = orders
    .filter(o => o.status === 'PAID' || o.status === 'SHIPPING')
    .reduce((sum, o) => sum + (o.creator_revenue || 0), 0);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-headline font-bold">{t('orderSummary')}</h1>
        <p className="text-sm text-muted-foreground">{t('myOrdersDesc')}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t('totalOrders')}</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{tCreator('totalEarnings')}</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue, 'KRW')}</p>
              </div>
              <DollarSign className="h-5 w-5 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{tCreator('pendingEarnings')}</p>
                <p className="text-2xl font-bold">{formatCurrency(pendingRevenue, 'KRW')}</p>
              </div>
              <Package className="h-5 w-5 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order List */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">{t('recentOrders')}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {t('totalCount', { count: orders.length })}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          {orders.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <ShoppingCart className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground text-sm sm:text-base">{t('noOrders')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const isExpanded = expandedOrder === order.id;
                return (
                  <div key={order.id} className="border rounded-lg overflow-hidden">
                    <button
                      className="w-full text-left p-3 sm:p-4 hover:bg-muted/30 transition-colors"
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm font-medium">#{order.order_number}</span>
                            <Badge className={getStatusColor(order.status)}>
                              {t(order.status)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{order.brand?.company_name_en || order.brand?.company_name}</span>
                            <span>{new Date(order.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <p className="font-bold text-sm text-success">
                              +{formatCurrency(order.creator_revenue || 0, order.currency || 'KRW')}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              / {formatCurrency(order.total_amount, order.currency || 'KRW')}
                            </p>
                          </div>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-3 sm:p-4 pt-0 border-t space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-[10px] text-muted-foreground">{t('myEarning')}</p>
                            <p className="text-sm font-bold text-success">{formatCurrency(order.creator_revenue || 0, order.currency || 'KRW')}</p>
                          </div>
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-[10px] text-muted-foreground">{t('orderTotal')}</p>
                            <p className="text-sm font-bold">{formatCurrency(order.total_amount, order.currency || 'KRW')}</p>
                          </div>
                        </div>

                        {order.items && order.items.length > 0 && (
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{item.product?.name_en || item.product?.name_ko || 'Product'} x{item.quantity}</span>
                                <span>{formatCurrency(item.unit_price * item.quantity, order.currency || 'KRW')}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {order.tracking_number && (
                          <div className="flex items-center gap-2 text-sm">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{t('trackingNumber')}:</span>
                            <span className="font-mono">{order.tracking_number}</span>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          {t('customerInfo')}: {order.customer_name} ({order.country})
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

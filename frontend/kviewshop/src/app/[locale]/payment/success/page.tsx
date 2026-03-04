'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { getClient } from '@/lib/supabase/client';
import { useCartStore } from '@/lib/store/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, Home, Loader2 } from 'lucide-react';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const clearCart = useCartStore((state) => state.clearCart);

  const [isProcessing, setIsProcessing] = useState(true);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const orderId = searchParams.get('orderId');
  const paymentKey = searchParams.get('paymentKey');
  const amount = searchParams.get('amount');
  const creatorId = searchParams.get('creatorId');

  useEffect(() => {
    const confirmPayment = async () => {
      if (!orderId || !paymentKey || !amount) {
        setError('Invalid payment parameters');
        setIsProcessing(false);
        return;
      }

      try {
        const supabase = getClient();

        // Call API to confirm payment with Toss
        const response = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            paymentKey,
            amount: parseInt(amount),
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Payment confirmation failed');
        }

        // Update order status in database
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .update({
            status: 'paid',
            payment_key: paymentKey,
            payment_status: 'completed',
            paid_at: new Date().toISOString(),
          })
          .eq('order_number', orderId)
          .select('order_number')
          .single();

        if (orderError) {
          console.error('Order update error:', orderError);
        }

        setOrderNumber(order?.order_number || orderId);

        // Clear the cart after successful payment
        clearCart();
      } catch (err: any) {
        console.error('Payment confirmation error:', err);
        setError(err.message || 'Payment confirmation failed');
      } finally {
        setIsProcessing(false);
      }
    };

    confirmPayment();
  }, [orderId, paymentKey, amount, clearCart]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center py-12">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-semibold">Processing Payment...</h2>
            <p className="text-muted-foreground mt-2">Please wait while we confirm your payment</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center py-12">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-red-600">Payment Error</h2>
            <p className="text-muted-foreground mt-2 text-center">{error}</p>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
              <Link href={'/' + locale}>
                <Button>Go Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center pb-2">
          <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div>
            <p className="text-muted-foreground">Your order has been confirmed</p>
            {orderNumber && (
              <p className="font-mono text-lg mt-2 font-semibold">{orderNumber}</p>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
            <p>✓ Payment confirmed</p>
            <p>✓ Order confirmation email sent</p>
            <p>✓ Seller has been notified</p>
          </div>

          <div className="flex flex-col gap-3">
            <Link href={'/' + locale + '/buyer/orders'}>
              <Button className="w-full gap-2">
                <Package className="h-4 w-4" />
                View My Orders
              </Button>
            </Link>
            <Link href={'/' + locale}>
              <Button variant="outline" className="w-full gap-2">
                <Home className="h-4 w-4" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/lib/store/auth';
import { useUser } from '@/lib/hooks/use-user';
import { getCartProducts, getCartCreators } from '@/lib/actions/buyer';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Store,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface CartProduct {
  id: string;
  name: string | null;
  nameKo: string | null;
  nameEn: string | null;
  nameJp: string | null;
  originalPrice: number | null;
  salePrice: number | null;
  imageUrl: string | null;
  images: string[] | null;
  brand: {
    companyName: string | null;
    brandName: string | null;
  } | null;
}

interface CartCreator {
  id: string;
  shopId: string | null;
  username: string | null;
  displayName: string | null;
  themeColor: string | null;
  backgroundColor: string | null;
}

interface CartItemWithProduct {
  productId: string;
  quantity: number;
  creatorId: string;
  product?: CartProduct;
  creator?: CartCreator;
}

interface GroupedCart {
  creatorId: string;
  creator: CartCreator;
  items: CartItemWithProduct[];
}

export default function BuyerCartPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const { buyer } = useUser();
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();

  const [isLoading, setIsLoading] = useState(true);
  const [groupedItems, setGroupedItems] = useState<GroupedCart[]>([]);
  const [products, setProducts] = useState<Record<string, CartProduct>>({});
  const [creators, setCreators] = useState<Record<string, CartCreator>>({});

  useEffect(() => {
    const loadCartData = async () => {
      if (items.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        // Get unique product IDs and creator IDs
        const productIds = [...new Set(items.map((i) => i.productId))];
        const creatorIds = [...new Set(items.map((i) => i.creatorId))];

        // Fetch products and creators via server actions
        const [productsData, creatorsData] = await Promise.all([
          getCartProducts(productIds),
          getCartCreators(creatorIds),
        ]);

        const productsMap: Record<string, CartProduct> = {};
        productsData?.forEach((p: any) => {
          productsMap[p.id] = p;
        });
        setProducts(productsMap);

        const creatorsMap: Record<string, CartCreator> = {};
        creatorsData?.forEach((c: any) => {
          creatorsMap[c.id] = c;
        });
        setCreators(creatorsMap);

        // Group items by creator
        const grouped: Record<string, GroupedCart> = {};
        items.forEach((item) => {
          if (!grouped[item.creatorId]) {
            grouped[item.creatorId] = {
              creatorId: item.creatorId,
              creator: creatorsMap[item.creatorId],
              items: [],
            };
          }
          grouped[item.creatorId].items.push({
            ...item,
            product: productsMap[item.productId],
            creator: creatorsMap[item.creatorId],
          });
        });

        setGroupedItems(Object.values(grouped));
      } catch (error) {
        console.error('Failed to load cart data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCartData();
  }, [items]);

  const getProductName = (product?: CartProduct) => {
    if (!product) return 'Unknown Product';
    if (locale === 'ja' && product.nameJp) return product.nameJp;
    if (locale === 'en' && product.nameEn) return product.nameEn;
    return product.name || product.nameKo || 'Unknown Product';
  };

  const getPrice = (product?: CartProduct) => {
    if (!product) return 0;
    return Number(product.salePrice || product.originalPrice || 0);
  };

  const getProductImage = (product?: CartProduct) => {
    if (!product) return null;
    if (product.imageUrl) return product.imageUrl;
    if (product.images && product.images.length > 0) return product.images[0];
    return null;
  };

  const calculateCreatorSubtotal = (items: CartItemWithProduct[]) => {
    return items.reduce((sum, item) => sum + getPrice(item.product) * item.quantity, 0);
  };

  const calculateTotal = () => {
    return groupedItems.reduce((sum, group) => sum + calculateCreatorSubtotal(group.items), 0);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <ShoppingCart className="h-24 w-24 text-muted-foreground/30 mb-6" />
            <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8">
              Start shopping from your favorite creator shops!
            </p>
            <Link href={'/' + locale + '/buyer/subscriptions'}>
              <Button size="lg" className="gap-2">
                <Store className="h-5 w-5" />
                Browse Creator Shops
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold flex items-center gap-3">
            <ShoppingCart className="h-8 w-8" />
            Shopping Cart
          </h1>
          <p className="text-muted-foreground mt-1">
            {totalItems} item{totalItems !== 1 ? 's' : ''} in your cart
          </p>
        </div>
        <Button variant="ghost" className="text-destructive" onClick={clearCart}>
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          {groupedItems.map((group) => (
            <Card key={group.creatorId}>
              <CardHeader className="pb-3">
                <Link
                  href={'/' + locale + '/@' + (group.creator?.shopId || group.creator?.username)}
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: group.creator?.themeColor || group.creator?.backgroundColor || '#000' }}
                  />
                  <CardTitle className="text-lg">
                    {group.creator?.displayName || group.creator?.shopId || group.creator?.username || 'Shop'}
                  </CardTitle>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex gap-4 p-3 rounded-lg border border-border/50"
                  >
                    {/* Product Image */}
                    <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      {getProductImage(item.product) ? (
                        <Image
                          src={getProductImage(item.product)!}
                          alt={getProductName(item.product)}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">
                        {getProductName(item.product)}
                      </h3>
                      {item.product?.brand && (
                        <p className="text-sm text-muted-foreground">
                          {item.product.brand.companyName || item.product.brand.brandName}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-semibold">
                          ${getPrice(item.product).toLocaleString()}
                        </span>
                        {item.product?.salePrice && item.product?.originalPrice && Number(item.product.originalPrice) > Number(item.product.salePrice) && (
                          <span className="text-sm text-muted-foreground line-through">
                            ${Number(item.product.originalPrice).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            item.quantity > 1
                              ? updateQuantity(item.productId, item.quantity - 1)
                              : removeItem(item.productId)
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.productId, parseInt(e.target.value) || 1)
                          }
                          className="w-14 h-8 text-center"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive h-7 px-2"
                        onClick={() => removeItem(item.productId)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="bg-muted/50 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-semibold">
                  ${calculateCreatorSubtotal(group.items).toLocaleString()}
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({totalItems} items)</span>
                  <span>${calculateTotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-green-600">Calculated at checkout</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${calculateTotal().toLocaleString()}</span>
              </div>

              {buyer?.points_balance && buyer.points_balance > 0 && (
                <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <span className="font-medium text-primary">
                    {buyer.points_balance.toLocaleString()}P
                  </span>{' '}
                  available to use
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              {groupedItems.length === 1 ? (
                <Link
                  href={'/' + locale + '/@' + (groupedItems[0].creator?.shopId || groupedItems[0].creator?.username) + '/checkout'}
                  className="w-full"
                >
                  <Button size="lg" className="w-full gap-2">
                    Proceed to Checkout
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <div className="w-full space-y-2">
                  <p className="text-sm text-muted-foreground text-center">
                    Checkout by creator shop:
                  </p>
                  {groupedItems.map((group) => (
                    <Link
                      key={group.creatorId}
                      href={'/' + locale + '/@' + (group.creator?.shopId || group.creator?.username) + '/checkout'}
                      className="block"
                    >
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: group.creator?.themeColor || group.creator?.backgroundColor || '#000' }}
                        />
                        {group.creator?.displayName || group.creator?.shopId || group.creator?.username}
                        <ArrowRight className="h-3 w-3 ml-auto" />
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
              <Link href={'/' + locale + '/buyer/subscriptions'} className="w-full">
                <Button variant="ghost" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

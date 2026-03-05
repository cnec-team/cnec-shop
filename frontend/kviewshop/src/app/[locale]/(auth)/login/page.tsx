'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, AlertCircle, Sparkles, Building2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setLoginError(null);
    try {
      const supabase = getClient();
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setLoginError(t('invalidCredentials'));
        } else if (error.message.includes('Email not confirmed')) {
          setLoginError(t('emailNotConfirmed'));
        } else {
          setLoginError(error.message);
        }
        return;
      }

      // Get role from auth user metadata first
      let role = authData.user?.user_metadata?.role;

      // If no role in metadata, check DB for user role
      if (!role && authData.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (userData?.role) {
          role = userData.role;
          // Update user metadata with role for future logins
          await supabase.auth.updateUser({
            data: { role: userData.role }
          });
        }
      }

      // If still no role, check if user is a creator or brand
      if (!role && authData.user) {
        const { data: creatorData } = await supabase
          .from('creators')
          .select('id')
          .eq('user_id', authData.user.id)
          .maybeSingle();

        if (creatorData) {
          role = 'creator';
          await supabase.auth.updateUser({ data: { role: 'creator' } });
        } else {
          const { data: brandData } = await supabase
            .from('brands')
            .select('id')
            .eq('user_id', authData.user.id)
            .maybeSingle();

          if (brandData) {
            role = 'brand_admin';
            await supabase.auth.updateUser({ data: { role: 'brand_admin' } });
          }
        }
      }

      if (returnUrl) {
        router.push(returnUrl);
      } else {
        // Route based on role
        const dashboardPath =
          role === 'super_admin'
            ? '/admin/dashboard'
            : role === 'brand_admin'
            ? '/brand/dashboard'
            : role === 'creator'
            ? '/creator/dashboard'
            : role === 'buyer'
            ? '/buyer/dashboard'
            : '/buyer/login';
        router.push(`/${locale}${dashboardPath}`);
      }
    } catch (error) {
      setLoginError(t('loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50">
        <CardHeader className="text-center">
          <Link href={`/${locale}`} className="mb-4 inline-block">
            <span className="font-headline text-3xl font-bold text-gold-gradient">
              CNEC Shop
            </span>
          </Link>
          <CardTitle className="text-2xl font-headline">{t('loginTitle')}</CardTitle>
          <CardDescription>{t('loginSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {loginError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                {...register('email')}
                className="bg-muted"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{t('emailRequired')}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('password')}</Label>
              </div>
              <Input
                id="password"
                type="password"
                {...register('password')}
                className="bg-muted"
              />
              {errors.password && (
                <p className="text-sm text-destructive">{t('passwordMinLength')}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full btn-gold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                t('login')
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t('or')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link
                href={`/${locale}/creator/login`}
                className="flex items-center justify-center gap-2 rounded-lg border border-border p-3 text-sm font-medium hover:bg-accent transition-colors"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                {t('creatorLogin')}
              </Link>
              <Link
                href={`/${locale}/brand/login`}
                className="flex items-center justify-center gap-2 rounded-lg border border-border p-3 text-sm font-medium hover:bg-accent transition-colors"
              >
                <Building2 className="h-4 w-4 text-primary" />
                {t('brandLogin')}
              </Link>
            </div>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">{t('noAccount')} </span>
              <Link
                href={`/${locale}/signup`}
                className="text-primary hover:underline"
              >
                {t('signup')}
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

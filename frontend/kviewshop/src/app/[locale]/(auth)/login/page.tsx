'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
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
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setLoginError(t('invalidCredentials'));
        return;
      }

      // Fetch session to get role for routing
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();
      const role = session?.user?.role;

      if (returnUrl) {
        router.push(returnUrl);
      } else {
        const dashboardPath =
          role === 'super_admin'
            ? '/admin/dashboard'
            : role === 'brand_admin'
            ? '/brand/dashboard'
            : role === 'creator'
            ? '/creator/dashboard'
            : role === 'buyer'
            ? '/buyer/dashboard'
            : '/';
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

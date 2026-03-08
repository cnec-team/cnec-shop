'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { registerBuyer } from '@/lib/actions/auth-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, AlertCircle, ShoppingBag, Gift, Heart, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  nickname: z.string().min(2).max(30),
  marketingConsent: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function BuyerSignupPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [isLoading, setIsLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      marketingConsent: false,
    },
  });

  const marketingConsent = watch('marketingConsent');

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    setSignupError(null);
    try {
      // Use the server action to register the buyer
      // First, sign up via NextAuth credentials provider or a registration endpoint
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.nickname,
          role: 'buyer',
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setSignupError(errData.error || 'Failed to create account');
        return;
      }

      // Sign in with the new credentials
      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        setSignupError(signInResult.error);
        return;
      }

      // Create buyer profile via server action
      await registerBuyer({
        email: data.email,
        nickname: data.nickname,
        locale,
        marketingConsent: data.marketingConsent || false,
      });

      toast.success('Account created successfully! Welcome to CNEC Shop!');
      router.push(`/${locale}/buyer/dashboard`);
    } catch (error) {
      console.error('Signup error:', error);
      setSignupError('An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    { icon: Gift, text: 'Earn reward points with every review' },
    { icon: Heart, text: 'Subscribe to your favorite creator shops' },
    { icon: TrendingUp, text: 'Become a creator when you qualify!' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50">
        <CardHeader className="text-center">
          <Link href={`/${locale}`} className="mb-4 inline-block">
            <span className="font-headline text-3xl font-bold text-gold-gradient">
              CNEC Shop
            </span>
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-headline">Create Account</CardTitle>
          </div>
          <CardDescription>
            Join CNEC Shop and discover amazing creator curated products
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Benefits */}
          <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm font-medium mb-3">Member Benefits</p>
            <div className="space-y-2">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <benefit.icon className="h-4 w-4 text-primary" />
                  <span>{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {signupError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{signupError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                placeholder="Your display name"
                {...register('nickname')}
                className="bg-muted"
              />
              {errors.nickname && (
                <p className="text-sm text-destructive">{errors.nickname.message}</p>
              )}
            </div>

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
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 8 characters"
                {...register('password')}
                className="bg-muted"
              />
              {errors.password && (
                <p className="text-sm text-destructive">{t('passwordMinLength')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                className="bg-muted"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="marketingConsent"
                checked={marketingConsent}
                onCheckedChange={(checked) => setValue('marketingConsent', checked as boolean)}
              />
              <label
                htmlFor="marketingConsent"
                className="text-sm text-muted-foreground leading-tight cursor-pointer"
              >
                I agree to receive marketing emails about new products, promotions, and creator updates
              </label>
            </div>

            <Button
              type="submit"
              className="w-full btn-gold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link
              href={`/${locale}/buyer/login`}
              className="text-primary hover:underline"
            >
              Sign In
            </Link>
          </div>

          <p className="mt-4 text-xs text-center text-muted-foreground">
            By creating an account, you agree to our{' '}
            <Link href={`/${locale}/terms`} className="underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href={`/${locale}/privacy`} className="underline">Privacy Policy</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

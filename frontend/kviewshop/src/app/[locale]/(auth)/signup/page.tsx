'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Loader2, Building2, Sparkles } from 'lucide-react';

const signupSchema = z
  .object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    role: z.enum(['brand_admin', 'creator']),
    // Brand specific fields
    companyName: z.string().optional(),
    businessNumber: z.string().optional(),
    // Creator specific fields
    username: z.string().min(3).max(30).optional(),
    country: z.enum(['US', 'JP']).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      if (data.role === 'brand_admin') {
        return data.companyName && data.companyName.length >= 2;
      }
      return true;
    },
    {
      message: 'Company name is required for brands',
      path: ['companyName'],
    }
  )
  .refine(
    (data) => {
      if (data.role === 'creator') {
        return data.username && data.username.length >= 3;
      }
      return true;
    },
    {
      message: 'Username is required for creators',
      path: ['username'],
    }
  );

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const t = useTranslations('auth');
  const tBrand = useTranslations('brand');
  const tCreator = useTranslations('creator');
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: 'creator',
      country: 'JP',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    try {
      const supabase = getClient();

      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: data.role,
          },
        },
      });

      if (authError) {
        toast.error(authError.message);
        return;
      }

      if (!authData.user) {
        toast.error('Failed to create account');
        return;
      }

      // Create user record
      const { error: userError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: data.email,
        name: data.name,
        role: data.role,
      });

      if (userError) {
        console.error('User creation error:', userError);
        toast.error('Failed to create user profile. Please try again.');
        return;
      }

      // Create role-specific record
      if (data.role === 'brand_admin' && data.companyName) {
        const { error: brandError } = await supabase.from('brands').insert({
          user_id: authData.user.id,
          company_name: data.companyName,
          business_number: data.businessNumber || null,
          approved: false,
        });

        if (brandError) {
          console.error('Brand creation error:', brandError);
          toast.error('Failed to create brand profile. Please try again.');
          return;
        }

        toast.success('Brand registration submitted. Awaiting approval.');
        router.push(`/${locale}/login`);
      } else if (data.role === 'creator' && data.username) {
        const { error: creatorError } = await supabase.from('creators').insert({
          user_id: authData.user.id,
          shop_id: data.username.toLowerCase(),
          username: data.username.toLowerCase(),
          display_name: data.name,
          country: data.country || 'JP',
          theme_color: '#1a1a1a',
        });

        if (creatorError) {
          console.error('Creator creation error:', creatorError);
          toast.error('Failed to create creator profile. Please try again.');
          return;
        }

        toast.success('Account created successfully!');
        router.push(`/${locale}/creator/dashboard`);
      }

      router.refresh();
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg border-border/50">
        <CardHeader className="text-center">
          <Link href={`/${locale}`} className="mb-4 inline-block">
            <span className="font-headline text-3xl font-bold text-gold-gradient">
              크넥샵
            </span>
          </Link>
          <CardTitle className="text-2xl font-headline">{t('signupTitle')}</CardTitle>
          <CardDescription>{t('signupSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label>{t('selectRole')}</Label>
              <RadioGroup
                defaultValue="creator"
                onValueChange={(value) =>
                  setValue('role', value as 'brand_admin' | 'creator')
                }
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="creator"
                    id="creator"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="creator"
                    className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Sparkles className="mb-3 h-6 w-6 text-primary" />
                    <span className="text-sm font-medium">{t('creatorSignup')}</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="brand_admin"
                    id="brand_admin"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="brand_admin"
                    className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Building2 className="mb-3 h-6 w-6 text-primary" />
                    <span className="text-sm font-medium">{t('brandSignup')}</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Common Fields */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...register('name')}
                className="bg-muted"
              />
              {errors.name && (
                <p className="text-sm text-destructive">Name is required</p>
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

            {/* Role-specific fields */}
            {selectedRole === 'brand_admin' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName">{tBrand('companyName')}</Label>
                  <Input
                    id="companyName"
                    {...register('companyName')}
                    className="bg-muted"
                  />
                  {errors.companyName && (
                    <p className="text-sm text-destructive">
                      {errors.companyName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessNumber">
                    {tBrand('businessNumber')} (Optional)
                  </Label>
                  <Input
                    id="businessNumber"
                    {...register('businessNumber')}
                    className="bg-muted"
                  />
                </div>
              </>
            )}

            {selectedRole === 'creator' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">Username (@)</Label>
                  <div className="flex items-center">
                    <span className="flex h-10 items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                      @
                    </span>
                    <Input
                      id="username"
                      {...register('username')}
                      className="rounded-l-none bg-muted"
                      placeholder="your_username"
                    />
                  </div>
                  {errors.username && (
                    <p className="text-sm text-destructive">
                      {errors.username.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Your shop will be at: cnec.shop/@your_username
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <RadioGroup
                    defaultValue="JP"
                    onValueChange={(value) =>
                      setValue('country', value as 'US' | 'JP')
                    }
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="JP" id="JP" />
                      <Label htmlFor="JP">Japan</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="US" id="US" />
                      <Label htmlFor="US">United States</Label>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                className="bg-muted"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{t('passwordMismatch')}</p>
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
                t('signup')
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">{t('hasAccount')} </span>
            <Link
              href={`/${locale}/login`}
              className="text-primary hover:underline"
            >
              {t('login')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

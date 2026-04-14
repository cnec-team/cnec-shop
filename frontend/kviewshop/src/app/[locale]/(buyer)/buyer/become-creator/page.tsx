'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/lib/hooks/use-user';
import { getBecomeCreatorData, checkUsernameAvailability, submitCreatorApplication } from '@/lib/actions/buyer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  TrendingUp,
  ShoppingBag,
  Star,
  DollarSign,
  Clock,
  Check,
  X,
  Loader2,
  Instagram,
  Youtube,
  Music2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EligibilityCriteria {
  minOrders: number;
  minReviews: number;
  minSpent: number;
  minAccountAgeDays: number;
}

interface UserProgress {
  totalOrders: number;
  totalReviews: number;
  totalSpent: number;
  accountAgeDays: number;
}

export default function BecomeCreatorPage() {
  const { user, buyer } = useUser();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [criteria, setCriteria] = useState<EligibilityCriteria | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [existingApplication, setExistingApplication] = useState<any>(null);

  const [form, setForm] = useState({
    desired_username: '',
    display_name: '',
    bio: '',
    instagram_url: '',
    youtube_url: '',
    tiktok_url: '',
    follower_count: '',
    motivation: '',
    content_plan: '',
  });

  // Use stable primitive ID instead of object reference as dependency
  const buyerId = buyer?.id;
  const buyerRef = useRef(buyer);
  buyerRef.current = buyer;

  useEffect(() => {
    const loadData = async () => {
      if (!buyerId) return;
      const currentBuyer = buyerRef.current;
      if (!currentBuyer) return;

      try {
        const data = await getBecomeCreatorData(buyerId);

        setCriteria(data.criteria);
        setExistingApplication(data.existingApplication);

        // Calculate user progress
        const accountAge = currentBuyer.created_at
          ? Math.floor((Date.now() - new Date(currentBuyer.created_at).getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        setProgress({
          totalOrders: currentBuyer.total_orders || currentBuyer.totalOrders || 0,
          totalReviews: currentBuyer.total_reviews || currentBuyer.totalReviews || 0,
          totalSpent: currentBuyer.total_spent || currentBuyer.totalSpent || 0,
          accountAgeDays: accountAge,
        });
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [buyerId]);

  const checkEligibility = () => {
    if (!criteria || !progress) return false;
    return (
      progress.totalOrders >= criteria.minOrders &&
      progress.totalReviews >= criteria.minReviews &&
      progress.totalSpent >= criteria.minSpent &&
      progress.accountAgeDays >= criteria.minAccountAgeDays
    );
  };

  const isEligible = checkEligibility();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyer || !form.desired_username || !form.display_name) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if username is available
      const isAvailable = await checkUsernameAvailability(form.desired_username.toLowerCase());

      if (!isAvailable) {
        toast.error('This username is already taken');
        setIsSubmitting(false);
        return;
      }

      // Submit application
      await submitCreatorApplication({
        buyerId: buyer.id,
        desiredUsername: form.desired_username.toLowerCase(),
        displayName: form.display_name,
        bio: form.bio || undefined,
        instagramUrl: form.instagram_url || undefined,
        youtubeUrl: form.youtube_url || undefined,
        tiktokUrl: form.tiktok_url || undefined,
        followerCount: form.follower_count ? parseInt(form.follower_count) : undefined,
        motivation: form.motivation || undefined,
        contentPlan: form.content_plan || undefined,
      });

      toast.success('Application submitted successfully!');
      // Reload to show application status
      setExistingApplication({ status: 'pending', desiredUsername: form.desired_username });
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show existing application status
  if (existingApplication) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <Sparkles className="h-16 w-16 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-headline font-bold">Application Status</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              {existingApplication.status === 'pending' && (
                <>
                  <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                  <h2 className="text-xl font-semibold">Under Review</h2>
                  <p className="text-muted-foreground">
                    Your application is being reviewed. We'll notify you once a decision is made.
                  </p>
                </>
              )}
              {existingApplication.status === 'approved' && (
                <>
                  <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                    <Check className="h-8 w-8 text-green-500" />
                  </div>
                  <h2 className="text-xl font-semibold">Approved!</h2>
                  <p className="text-muted-foreground">
                    Congratulations! Your creator account has been created.
                  </p>
                  <Button
                    className="btn-gold"
                    onClick={() => router.push(`/${locale}/creator/login`)}
                  >
                    Go to Creator Login
                  </Button>
                </>
              )}
              {existingApplication.status === 'rejected' && (
                <>
                  <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
                    <X className="h-8 w-8 text-red-500" />
                  </div>
                  <h2 className="text-xl font-semibold">Not Approved</h2>
                  <p className="text-muted-foreground">
                    {existingApplication.rejectionReason || existingApplication.rejection_reason || 'Your application was not approved at this time.'}
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const criteriaItems = criteria ? [
    {
      label: 'Orders Placed',
      current: progress?.totalOrders || 0,
      required: criteria.minOrders,
      icon: ShoppingBag,
    },
    {
      label: 'Reviews Written',
      current: progress?.totalReviews || 0,
      required: criteria.minReviews,
      icon: Star,
    },
    {
      label: 'Total Spent ($)',
      current: progress?.totalSpent || 0,
      required: criteria.minSpent,
      icon: DollarSign,
    },
    {
      label: 'Account Age (days)',
      current: progress?.accountAgeDays || 0,
      required: criteria.minAccountAgeDays,
      icon: Clock,
    },
  ] : [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
          <Sparkles className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-headline font-bold">Become a Creator</h1>
        <p className="text-muted-foreground mt-2">
          Turn your passion into profit. Start your own creator shop!
        </p>
      </div>

      {/* Eligibility Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Eligibility Progress
          </CardTitle>
          <CardDescription>
            Meet these requirements to apply
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {criteriaItems.map((item) => {
            const percent = Math.min(100, (item.current / item.required) * 100);
            const met = item.current >= item.required;
            return (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <item.icon className={`h-4 w-4 ${met ? 'text-green-500' : 'text-muted-foreground'}`} />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${met ? 'text-green-500' : ''}`}>
                      {item.current} / {item.required}
                    </span>
                    {met ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <Progress value={percent} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Application Form */}
      {isEligible ? (
        <Card>
          <CardHeader>
            <CardTitle>Creator Application</CardTitle>
            <CardDescription>
              Fill out the form below to apply
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username">Desired Username *</Label>
                  <Input
                    id="username"
                    placeholder="your_shop_name"
                    value={form.desired_username}
                    onChange={(e) => setForm({
                      ...form,
                      desired_username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                    })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Your shop URL: cnec.shop/@{form.desired_username || 'username'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name *</Label>
                  <Input
                    id="displayName"
                    placeholder="Your Shop Name"
                    value={form.display_name}
                    onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about your shop concept..."
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Instagram className="h-4 w-4" /> Instagram
                  </Label>
                  <Input
                    placeholder="URL"
                    value={form.instagram_url}
                    onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Youtube className="h-4 w-4" /> YouTube
                  </Label>
                  <Input
                    placeholder="URL"
                    value={form.youtube_url}
                    onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Music2 className="h-4 w-4" /> TikTok
                  </Label>
                  <Input
                    placeholder="URL"
                    value={form.tiktok_url}
                    onChange={(e) => setForm({ ...form, tiktok_url: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="followers">Total Social Followers</Label>
                <Input
                  id="followers"
                  type="number"
                  placeholder="e.g., 10000"
                  value={form.follower_count}
                  onChange={(e) => setForm({ ...form, follower_count: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivation">Why do you want to become a creator?</Label>
                <Textarea
                  id="motivation"
                  placeholder="Tell us your motivation..."
                  value={form.motivation}
                  onChange={(e) => setForm({ ...form, motivation: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan">Content Plan</Label>
                <Textarea
                  id="plan"
                  placeholder="How will you promote products?"
                  value={form.content_plan}
                  onChange={(e) => setForm({ ...form, content_plan: e.target.value })}
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                className="w-full btn-gold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Submit Application
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Keep shopping and writing reviews to unlock creator eligibility!
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

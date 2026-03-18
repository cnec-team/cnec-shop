'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { User, CreditCard, Bell, Globe, Loader2, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { getCreatorSession, updateCreatorSettings } from '@/lib/actions/creator';
import { useOnboardingStore } from '@/lib/store/onboarding';

export default function CreatorSettingsPage() {
  const t = useTranslations('creator');
  const tCommon = useTranslations('common');

  const [creator, setCreator] = useState<{ id: string; displayName?: string; bankName?: string; bankAccount?: string } | null>(null);

  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({
    displayName: '',
    email: '',
    phone: '',
    country: 'US',
    paymentMethod: 'paypal',
    paypalEmail: '',
    bankName: '',
    accountNumber: '',
    swiftCode: '',
    emailNotifications: true,
    orderNotifications: true,
    settlementNotifications: true,
  });

  useEffect(() => {
    async function init() {
      const creatorData = await getCreatorSession();
      if (creatorData) {
        setCreator(creatorData as any);
        const c = creatorData as Record<string, any>;
        const notifSettings = c.notificationSettings || {};
        setSettings({
          displayName: c.displayName || '',
          email: c.email || '',
          phone: c.phone || '',
          country: c.country || 'KR',
          paymentMethod: c.paymentMethod || 'bank',
          paypalEmail: c.paypalEmail || '',
          bankName: c.bankName || '',
          accountNumber: c.accountNumber || c.bankAccount || '',
          swiftCode: c.swiftCode || '',
          emailNotifications: notifSettings.emailNotifications ?? notifSettings.email_notifications ?? true,
          orderNotifications: notifSettings.orderNotifications ?? notifSettings.order_notifications ?? true,
          settlementNotifications: notifSettings.settlementNotifications ?? notifSettings.settlement_notifications ?? true,
        });
      }
      setIsLoading(false);
    }
    init();
  }, []);

  const handleSave = async (section?: string) => {
    if (!creator) return;
    setLoading(true);

    try {
      await updateCreatorSettings({
        creatorId: creator.id,
        section,
        displayName: settings.displayName,
        email: settings.email,
        phone: settings.phone,
        country: settings.country,
        paymentMethod: settings.paymentMethod,
        paypalEmail: settings.paypalEmail,
        bankName: settings.bankName,
        accountNumber: settings.accountNumber,
        swiftCode: settings.swiftCode,
        notificationSettings: {
          emailNotifications: settings.emailNotifications,
          orderNotifications: settings.orderNotifications,
          settlementNotifications: settings.settlementNotifications,
        },
      });
      toast.success(t('settingsSaved'));
    } catch (error) {
      console.error('Save error:', error);
      toast.error(tCommon('error'));
    } finally {
      setLoading(false);
    }
  };

  const countries = [
    { code: 'US', name: 'United States', flag: '\u{1F1FA}\u{1F1F8}' },
    { code: 'JP', name: 'Japan', flag: '\u{1F1EF}\u{1F1F5}' },
    { code: 'KR', name: 'South Korea', flag: '\u{1F1F0}\u{1F1F7}' },
    { code: 'CN', name: 'China', flag: '\u{1F1E8}\u{1F1F3}' },
    { code: 'TW', name: 'Taiwan', flag: '\u{1F1F9}\u{1F1FC}' },
    { code: 'TH', name: 'Thailand', flag: '\u{1F1F9}\u{1F1ED}' },
    { code: 'VN', name: 'Vietnam', flag: '\u{1F1FB}\u{1F1F3}' },
    { code: 'ID', name: 'Indonesia', flag: '\u{1F1EE}\u{1F1E9}' },
    { code: 'MY', name: 'Malaysia', flag: '\u{1F1F2}\u{1F1FE}' },
    { code: 'SG', name: 'Singapore', flag: '\u{1F1F8}\u{1F1EC}' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-headline font-bold">{t('settings')}</h1>
        <p className="text-sm text-muted-foreground">{t('settingsDesc')}</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="flex flex-wrap h-auto gap-1 w-full">
          <TabsTrigger value="profile" className="flex-1 min-w-0 text-xs sm:text-sm">
            <User className="h-4 w-4 mr-1 hidden sm:inline" />
            {t('profileSection')}
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex-1 min-w-0 text-xs sm:text-sm">
            <CreditCard className="h-4 w-4 mr-1 hidden sm:inline" />
            {t('paymentInfo')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1 min-w-0 text-xs sm:text-sm">
            <Bell className="h-4 w-4 mr-1 hidden sm:inline" />
            {t('notifications')}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <User className="h-5 w-5" />
                {t('profileSection')}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">{t('profileSectionDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('displayName')}</Label>
                  <Input
                    placeholder={t('displayNamePlaceholder')}
                    value={settings.displayName}
                    onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('email')}</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('phone')}</Label>
                  <Input
                    placeholder="+1 000-000-0000"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {t('country')}
                  </Label>
                  <select
                    value={settings.country}
                    onChange={(e) => setSettings({ ...settings, country: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Button onClick={() => handleSave('profile')} disabled={loading} className="btn-gold w-full sm:w-auto">
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{tCommon('loading')}</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" />{tCommon('save')}</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <CreditCard className="h-5 w-5" />
                {t('paymentInfo')}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">{t('paymentInfoDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-6">
              {/* Payment Method */}
              <div className="space-y-2">
                <Label>{t('paymentMethod')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'paypal', label: 'PayPal' },
                    { value: 'bank', label: t('bankTransfer') },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSettings({ ...settings, paymentMethod: option.value })}
                      className={`p-3 rounded-lg border-2 transition-all text-sm ${
                        settings.paymentMethod === option.value
                          ? 'border-primary bg-primary/10'
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* PayPal */}
              {settings.paymentMethod === 'paypal' && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <Label>{t('paypalEmail')}</Label>
                    <Input
                      type="email"
                      placeholder="paypal@example.com"
                      value={settings.paypalEmail}
                      onChange={(e) => setSettings({ ...settings, paypalEmail: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">{t('paypalEmailDesc')}</p>
                  </div>
                </div>
              )}

              {/* Bank Transfer */}
              {settings.paymentMethod === 'bank' && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t('bankNameLabel')}</Label>
                      <Input
                        placeholder="Bank Name"
                        value={settings.bankName}
                        onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>SWIFT/BIC</Label>
                      <Input
                        placeholder="XXXXXXXX"
                        value={settings.swiftCode}
                        onChange={(e) => setSettings({ ...settings, swiftCode: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>{t('accountNumberLabel')}</Label>
                      <Input
                        placeholder="Account number / IBAN"
                        value={settings.accountNumber}
                        onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm font-medium text-blue-500">{t('settlementInfo')}</p>
                <ul className="mt-2 text-xs sm:text-sm text-muted-foreground space-y-1">
                  <li>- {t('settlementNote1')}</li>
                  <li>- {t('settlementNote2')}</li>
                  <li>- {t('settlementNote3')}</li>
                </ul>
              </div>

              <Button onClick={() => handleSave('payment')} disabled={loading} className="btn-gold w-full sm:w-auto">
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{tCommon('loading')}</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" />{tCommon('save')}</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Bell className="h-5 w-5" />
                {t('notifications')}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">{t('notificationsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <Label>{t('emailNotifications')}</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('emailNotificationsDesc')}</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <Label>{t('orderNotifications')}</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('orderNotificationsDesc')}</p>
                </div>
                <Switch
                  checked={settings.orderNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, orderNotifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <Label>{t('settlementNotifications')}</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('settlementNotificationsDesc')}</p>
                </div>
                <Switch
                  checked={settings.settlementNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, settlementNotifications: checked })}
                />
              </div>
              <Button onClick={() => handleSave('notifications')} disabled={loading} className="btn-gold w-full sm:w-auto">
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{tCommon('loading')}</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" />{tCommon('save')}</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tutorial Reset */}
      <Card>
        <CardContent className="p-4 sm:p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">온보딩 튜토리얼</p>
            <p className="text-xs text-muted-foreground">처음 시작 가이드를 다시 볼 수 있습니다</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              useOnboardingStore.getState().resetTutorial();
              toast.success('튜토리얼이 초기화되었습니다. 대시보드로 이동하면 다시 시작됩니다.');
            }}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            다시 보기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

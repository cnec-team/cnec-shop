'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { User, CreditCard, Bell, Globe, Loader2, Save, RotateCcw, Truck, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { getCreatorSession, updateCreatorSettings } from '@/lib/actions/creator';
import { useOnboardingStore } from '@/lib/store/onboarding';

function formatPhoneNumber(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
}

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
    // 배송 정보 (체험 신청 시 사용)
    shippingName: '',
    shippingPhone: '',
    shippingZipcode: '',
    shippingAddress: '',
    shippingAddressDetail: '',
  });

  // Daum 주소 검색 (embed 방식 — 모바일 팝업 차단 우회)
  const [showAddressModal, setShowAddressModal] = useState(false);
  const addressEmbedRef = useRef<HTMLDivElement>(null);
  const addressDetailRef = useRef<HTMLInputElement>(null);

  const loadDaumPostcode = () => {
    return new Promise<void>((resolve) => {
      if ((window as any).daum?.Postcode) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  };

  const handleSearchAddress = async () => {
    await loadDaumPostcode();
    setShowAddressModal(true);
  };

  useEffect(() => {
    if (!showAddressModal || !addressEmbedRef.current) return;
    const container = addressEmbedRef.current;
    container.innerHTML = '';
    new (window as any).daum.Postcode({
      oncomplete: (data: { zonecode: string; roadAddress: string; jibunAddress: string }) => {
        setSettings((prev) => ({
          ...prev,
          shippingZipcode: data.zonecode,
          shippingAddress: data.roadAddress || data.jibunAddress,
        }));
        setShowAddressModal(false);
        setTimeout(() => {
          addressDetailRef.current?.focus();
        }, 100);
      },
      width: '100%',
      height: '100%',
    }).embed(container);
  }, [showAddressModal]);

  useEffect(() => {
    async function init() {
      const creatorData = await getCreatorSession();
      if (creatorData) {
        setCreator(creatorData as any);
        const c = creatorData as Record<string, any>;
        const notifSettings = c.notificationSettings || {};
        const shipping = c.defaultShippingAddress || {};
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
          shippingName: shipping.name || '',
          shippingPhone: shipping.phone || '',
          shippingZipcode: shipping.zipcode || '',
          shippingAddress: shipping.address || '',
          shippingAddressDetail: shipping.addressDetail || '',
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
        shippingName: settings.shippingName,
        shippingPhone: settings.shippingPhone,
        shippingZipcode: settings.shippingZipcode,
        shippingAddress: settings.shippingAddress,
        shippingAddressDetail: settings.shippingAddressDetail,
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
    { code: 'KR', name: '한국', flag: '\u{1F1F0}\u{1F1F7}' },
    { code: 'US', name: '미국', flag: '\u{1F1FA}\u{1F1F8}' },
    { code: 'JP', name: '일본', flag: '\u{1F1EF}\u{1F1F5}' },
    { code: 'CN', name: '중국', flag: '\u{1F1E8}\u{1F1F3}' },
    { code: 'TW', name: '대만', flag: '\u{1F1F9}\u{1F1FC}' },
    { code: 'TH', name: '태국', flag: '\u{1F1F9}\u{1F1ED}' },
    { code: 'VN', name: '베트남', flag: '\u{1F1FB}\u{1F1F3}' },
    { code: 'ID', name: '인도네시아', flag: '\u{1F1EE}\u{1F1E9}' },
    { code: 'MY', name: '말레이시아', flag: '\u{1F1F2}\u{1F1FE}' },
    { code: 'SG', name: '싱가포르', flag: '\u{1F1F8}\u{1F1EC}' },
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
          <TabsTrigger value="shipping" className="flex-1 min-w-0 text-xs sm:text-sm">
            <Truck className="h-4 w-4 mr-1 hidden sm:inline" />
            배송 정보
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

        {/* Shipping Tab */}
        <TabsContent value="shipping" className="space-y-4">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Truck className="h-5 w-5" />
                배송 정보
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                제품 체험 신청 시 브랜드가 샘플을 보낼 주소입니다
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>이름 (실명)</Label>
                  <Input
                    placeholder="배송받을 실명을 입력해주세요"
                    value={settings.shippingName}
                    onChange={(e) => setSettings({ ...settings, shippingName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>연락처</Label>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    placeholder="010-0000-0000"
                    value={settings.shippingPhone}
                    onChange={(e) =>
                      setSettings({ ...settings, shippingPhone: formatPhoneNumber(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>우편번호</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="우편번호"
                    value={settings.shippingZipcode}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSearchAddress}
                    className="shrink-0"
                  >
                    <Search className="h-4 w-4 mr-1" />
                    주소 검색
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>기본 주소</Label>
                <Input
                  placeholder="주소 검색 버튼을 눌러주세요"
                  value={settings.shippingAddress}
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <Label>상세 주소</Label>
                <Input
                  ref={addressDetailRef}
                  placeholder="동/호수 등 상세 주소"
                  value={settings.shippingAddressDetail}
                  onChange={(e) =>
                    setSettings({ ...settings, shippingAddressDetail: e.target.value })
                  }
                />
              </div>

              <Button
                onClick={() => handleSave('shipping')}
                disabled={loading}
                className="btn-gold w-full sm:w-auto"
              >
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
                    { value: 'paypal', label: '페이팔' },
                    { value: 'bank', label: '계좌이체' },
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
                        placeholder="은행명"
                        value={settings.bankName}
                        onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>SWIFT/BIC</Label>
                      <Input
                        placeholder="SWIFT 코드"
                        value={settings.swiftCode}
                        onChange={(e) => setSettings({ ...settings, swiftCode: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>{t('accountNumberLabel')}</Label>
                      <Input
                        placeholder="계좌번호"
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

      {/* 주소 검색 모달 (embed 방식 — 모바일 팝업 차단 우회) */}
      {showAddressModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl h-[85vh] sm:h-[520px] flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">주소 검색</h3>
              <button
                onClick={() => setShowAddressModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="닫기"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div ref={addressEmbedRef} className="flex-1 overflow-hidden" />
          </div>
        </div>
      )}
    </div>
  );
}

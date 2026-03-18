'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminSettings, updateAdminSettings } from '@/lib/actions/admin';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    site_name: 'CNEC Shop',
    site_url: 'https://cnecshop.netlify.app',
    default_commission: '25',
    min_commission: '20',
    max_commission: '30',
    mocra_threshold_warning: '800000',
    mocra_threshold_danger: '1000000',
    maintenance_mode: 'false',
    allow_new_signups: 'true',
    platform_fee_rate: '0.05',
    min_settlement_amount: '1000',
    settlement_day: '20',
    referral_reward_inviter: '5000',
    referral_reward_invitee: '3000',
  });

  useEffect(() => {
    async function load() {
      try {
        const data = await getAdminSettings();
        setSettings(data as typeof settings);
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAdminSettings(settings);
      toast.success('설정이 저장되었습니다');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('설정 저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  const set = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">설정</h1>
        <p className="text-muted-foreground">플랫폼 설정을 관리합니다</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">일반</TabsTrigger>
          <TabsTrigger value="commission">수수료</TabsTrigger>
          <TabsTrigger value="settlement">정산</TabsTrigger>
          <TabsTrigger value="mocra">MoCRA</TabsTrigger>
          <TabsTrigger value="system">시스템</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>일반 설정</CardTitle>
              <CardDescription>기본 플랫폼 설정</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>사이트 이름</Label>
                  <Input
                    value={settings.site_name}
                    onChange={(e) => set('site_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>사이트 URL</Label>
                  <Input
                    value={settings.site_url}
                    onChange={(e) => set('site_url', e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                저장
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commission" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>수수료 설정</CardTitle>
              <CardDescription>크리에이터 수수료율 설정</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>기본 수수료 (%)</Label>
                  <Input
                    type="number"
                    value={settings.default_commission}
                    onChange={(e) => set('default_commission', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>최소 수수료 (%)</Label>
                  <Input
                    type="number"
                    value={settings.min_commission}
                    onChange={(e) => set('min_commission', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>최대 수수료 (%)</Label>
                  <Input
                    type="number"
                    value={settings.max_commission}
                    onChange={(e) => set('max_commission', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>플랫폼 수수료율</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={settings.platform_fee_rate}
                  onChange={(e) => set('platform_fee_rate', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">0.05 = 5%</p>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                저장
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settlement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>정산 설정</CardTitle>
              <CardDescription>정산 및 리퍼럴 관련 설정</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>최소 정산 금액 (원)</Label>
                  <Input
                    type="number"
                    value={settings.min_settlement_amount}
                    onChange={(e) => set('min_settlement_amount', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>정산일 (매월)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="28"
                    value={settings.settlement_day}
                    onChange={(e) => set('settlement_day', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>추천인 보상 (원)</Label>
                  <Input
                    type="number"
                    value={settings.referral_reward_inviter}
                    onChange={(e) => set('referral_reward_inviter', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>피추천인 보상 (원)</Label>
                  <Input
                    type="number"
                    value={settings.referral_reward_invitee}
                    onChange={(e) => set('referral_reward_invitee', e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                저장
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mocra" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>MoCRA 설정</CardTitle>
              <CardDescription>FDA 규정 준수를 위한 미국 화장품 매출 기준값</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>경고 기준 (노란색) - USD</Label>
                  <Input
                    type="number"
                    value={settings.mocra_threshold_warning}
                    onChange={(e) => set('mocra_threshold_warning', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">미국 매출이 이 금액을 초과하면 알림</p>
                </div>
                <div className="space-y-2">
                  <Label>위험 기준 (빨간색) - USD</Label>
                  <Input
                    type="number"
                    value={settings.mocra_threshold_danger}
                    onChange={(e) => set('mocra_threshold_danger', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">미국 매출이 이 금액을 초과하면 판매 중단</p>
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                저장
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>시스템 설정</CardTitle>
              <CardDescription>플랫폼 유지보수 및 접근 제어</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>유지보수 모드</Label>
                  <p className="text-sm text-muted-foreground">관리자 외 사이트 접근 차단</p>
                </div>
                <Switch
                  checked={settings.maintenance_mode === 'true'}
                  onCheckedChange={(checked) => set('maintenance_mode', String(checked))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>신규 가입 허용</Label>
                  <p className="text-sm text-muted-foreground">새 사용자의 회원가입 허용</p>
                </div>
                <Switch
                  checked={settings.allow_new_signups === 'true'}
                  onCheckedChange={(checked) => set('allow_new_signups', String(checked))}
                />
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                저장
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

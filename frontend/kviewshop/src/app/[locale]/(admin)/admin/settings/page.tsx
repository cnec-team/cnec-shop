'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'CNEC Shop',
    siteUrl: 'https://cnecshop.netlify.app',
    defaultCommission: 25,
    minCommission: 20,
    maxCommission: 30,
    mocraThresholdWarning: 800000,
    mocraThresholdDanger: 1000000,
    maintenanceMode: false,
    allowNewSignups: true,
  });

  const handleSave = () => {
    toast.success('설정이 저장되었습니다');
  };

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
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>사이트 URL</Label>
                  <Input
                    value={settings.siteUrl}
                    onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleSave}>저장</Button>
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
                    value={settings.defaultCommission}
                    onChange={(e) => setSettings({ ...settings, defaultCommission: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>최소 수수료 (%)</Label>
                  <Input
                    type="number"
                    value={settings.minCommission}
                    onChange={(e) => setSettings({ ...settings, minCommission: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>최대 수수료 (%)</Label>
                  <Input
                    type="number"
                    value={settings.maxCommission}
                    onChange={(e) => setSettings({ ...settings, maxCommission: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <Button onClick={handleSave}>저장</Button>
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
                    value={settings.mocraThresholdWarning}
                    onChange={(e) => setSettings({ ...settings, mocraThresholdWarning: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">미국 매출이 이 금액을 초과하면 알림</p>
                </div>
                <div className="space-y-2">
                  <Label>위험 기준 (빨간색) - USD</Label>
                  <Input
                    type="number"
                    value={settings.mocraThresholdDanger}
                    onChange={(e) => setSettings({ ...settings, mocraThresholdDanger: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">미국 매출이 이 금액을 초과하면 판매 중단</p>
                </div>
              </div>
              <Button onClick={handleSave}>저장</Button>
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
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>신규 가입 허용</Label>
                  <p className="text-sm text-muted-foreground">새 사용자의 회원가입 허용</p>
                </div>
                <Switch
                  checked={settings.allowNewSignups}
                  onCheckedChange={(checked) => setSettings({ ...settings, allowNewSignups: checked })}
                />
              </div>
              <Button onClick={handleSave}>저장</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

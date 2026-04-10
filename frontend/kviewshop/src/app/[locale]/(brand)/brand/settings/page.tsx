'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Percent, Building2, CreditCard, Info, Globe, ShieldCheck,
  X, Check, FileText, Plus, Trash2, ImageIcon, Loader2, Tags,
  Truck, ChevronDown, ChevronUp, Save,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';
import { toast } from 'sonner';
import { getBrandSettings, updateBrandSettings } from '@/lib/actions/brand';
import { uploadImage } from '@/lib/upload';
import { useTranslations } from 'next-intl';
import { SHIPPING_REGIONS, CERTIFICATION_TYPES, getRegionCountryCodes } from '@/lib/shipping-countries';

interface Certification {
  id: string;
  type: string;
  name: string;
  issueDate: string;
  expiryDate: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface BrandLine {
  id: string;
  name: string;
  logo_url: string;
  description: string;
}

// ── Section Card Wrapper ──────────────────────────────────────────
function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
  collapsible = false,
  defaultOpen = true,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        type="button"
        className={`w-full flex items-center gap-4 p-6 text-left ${collapsible ? 'cursor-pointer hover:bg-gray-50/50 transition-colors' : 'cursor-default'}`}
        onClick={() => collapsible && setOpen(!open)}
      >
        <div className="shrink-0 w-11 h-11 rounded-xl bg-gray-900 text-white flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        </div>
        {collapsible && (
          open ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
        )}
      </button>
      {(!collapsible || open) && (
        <div className="px-6 pb-6 pt-0 space-y-5">
          <div className="border-t border-gray-100 pt-5" />
          {children}
        </div>
      )}
    </div>
  );
}

export default function BrandSettingsPage() {
  const t = useTranslations('brandSettings');
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    brandName: '',
    businessNumber: '',
    contactEmail: '',
    contactPhone: '',
    creatorCommissionRate: 15,
    enableTieredCommission: false,
    tier1Rate: 15,
    tier2Rate: 20,
    tier3Rate: 25,
    tier4Rate: 30,
    settlementCycle: 'monthly',
    minimumPayout: 10000,
    bankCode: '',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    bankVerified: false,
    bankVerifiedAt: '',
    defaultShippingFee: 3000,
    freeShippingThreshold: 50000,
    defaultCourier: 'cj',
    returnAddress: '',
    exchangePolicy: '',
    defaultCommissionRate: 15,
    allowCreatorPickGlobal: true,
  });

  const [shippingCountries, setShippingCountries] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [newCert, setNewCert] = useState({
    type: '', name: '', issueDate: '', expiryDate: '', fileUrl: '',
  });
  const [showAddCert, setShowAddCert] = useState(false);
  const [brandLines, setBrandLines] = useState<BrandLine[]>([]);
  const [newBrandLine, setNewBrandLine] = useState({ name: '', description: '' });
  const [showAddBrandLine, setShowAddBrandLine] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null);

  // ── Handlers ────────────────────────────────────────────────────
  const handleAddBrandLine = () => {
    if (!newBrandLine.name.trim()) return;
    setBrandLines(prev => [...prev, {
      id: Date.now().toString(),
      name: newBrandLine.name,
      logo_url: '',
      description: newBrandLine.description,
    }]);
    setNewBrandLine({ name: '', description: '' });
    setShowAddBrandLine(false);
  };

  const handleRemoveBrandLine = (id: string) => {
    setBrandLines(prev => prev.filter(bl => bl.id !== id));
  };

  const handleLogoUpload = async (brandLineId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('이미지 파일을 선택해주세요'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('로고는 2MB 이하만 가능합니다'); return; }
    setUploadingLogo(brandLineId);
    try {
      const publicUrl = await uploadImage(file, 'brand-logos');
      setBrandLines(prev => prev.map(bl => bl.id === brandLineId ? { ...bl, logo_url: publicUrl } : bl));
    } catch (err) {
      console.error('Logo upload error:', err);
      toast.error('로고 업로드에 실패했습니다');
    } finally {
      setUploadingLogo(null);
    }
  };

  const isRegionFullySelected = (regionId: string) => {
    const codes = getRegionCountryCodes(regionId);
    return codes.every(code => shippingCountries.includes(code));
  };
  const isRegionPartiallySelected = (regionId: string) => {
    const codes = getRegionCountryCodes(regionId);
    const selected = codes.filter(code => shippingCountries.includes(code));
    return selected.length > 0 && selected.length < codes.length;
  };
  const toggleRegion = (regionId: string) => {
    const codes = getRegionCountryCodes(regionId);
    if (isRegionFullySelected(regionId)) {
      setShippingCountries(prev => prev.filter(c => !codes.includes(c)));
    } else {
      setShippingCountries(prev => [...new Set([...prev, ...codes])]);
    }
  };
  const toggleCountry = (code: string) => {
    setShippingCountries(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };
  const selectAll = () => {
    setShippingCountries(SHIPPING_REGIONS.flatMap(r => r.countries.map(c => c.code)));
  };
  const deselectAll = () => setShippingCountries([]);

  const handleAddCertification = () => {
    if (!newCert.type || !newCert.name) return;
    setCertifications(prev => [...prev, {
      id: Date.now().toString(),
      ...newCert,
      status: 'pending' as const,
    }]);
    setNewCert({ type: '', name: '', issueDate: '', expiryDate: '', fileUrl: '' });
    setShowAddCert(false);
  };

  const handleRemoveCertification = (id: string) => {
    setCertifications(prev => prev.filter(c => c.id !== id));
  };

  const handleSave = async (section?: string) => {
    setLoading(true);
    setActiveSection(section ?? null);
    try {
      await updateBrandSettings({
        section,
        shippingCountries,
        certifications,
        brandLines,
        brandName: settings.brandName,
        businessNumber: settings.businessNumber,
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone,
        creatorCommissionRate: settings.creatorCommissionRate,
        enableTieredCommission: settings.enableTieredCommission,
        tier1Rate: settings.tier1Rate,
        tier2Rate: settings.tier2Rate,
        tier3Rate: settings.tier3Rate,
        tier4Rate: settings.tier4Rate,
        settlementCycle: settings.settlementCycle,
        minimumPayout: settings.minimumPayout,
        bankName: settings.bankName,
        accountNumber: settings.accountNumber,
        accountHolder: settings.accountHolder,
        defaultShippingFee: settings.defaultShippingFee,
        freeShippingThreshold: settings.freeShippingThreshold,
        defaultCourier: settings.defaultCourier,
        returnAddress: settings.returnAddress,
        exchangePolicy: settings.exchangePolicy,
      });
      toast.success('저장되었습니다');
    } catch {
      toast.error('저장에 실패했습니다');
    } finally {
      setLoading(false);
      setActiveSection(null);
    }
  };

  // ── Load Data ──────────────────────────────────────────────────
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getBrandSettings();
        if (data) {
          setSettings(prev => ({
            ...prev,
            brandName: data.brandName || '',
            businessNumber: data.businessNumber || '',
            contactEmail: data.contactEmail || '',
            contactPhone: data.contactPhone || '',
            creatorCommissionRate: Number(data.creatorCommissionRate) ?? 20,
            enableTieredCommission: data.enableTieredCommission ?? false,
            tier1Rate: Number(data.tier1Rate) ?? 15,
            tier2Rate: Number(data.tier2Rate) ?? 20,
            tier3Rate: Number(data.tier3Rate) ?? 25,
            tier4Rate: Number(data.tier4Rate) ?? 30,
            settlementCycle: data.settlementCycle || 'monthly',
            minimumPayout: Number(data.minimumPayout) ?? 10000,
            bankName: data.bankName || '',
            accountNumber: (data as Record<string, unknown>).bankAccount as string || '',
            accountHolder: (data as Record<string, unknown>).bankHolder as string || '',
            defaultShippingFee: Number(data.defaultShippingFee) ?? 3000,
            freeShippingThreshold: Number(data.freeShippingThreshold) ?? 50000,
            defaultCourier: data.defaultCourier || 'cj',
            returnAddress: data.returnAddress || '',
            exchangePolicy: data.exchangePolicy || '',
            defaultCommissionRate: Number(data.creatorCommissionRate) ?? 15,
            allowCreatorPickGlobal: true,
          }));
          setShippingCountries((data.shippingCountries as string[]) || []);
          setCertifications((data.certifications as unknown as Certification[]) || []);
          setBrandLines((data.brandLines as unknown as BrandLine[]) || []);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  const getCertStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/30"><Check className="h-3 w-3 mr-1" />승인됨</Badge>;
      case 'rejected':
        return <Badge variant="destructive">반려됨</Badge>;
      default:
        return <Badge variant="secondary">심사중</Badge>;
    }
  };

  const SaveButton = ({ section }: { section: string }) => (
    <Button
      onClick={() => handleSave(section)}
      disabled={loading}
      className="btn-gold h-11 px-6 rounded-xl text-sm font-medium"
    >
      {loading && activeSection === section ? (
        <><Loader2 className="w-4 h-4 animate-spin mr-2" />저장 중...</>
      ) : (
        <><Save className="w-4 h-4 mr-2" />저장</>
      )}
    </Button>
  );

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-24">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">브랜드 설정</h1>
        <p className="text-sm text-gray-500 mt-1">브랜드 정보와 정산, 배송 설정을 관리합니다</p>
      </div>

      {/* ── 2-Column Grid (Desktop) ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ━━━ LEFT COLUMN ━━━ */}
        <div className="space-y-5">

          {/* 기본 정보 */}
          <SettingsSection
            icon={Building2}
            title="기본 정보"
            description="브랜드명, 사업자번호, 연락처를 관리합니다"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">브랜드명</Label>
                <Input
                  placeholder="브랜드명을 입력하세요"
                  value={settings.brandName}
                  onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">사업자등록번호</Label>
                <Input
                  placeholder="000-00-00000"
                  value={settings.businessNumber}
                  onChange={(e) => setSettings({ ...settings, businessNumber: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">이메일</Label>
                  <Input
                    type="email"
                    placeholder="contact@brand.com"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">전화번호</Label>
                  <Input
                    placeholder="02-0000-0000"
                    value={settings.contactPhone}
                    onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
              <SaveButton section="general" />
            </div>
          </SettingsSection>

          {/* 계좌 정보 */}
          <SettingsSection
            icon={CreditCard}
            title="정산 계좌"
            description="정산 주기와 계좌 정보를 설정합니다"
          >
            <div className="space-y-5">
              {/* 정산 주기 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">정산 주기</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'weekly', label: '주간' },
                    { value: 'biweekly', label: '격주' },
                    { value: 'monthly', label: '월간' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSettings({ ...settings, settlementCycle: option.value })}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        settings.settlementCycle === option.value
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 최소 지급액 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">최소 지급액</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">&#8361;</span>
                  <Input
                    type="number"
                    value={settings.minimumPayout}
                    onChange={(e) => setSettings({ ...settings, minimumPayout: parseInt(e.target.value) || 0 })}
                    placeholder="10000"
                    className="h-11 rounded-xl pl-7"
                  />
                </div>
                <p className="text-xs text-gray-400">이 금액 이상일 때만 정산이 처리됩니다</p>
              </div>

              {/* 계좌 인증 */}
              <div className="border-t border-gray-100 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    계좌 인증
                  </h4>
                  {settings.bankVerified && (
                    <Badge className="bg-green-500/20 text-green-600 border-green-500/30 rounded-lg">
                      <Check className="h-3 w-3 mr-1" />인증 완료
                    </Badge>
                  )}
                </div>

                {settings.bankVerified ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-green-700 text-sm">계좌 인증이 완료되었습니다</p>
                        <div className="mt-2 grid gap-1 text-sm text-gray-600">
                          <p>은행: {settings.bankName}</p>
                          <p>예금주: {settings.accountHolder}</p>
                          <p>계좌번호: {settings.accountNumber?.replace(/(\d{3})(\d+)(\d{4})/, '$1-****-$3')}</p>
                          {settings.bankVerifiedAt && <p>인증일시: {settings.bankVerifiedAt}</p>}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 rounded-xl"
                          onClick={() => setSettings({ ...settings, bankVerified: false, bankVerifiedAt: '' })}
                        >
                          계좌 변경
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <Info className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-700">정산을 받으시려면 계좌 인증이 필요합니다. 사업자등록번호와 예금주명이 일치해야 인증이 완료됩니다.</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">은행 선택</Label>
                      <select
                        value={settings.bankCode}
                        onChange={(e) => {
                          const selected = e.target.value;
                          const bankNames: Record<string, string> = {
                            '004': '국민은행', '003': '기업은행', '011': '농협은행',
                            '020': '우리은행', '088': '신한은행', '081': '하나은행',
                            '023': 'SC제일은행', '027': '한국씨티은행', '032': '부산은행',
                            '031': '대구은행', '034': '광주은행', '035': '제주은행',
                            '037': '전북은행', '039': '경남은행', '045': '새마을금고',
                            '048': '신협', '071': '우체국', '089': '케이뱅크',
                            '090': '카카오뱅크', '092': '토스뱅크',
                          };
                          setSettings({ ...settings, bankCode: selected, bankName: bankNames[selected] || '' });
                        }}
                        className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm"
                      >
                        <option value="">은행을 선택하세요</option>
                        <option value="004">국민은행</option>
                        <option value="003">기업은행</option>
                        <option value="011">농협은행</option>
                        <option value="020">우리은행</option>
                        <option value="088">신한은행</option>
                        <option value="081">하나은행</option>
                        <option value="023">SC제일은행</option>
                        <option value="027">한국씨티은행</option>
                        <option value="032">부산은행</option>
                        <option value="031">대구은행</option>
                        <option value="034">광주은행</option>
                        <option value="035">제주은행</option>
                        <option value="037">전북은행</option>
                        <option value="039">경남은행</option>
                        <option value="045">새마을금고</option>
                        <option value="048">신협</option>
                        <option value="071">우체국</option>
                        <option value="089">케이뱅크</option>
                        <option value="090">카카오뱅크</option>
                        <option value="092">토스뱅크</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">계좌번호</Label>
                        <Input
                          placeholder="숫자만 입력"
                          value={settings.accountNumber}
                          onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value.replace(/[^0-9]/g, '') })}
                          maxLength={16}
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">예금주명</Label>
                        <Input
                          placeholder="(주)브랜드명"
                          value={settings.accountHolder}
                          onChange={(e) => setSettings({ ...settings, accountHolder: e.target.value })}
                          className="h-11 rounded-xl"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={async () => {
                        if (!settings.bankCode || !settings.accountNumber || !settings.accountHolder) {
                          toast.error('은행, 계좌번호, 예금주명을 모두 입력해주세요');
                          return;
                        }
                        if (settings.accountNumber.length < 10) {
                          toast.error('올바른 계좌번호를 입력해주세요');
                          return;
                        }
                        setLoading(true);
                        try {
                          await new Promise(resolve => setTimeout(resolve, 1500));
                          const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
                          setSettings(prev => ({ ...prev, bankVerified: true, bankVerifiedAt: now }));
                          toast.success('계좌 인증이 완료되었습니다');
                        } catch {
                          toast.error('계좌 인증에 실패했습니다. 정보를 확인해주세요.');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading || !settings.bankCode || !settings.accountNumber || !settings.accountHolder}
                      className="w-full btn-gold h-11 rounded-xl font-medium"
                    >
                      {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin mr-2" />인증 진행 중...</>
                      ) : (
                        <><ShieldCheck className="mr-2 h-4 w-4" />계좌 실명 인증</>
                      )}
                    </Button>
                  </div>
                )}

                <div className="flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <p>계좌 실명인증을 통해 안전하게 확인됩니다</p>
                    <p>사업자 명의의 계좌만 등록 가능합니다</p>
                    <p>인증 완료 후 정산이 자동으로 진행됩니다</p>
                  </div>
                </div>
              </div>

              <SaveButton section="settlement" />
            </div>
          </SettingsSection>

          {/* 수수료 설정 */}
          <SettingsSection
            icon={Percent}
            title="수수료 설정"
            description="크리에이터 판매 수수료율을 관리합니다"
          >
            <div className="space-y-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700">기본 수수료율</Label>
                  <span className="text-2xl font-bold text-gray-900">{settings.creatorCommissionRate}%</span>
                </div>
                <Slider
                  value={[settings.creatorCommissionRate]}
                  onValueChange={(value) => setSettings({ ...settings, creatorCommissionRate: value[0] })}
                  min={15}
                  max={60}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>15%</span>
                  <span>60%</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">등급별 수수료</p>
                    <p className="text-xs text-gray-400 mt-0.5">크리에이터 등급에 따라 다른 수수료율 적용</p>
                  </div>
                  <Switch
                    checked={settings.enableTieredCommission}
                    onCheckedChange={(checked) => setSettings({ ...settings, enableTieredCommission: checked })}
                  />
                </div>

                {settings.enableTieredCommission && (
                  <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl">
                    {[
                      { key: 'tier1Rate', label: '일반', color: 'bg-gray-400' },
                      { key: 'tier2Rate', label: '실버', color: 'bg-gray-300' },
                      { key: 'tier3Rate', label: '골드', color: 'bg-yellow-500' },
                      { key: 'tier4Rate', label: 'VIP', color: 'bg-purple-500' },
                    ].map(tier => (
                      <div key={tier.key} className="space-y-1.5">
                        <Label className="flex items-center gap-2 text-xs text-gray-600">
                          <span className={`w-2.5 h-2.5 rounded-full ${tier.color}`} />
                          {tier.label}
                        </Label>
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            value={settings[tier.key as keyof typeof settings] as number}
                            onChange={(e) => setSettings({ ...settings, [tier.key]: parseInt(e.target.value) || 0 })}
                            className="h-9 rounded-lg w-20 text-sm"
                          />
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <SaveButton section="commission" />
            </div>
          </SettingsSection>
        </div>

        {/* ━━━ RIGHT COLUMN ━━━ */}
        <div className="space-y-5">

          {/* 배송 설정 */}
          <SettingsSection
            icon={Truck}
            title="배송 설정"
            description="기본 배송비, 택배사, 반품 주소를 관리합니다"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">기본 배송비</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">&#8361;</span>
                    <Input
                      type="number"
                      placeholder="3000"
                      value={settings.defaultShippingFee}
                      onChange={(e) => setSettings({ ...settings, defaultShippingFee: Number(e.target.value) })}
                      className="h-11 rounded-xl pl-7"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">무료배송 기준</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">&#8361;</span>
                    <Input
                      type="number"
                      placeholder="50000"
                      value={settings.freeShippingThreshold}
                      onChange={(e) => setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })}
                      className="h-11 rounded-xl pl-7"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">기본 택배사</Label>
                  <Select
                    value={settings.defaultCourier}
                    onValueChange={(v) => setSettings({ ...settings, defaultCourier: v })}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="epost">우체국택배</SelectItem>
                      <SelectItem value="cj">CJ대한통운</SelectItem>
                      <SelectItem value="hanjin">한진택배</SelectItem>
                      <SelectItem value="lotte">롯데택배</SelectItem>
                      <SelectItem value="logen">로젠택배</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">기본 수수료율</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="15"
                      min={0}
                      max={100}
                      value={settings.defaultCommissionRate}
                      onChange={(e) => setSettings({ ...settings, defaultCommissionRate: Number(e.target.value) })}
                      className="h-11 rounded-xl pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">반품 주소</Label>
                <Textarea
                  placeholder="반품 수거 주소를 입력하세요"
                  value={settings.returnAddress}
                  onChange={(e) => setSettings({ ...settings, returnAddress: e.target.value })}
                  rows={2}
                  className="rounded-xl resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">교환/반품 정책</Label>
                <Textarea
                  placeholder="교환/반품 정책을 입력하세요"
                  value={settings.exchangePolicy}
                  onChange={(e) => setSettings({ ...settings, exchangePolicy: e.target.value })}
                  rows={3}
                  className="rounded-xl resize-none"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                <div>
                  <p className="font-medium text-sm text-gray-900">크리에이터 픽 허용</p>
                  <p className="text-xs text-gray-400 mt-0.5">크리에이터가 직접 상품을 선택할 수 있도록 허용합니다</p>
                </div>
                <Switch
                  checked={settings.allowCreatorPickGlobal}
                  onCheckedChange={(checked) => setSettings({ ...settings, allowCreatorPickGlobal: checked })}
                />
              </div>

              <SaveButton section="product_shipping" />
            </div>
          </SettingsSection>

          {/* 브랜드 라인 */}
          <SettingsSection
            icon={Tags}
            title="브랜드 라인"
            description="회사 내 여러 브랜드 라인을 관리합니다"
            collapsible
            defaultOpen={false}
          >
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setShowAddBrandLine(true)} className="btn-gold rounded-xl">
                  <Plus className="h-4 w-4 mr-1" />추가
                </Button>
              </div>

              {showAddBrandLine && (
                <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-600">라인명 *</Label>
                      <Input placeholder="브랜드 라인명" value={newBrandLine.name} onChange={(e) => setNewBrandLine({ ...newBrandLine, name: e.target.value })} className="h-10 rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-600">설명</Label>
                      <Input placeholder="간단한 설명" value={newBrandLine.description} onChange={(e) => setNewBrandLine({ ...newBrandLine, description: e.target.value })} className="h-10 rounded-xl" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddBrandLine} className="btn-gold rounded-xl">추가</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAddBrandLine(false)} className="rounded-xl">취소</Button>
                  </div>
                </div>
              )}

              {brandLines.length === 0 && !showAddBrandLine ? (
                <div className="text-center py-8">
                  <Tags className="mx-auto h-10 w-10 text-gray-300" />
                  <p className="mt-3 text-sm text-gray-500">등록된 브랜드 라인이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {brandLines.map((line) => (
                    <div key={line.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                      <input type="file" accept="image/*" className="hidden" id={`logo-${line.id}`} onChange={(e) => handleLogoUpload(line.id, e)} />
                      <label htmlFor={`logo-${line.id}`} className="block w-12 h-12 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-400 cursor-pointer overflow-hidden transition-colors shrink-0">
                        {uploadingLogo === line.id ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-50"><Loader2 className="h-4 w-4 animate-spin" /></div>
                        ) : line.logo_url ? (
                          <Image src={line.logo_url} alt={line.name} width={48} height={48} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-50"><ImageIcon className="h-4 w-4 text-gray-300" /></div>
                        )}
                      </label>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{line.name}</p>
                        {line.description && <p className="text-xs text-gray-400 truncate">{line.description}</p>}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveBrandLine(line.id)} className="text-red-500 hover:text-red-600 shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <SaveButton section="brand_lines" />
            </div>
          </SettingsSection>

          {/* 인증서 관리 */}
          <SettingsSection
            icon={ShieldCheck}
            title="인증서 관리"
            description="사업자 인증서, 제품 인증서를 관리합니다"
            collapsible
            defaultOpen={false}
          >
            <div className="space-y-4">
              {certifications.length > 0 && (
                <div className="space-y-2">
                  {certifications.map((cert) => (
                    <div key={cert.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-sm">{cert.name}</p>
                          <p className="text-xs text-gray-400">
                            {cert.issueDate && `${cert.issueDate}`}
                            {cert.expiryDate && ` ~ ${cert.expiryDate}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getCertStatusBadge(cert.status)}
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveCertification(cert.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showAddCert ? (
                <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                  <h4 className="font-medium text-sm">인증서 추가</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-600">종류</Label>
                      <select
                        className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm"
                        value={newCert.type}
                        onChange={(e) => setNewCert({ ...newCert, type: e.target.value })}
                      >
                        <option value="">선택</option>
                        {CERTIFICATION_TYPES.map((type) => (
                          <option key={type.id} value={type.id}>{t(`certTypes.${type.nameKey}`)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-600">인증서명</Label>
                      <Input placeholder="인증서 이름" value={newCert.name} onChange={(e) => setNewCert({ ...newCert, name: e.target.value })} className="h-10 rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-600">발급일</Label>
                      <Input type="date" value={newCert.issueDate} onChange={(e) => setNewCert({ ...newCert, issueDate: e.target.value })} className="h-10 rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-600">만료일</Label>
                      <Input type="date" value={newCert.expiryDate} onChange={(e) => setNewCert({ ...newCert, expiryDate: e.target.value })} className="h-10 rounded-xl" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddCertification} disabled={!newCert.type || !newCert.name} className="btn-gold rounded-xl">추가</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAddCert(false)} className="rounded-xl">취소</Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setShowAddCert(true)} className="w-full rounded-xl">
                  <ShieldCheck className="h-4 w-4 mr-2" />인증서 추가
                </Button>
              )}

              <SaveButton section="certifications" />
            </div>
          </SettingsSection>

          {/* 배송 국가 */}
          <SettingsSection
            icon={Globe}
            title="배송 가능 국가"
            description="해외 배송 가능 국가를 설정합니다"
            collapsible
            defaultOpen={false}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{shippingCountries.length}개국 선택됨</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll} className="rounded-xl text-xs">전체 선택</Button>
                  <Button variant="outline" size="sm" onClick={deselectAll} className="rounded-xl text-xs">전체 해제</Button>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {SHIPPING_REGIONS.map((region) => (
                  <div key={region.id} className="border border-gray-100 rounded-xl p-3">
                    <div className="flex items-center gap-3 mb-2">
                      <Checkbox
                        id={`region-${region.id}`}
                        checked={isRegionFullySelected(region.id)}
                        className={isRegionPartiallySelected(region.id) ? 'data-[state=unchecked]:bg-primary/30' : ''}
                        onCheckedChange={() => toggleRegion(region.id)}
                      />
                      <Label htmlFor={`region-${region.id}`} className="text-sm font-semibold cursor-pointer">
                        {t(`regions.${region.nameKey}`)}
                      </Label>
                      <Badge variant="secondary" className="ml-auto text-[10px]">
                        {region.countries.filter(c => shippingCountries.includes(c.code)).length}/{region.countries.length}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 ml-6">
                      {region.countries.map((country) => (
                        <div key={country.code} className="flex items-center gap-2">
                          <Checkbox
                            id={`country-${country.code}`}
                            checked={shippingCountries.includes(country.code)}
                            onCheckedChange={() => toggleCountry(country.code)}
                          />
                          <Label htmlFor={`country-${country.code}`} className="text-xs cursor-pointer">{t(`countries.${country.nameKey}`)}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <SaveButton section="shipping" />
            </div>
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}

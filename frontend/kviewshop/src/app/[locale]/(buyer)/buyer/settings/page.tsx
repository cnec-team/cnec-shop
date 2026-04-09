'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@/lib/hooks/use-user';
import {
  getShippingAddresses,
  addShippingAddress,
  updateShippingAddress,
  deleteShippingAddress,
  setDefaultShippingAddress,
  updateBuyerProfile,
  updateBuyerPassword,
  updateMarketingConsent,
} from '@/lib/actions/buyer';
import type { ShippingAddress } from '@/lib/actions/buyer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Home,
  Building2,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Lock,
  UserIcon,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';

// ==================== Daum Postcode API ====================

const loadDaumPostcode = () => {
  return new Promise<void>((resolve) => {
    if ((window as any).daum?.Postcode) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src =
      '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
};

// ==================== Types ====================

interface AddressForm {
  label: string;
  name: string;
  phone: string;
  address: string;
  addressDetail: string;
  zipcode: string;
  isDefault: boolean;
}

const emptyAddressForm: AddressForm = {
  label: '집',
  name: '',
  phone: '',
  address: '',
  addressDetail: '',
  zipcode: '',
  isDefault: false,
};

// ==================== Helper: label icon ====================

function getLabelIcon(label: string) {
  if (label === '회사') return <Building2 className="h-4 w-4" />;
  if (label === '집') return <Home className="h-4 w-4" />;
  return <MapPin className="h-4 w-4" />;
}

// ==================== Page Component ====================

export default function BuyerSettingsPage() {
  const { user, buyer, refetch } = useUser();

  // Shipping addresses
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<AddressForm>(emptyAddressForm);
  const [addressSaving, setAddressSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(
    null
  );
  const addressDetailRef = useRef<HTMLInputElement>(null);

  // Profile
  const [profileForm, setProfileForm] = useState({
    nickname: '',
    phone: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // Password
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Marketing
  const [marketingConsent, setMarketingConsent] = useState(false);

  // ==================== Load data ====================

  const loadAddresses = useCallback(async () => {
    if (!buyer) return;
    try {
      const data = await getShippingAddresses(buyer.id);
      setAddresses(data);
    } catch (error) {
      console.error('Failed to load addresses:', error);
    } finally {
      setAddressLoading(false);
    }
  }, [buyer]);

  useEffect(() => {
    if (buyer) {
      loadAddresses();
      setProfileForm({
        nickname: buyer.nickname || '',
        phone: buyer.phone || '',
      });
      setMarketingConsent(buyer.marketing_consent ?? false);
    }
  }, [buyer, loadAddresses]);

  // ==================== Shipping Address Handlers ====================

  const handleSearchAddress = async () => {
    await loadDaumPostcode();
    new (window as any).daum.Postcode({
      oncomplete: (data: any) => {
        setAddressForm((prev) => ({
          ...prev,
          zipcode: data.zonecode,
          address: data.roadAddress,
        }));
        setTimeout(() => addressDetailRef.current?.focus(), 100);
      },
    }).open();
  };

  const handleOpenAddDialog = () => {
    setEditingAddressId(null);
    setAddressForm(emptyAddressForm);
    setAddressDialogOpen(true);
  };

  const handleOpenEditDialog = (addr: ShippingAddress) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      label: addr.label,
      name: addr.name,
      phone: addr.phone,
      address: addr.address,
      addressDetail: addr.addressDetail,
      zipcode: addr.zipcode,
      isDefault: addr.isDefault,
    });
    setAddressDialogOpen(true);
  };

  const handleSaveAddress = async () => {
    if (
      !buyer ||
      !addressForm.name ||
      !addressForm.phone ||
      !addressForm.address ||
      !addressForm.zipcode
    ) {
      toast.error('필수 항목을 모두 입력해 주세요');
      return;
    }

    setAddressSaving(true);
    try {
      if (editingAddressId) {
        await updateShippingAddress(buyer.id, editingAddressId, addressForm);
        toast.success('배송지가 수정되었습니다');
      } else {
        await addShippingAddress(buyer.id, addressForm);
        toast.success('배송지가 추가되었습니다');
      }
      await loadAddresses();
      setAddressDialogOpen(false);
    } catch (error) {
      toast.error('배송지 저장에 실패했습니다');
    } finally {
      setAddressSaving(false);
    }
  };

  const handleDeleteAddress = async () => {
    if (!buyer || !deletingAddressId) return;
    try {
      await deleteShippingAddress(buyer.id, deletingAddressId);
      toast.success('배송지가 삭제되었습니다');
      await loadAddresses();
    } catch (error) {
      toast.error('배송지 삭제에 실패했습니다');
    } finally {
      setDeleteDialogOpen(false);
      setDeletingAddressId(null);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    if (!buyer) return;
    try {
      await setDefaultShippingAddress(buyer.id, addressId);
      toast.success('기본 배송지가 변경되었습니다');
      await loadAddresses();
    } catch (error) {
      toast.error('기본 배송지 변경에 실패했습니다');
    }
  };

  // ==================== Profile Handlers ====================

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      await updateBuyerProfile({
        nickname: profileForm.nickname,
        phone: profileForm.phone,
      });
      toast.success('저장되었습니다');
      refetch?.();
    } catch (error) {
      toast.error('프로필 저장에 실패했습니다');
    } finally {
      setProfileSaving(false);
    }
  };

  // ==================== Password Handlers ====================

  const handleChangePassword = async () => {
    setPasswordError('');

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('새 비밀번호는 8자 이상이어야 합니다');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다');
      return;
    }

    setPasswordSaving(true);
    try {
      await updateBuyerPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('비밀번호가 변경되었습니다');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      setPasswordError(error?.message || '비밀번호 변경에 실패했습니다');
    } finally {
      setPasswordSaving(false);
    }
  };

  // ==================== Marketing Handlers ====================

  const handleMarketingChange = async (checked: boolean) => {
    if (!buyer) return;
    setMarketingConsent(checked);
    try {
      await updateMarketingConsent(buyer.id, checked);
      toast.success(
        checked ? '마케팅 수신에 동의하셨습니다' : '마케팅 수신 동의가 해제되었습니다'
      );
    } catch (error) {
      setMarketingConsent(!checked);
      toast.error('설정 변경에 실패했습니다');
    }
  };

  // ==================== Render ====================

  if (!buyer) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">설정</h1>
        <p className="text-muted-foreground">
          배송지, 개인정보, 비밀번호를 관리합니다
        </p>
      </div>

      <Tabs defaultValue="shipping">
        <TabsList>
          <TabsTrigger value="shipping">
            <Truck className="mr-1.5 h-4 w-4" />
            배송지 관리
          </TabsTrigger>
          <TabsTrigger value="profile">
            <UserIcon className="mr-1.5 h-4 w-4" />
            개인정보
          </TabsTrigger>
          <TabsTrigger value="password">
            <Lock className="mr-1.5 h-4 w-4" />
            비밀번호 변경
          </TabsTrigger>
        </TabsList>

        {/* ==================== Tab 1: Shipping ====================  */}
        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle>배송지 관리</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {addressLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : addresses.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <MapPin className="mx-auto mb-2 h-10 w-10" />
                  <p>등록된 배송지가 없습니다</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="rounded-lg border p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getLabelIcon(addr.label)}
                          <span className="font-medium">{addr.label}</span>
                          {addr.isDefault && (
                            <Badge variant="secondary">기본배송지</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {!addr.isDefault && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefault(addr.id)}
                            >
                              기본으로 설정
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditDialog(addr)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeletingAddressId(addr.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-0.5">
                        <p>
                          {addr.name} / {addr.phone}
                        </p>
                        <p>
                          ({addr.zipcode}) {addr.address}{' '}
                          {addr.addressDetail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={handleOpenAddDialog}
              >
                <Plus className="mr-2 h-4 w-4" />
                새 배송지 추가
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== Tab 2: Profile ====================  */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>개인정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nickname">닉네임</Label>
                <Input
                  id="nickname"
                  value={profileForm.nickname}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      nickname: e.target.value,
                    }))
                  }
                  placeholder="닉네임을 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">전화번호</Label>
                <Input
                  id="phone"
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  placeholder="010-0000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={profileSaving}
              >
                {profileSaving && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                저장하기
              </Button>

              <Separator />

              {/* Marketing consent in profile tab */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>마케팅 정보 수신 동의</Label>
                  <p className="text-sm text-muted-foreground">
                    프로모션, 할인 정보 등을 받아보실 수 있습니다
                  </p>
                </div>
                <Switch
                  checked={marketingConsent}
                  onCheckedChange={handleMarketingChange}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== Tab 3: Password ====================  */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>비밀번호 변경</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">현재 비밀번호</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  placeholder="현재 비밀번호를 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">새 비밀번호</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  placeholder="8자 이상 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  placeholder="새 비밀번호를 다시 입력하세요"
                />
              </div>

              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}

              <Button
                onClick={handleChangePassword}
                disabled={
                  passwordSaving ||
                  !passwordForm.currentPassword ||
                  !passwordForm.newPassword ||
                  !passwordForm.confirmPassword
                }
              >
                {passwordSaving && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                변경하기
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ==================== Address Add/Edit Dialog ====================  */}
      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAddressId ? '배송지 수정' : '새 배송지 추가'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>배송지명</Label>
              <Select
                value={addressForm.label}
                onValueChange={(value) =>
                  setAddressForm((prev) => ({ ...prev, label: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="배송지명 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="집">집</SelectItem>
                  <SelectItem value="회사">회사</SelectItem>
                  <SelectItem value="기타">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addr-name">받는 사람</Label>
              <Input
                id="addr-name"
                value={addressForm.name}
                onChange={(e) =>
                  setAddressForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="이름을 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addr-phone">전화번호</Label>
              <Input
                id="addr-phone"
                value={addressForm.phone}
                onChange={(e) =>
                  setAddressForm((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                placeholder="010-0000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label>우편번호</Label>
              <div className="flex gap-2">
                <Input
                  value={addressForm.zipcode}
                  readOnly
                  placeholder="우편번호"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSearchAddress}
                >
                  주소 검색
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>주소</Label>
              <Input
                value={addressForm.address}
                readOnly
                placeholder="주소 검색을 눌러주세요"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addr-detail">상세주소</Label>
              <Input
                id="addr-detail"
                ref={addressDetailRef}
                value={addressForm.addressDetail}
                onChange={(e) =>
                  setAddressForm((prev) => ({
                    ...prev,
                    addressDetail: e.target.value,
                  }))
                }
                placeholder="상세주소를 입력하세요"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="addr-default"
                checked={addressForm.isDefault}
                onCheckedChange={(checked) =>
                  setAddressForm((prev) => ({
                    ...prev,
                    isDefault: checked === true,
                  }))
                }
              />
              <Label htmlFor="addr-default" className="cursor-pointer">
                기본 배송지로 설정
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddressDialogOpen(false)}
            >
              취소
            </Button>
            <Button onClick={handleSaveAddress} disabled={addressSaving}>
              {addressSaving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingAddressId ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== Delete Confirmation Dialog ====================  */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>배송지 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            이 배송지를 삭제하시겠습니까?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteAddress}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

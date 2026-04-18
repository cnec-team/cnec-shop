'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/use-user';
import { updateBuyerProfile, updateBuyerPassword } from '@/lib/actions/buyer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  ChevronLeft, User, Loader2, Lock, Save,
} from 'lucide-react';

export default function ProfilePage() {
  const params = useParams();
  const locale = params.locale as string;
  const username = params.username as string;
  const { user, buyer } = useUser();

  const [nickname, setNickname] = useState(buyer?.nickname || '');
  const [phone, setPhone] = useState(buyer?.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [isPwSaving, setIsPwSaving] = useState(false);

  const isSocial = !!(buyer as any)?.socialProvider;

  const handleSaveProfile = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await updateBuyerProfile({ nickname, phone });
      toast.success('프로필이 저장되었습니다');
    } catch (error: any) {
      toast.error(error.message || '저장에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (isPwSaving) return;
    if (newPw.length < 8) { toast.error('새 비밀번호는 8자 이상이어야 합니다'); return; }
    if (newPw !== confirmPw) { toast.error('새 비밀번호가 일치하지 않습니다'); return; }
    setIsPwSaving(true);
    try {
      await updateBuyerPassword({ currentPassword: currentPw, newPassword: newPw });
      toast.success('비밀번호가 변경되었습니다');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (error: any) {
      toast.error(error.message || '비밀번호 변경에 실패했습니다');
    } finally {
      setIsPwSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-lg mx-auto px-4 pt-4">
        <Link
          href={`/${locale}/${username}/me`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-0.5" />
          마이페이지
        </Link>

        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
          <User className="h-5 w-5" />
          회원정보
        </h1>

        {/* Profile */}
        <div className="bg-white rounded-2xl p-5 mb-3">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">이메일</label>
              <Input value={user?.email || ''} disabled className="h-11 rounded-xl bg-gray-50" />
              {isSocial && <p className="text-xs text-gray-400 mt-1">소셜 로그인 계정은 이메일을 변경할 수 없습니다</p>}
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">이름</label>
              <Input value={nickname} onChange={(e) => setNickname(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">휴대폰</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" className="h-11 rounded-xl" />
            </div>
            <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full h-11 rounded-xl gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              저장
            </Button>
          </div>
        </div>

        {/* Password */}
        {!isSocial && (
          <div className="bg-white rounded-2xl p-5 mb-3">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Lock className="h-4 w-4" />
              비밀번호 변경
            </h2>
            <div className="space-y-3">
              <Input type="password" placeholder="현재 비밀번호" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="h-11 rounded-xl" />
              <Input type="password" placeholder="새 비밀번호 (8자 이상)" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="h-11 rounded-xl" />
              <Input type="password" placeholder="새 비밀번호 확인" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="h-11 rounded-xl" />
              <Button onClick={handleChangePassword} disabled={isPwSaving} variant="outline" className="w-full h-11 rounded-xl">
                {isPwSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : '비밀번호 변경'}
              </Button>
            </div>
          </div>
        )}

        <Link
          href={`/${locale}/${username}/me/withdraw`}
          className="block text-center text-xs text-gray-400 mt-4 hover:text-red-400"
        >
          회원 탈퇴
        </Link>
      </div>
    </div>
  );
}

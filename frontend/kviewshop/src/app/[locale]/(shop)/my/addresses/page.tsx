'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/use-user';
import { getAddresses, createAddress, deleteAddress, setDefaultAddress } from '@/lib/actions/address';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  ChevronLeft, MapPin, Plus, Loader2, Trash2, Star, X,
} from 'lucide-react';

export default function AddressesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const { buyer } = useUser();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: '', recipient: '', phone: '', zipcode: '', address: '', detail: '', isDefault: false });
  const [isSaving, setIsSaving] = useState(false);

  const loadAddresses = () => {
    getAddresses()
      .then(setAddresses)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (!buyer?.id) return;
    loadAddresses();
  }, [buyer?.id]);

  const handleCreate = async () => {
    if (!form.recipient || !form.phone || !form.address || !form.detail) {
      toast.error('필수 항목을 입력해주세요');
      return;
    }
    setIsSaving(true);
    try {
      await createAddress(form);
      toast.success('배송지가 등록되었습니다');
      setShowForm(false);
      setForm({ label: '', recipient: '', phone: '', zipcode: '', address: '', detail: '', isDefault: false });
      loadAddresses();
    } catch (error: any) {
      toast.error(error.message || '등록에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAddress(id);
      toast.success('배송지가 삭제되었습니다');
      loadAddresses();
    } catch (error: any) {
      toast.error(error.message || '삭제에 실패했습니다');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
      toast.success('기본 배송지로 설정했습니다');
      loadAddresses();
    } catch (error: any) {
      toast.error(error.message || '설정에 실패했습니다');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-lg mx-auto px-4 pt-4">
        <Link
          href={`/${locale}/my`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-0.5" />
          마이페이지
        </Link>

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            배송지 관리
          </h1>
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            disabled={addresses.length >= 20}
            className="gap-1 rounded-xl"
          >
            <Plus className="h-4 w-4" />
            추가
          </Button>
        </div>

        {addresses.length >= 20 && (
          <p className="text-xs text-amber-600 mb-3">배송지는 최대 20개까지 등록할 수 있습니다</p>
        )}

        {/* List */}
        <div className="space-y-2">
          {addresses.map((addr: any) => (
            <div key={addr.id} className="bg-white rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {addr.label && <span className="text-xs font-medium text-gray-500">{addr.label}</span>}
                    {addr.isDefault && (
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">기본</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900">{addr.recipient}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{addr.address} {addr.detail}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{addr.phone}</p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  {!addr.isDefault && (
                    <button onClick={() => handleSetDefault(addr.id)} className="p-2 text-gray-400 hover:text-amber-500" title="기본 설정">
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(addr.id)} className="p-2 text-gray-400 hover:text-red-500" title="삭제">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {addresses.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center">
            <MapPin className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">등록된 배송지가 없습니다</p>
          </div>
        )}

        {/* Add form modal */}
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50">
            <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">새 배송지 추가</h3>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-3">
                <Input placeholder="라벨 (예: 집, 회사)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="h-11 rounded-xl" />
                <Input placeholder="받는분 *" value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} className="h-11 rounded-xl" />
                <Input placeholder="연락처 *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11 rounded-xl" />
                <Input placeholder="우편번호" value={form.zipcode} onChange={(e) => setForm({ ...form, zipcode: e.target.value })} className="h-11 rounded-xl" />
                <Input placeholder="주소 *" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="h-11 rounded-xl" />
                <Input placeholder="상세 주소 *" value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} className="h-11 rounded-xl" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
                  기본 배송지로 설정
                </label>
              </div>
              <Button onClick={handleCreate} disabled={isSaving} className="w-full h-12 mt-4 rounded-xl bg-gray-900 text-white font-semibold">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : '등록'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

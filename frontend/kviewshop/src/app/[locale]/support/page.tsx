import Link from 'next/link';
import { ChevronLeft, Phone, Mail, Clock } from 'lucide-react';
import { Footer } from '@/components/layout/footer';

interface SupportPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata() {
  return {
    title: '1:1 문의 | CNEC Shop',
    description: '궁금한 점이나 불편한 점을 알려주세요.',
  };
}

export default async function SupportPage({ params }: SupportPageProps) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-8 transition"
        >
          <ChevronLeft className="h-4 w-4" />
          홈으로
        </Link>

        <header className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900">1:1 문의</h1>
          <p className="text-sm text-gray-500 mt-3">
            궁금한 점이나 불편한 점을 알려주세요. 최대한 빠르게 답변드릴게요.
          </p>
        </header>

        <div className="space-y-4">
          <a
            href="tel:01068863302"
            className="block bg-white border border-gray-100 rounded-2xl p-6 hover:border-gray-200 hover:shadow-md transition"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">전화 상담</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">010-6886-3302</p>
                <p className="text-sm text-gray-500 mt-2">평일 10:00 - 18:00 (점심시간 12:00-13:00 제외)</p>
              </div>
            </div>
          </a>

          <a
            href="mailto:support@cnecshop.com"
            className="block bg-white border border-gray-100 rounded-2xl p-6 hover:border-gray-200 hover:shadow-md transition"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">이메일 문의</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">support@cnecshop.com</p>
                <p className="text-sm text-gray-500 mt-2">24시간 접수 가능, 1영업일 내 답변드려요</p>
              </div>
            </div>
          </a>
        </div>

        <div className="mt-12 bg-gray-50 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900">상담 운영 안내</p>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                주말과 공휴일에는 상담이 어려워요. 긴급한 문의는 이메일로 남겨주시면
                다음 영업일에 빠��게 확인해드릴게요.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

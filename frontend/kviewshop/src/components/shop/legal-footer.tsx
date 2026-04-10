'use client';

import Link from 'next/link';
import { Mail, Clock, Building2, Shield } from 'lucide-react';

interface LegalFooterProps {
  locale: string;
  shopName?: string;
  variant?: 'full' | 'minimal';
}

export function LegalFooter({ locale, shopName, variant = 'full' }: LegalFooterProps) {
  if (variant === 'minimal') {
    return (
      <footer className="mt-12 bg-gray-900 py-6 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
            <Link href={`/${locale}/terms`} className="hover:text-white transition-colors">
              이용약관
            </Link>
            <span className="text-gray-600">|</span>
            <Link href={`/${locale}/privacy`} className="hover:text-white transition-colors font-semibold">
              개인정보처리방침
            </Link>
            <span className="text-gray-600">|</span>
            <Link href={`/${locale}/terms`} className="hover:text-white transition-colors">
              전자금융거래 이용약관
            </Link>
          </div>
          <p className="text-center text-xs text-gray-500 mt-4">
            {shopName ? `${shopName} powered by ` : ''}
            <span className="font-semibold text-gray-400">CNEC Shop</span>
            {' '}| &copy; 2026 HOWPAPA Inc. All rights reserved.
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-12 bg-gray-900 border-t border-gray-800">
      <div className="container mx-auto px-4 py-10">
        {/* 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Column 1: 고객지원 */}
          <div>
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-gray-400" />
              고객지원
            </h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <Mail className="h-3 w-3 shrink-0" />
                contact@cnec.kr
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-3 w-3 shrink-0" />
                평일 10:00-18:00 (주말/공휴일 휴무)
              </li>
            </ul>
          </div>

          {/* Column 2: 법적고지 */}
          <div>
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-gray-400" />
              법적고지
            </h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href={`/${locale}/terms`} className="hover:text-white transition-colors">
                  이용약관
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/privacy`} className="hover:text-white transition-colors font-semibold">
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/terms`} className="hover:text-white transition-colors">
                  전자금융거래 이용약관
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: 회사정보 */}
          <div>
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-gray-400" />
              회사정보
            </h4>
            <dl className="space-y-1 text-sm text-gray-400">
              <div className="flex gap-1">
                <dt className="text-gray-500 shrink-0">상호:</dt>
                <dd>주식회사 하우파파</dd>
              </div>
              <div className="flex gap-1">
                <dt className="text-gray-500 shrink-0">대표:</dt>
                <dd>박현용</dd>
              </div>
              <div className="flex gap-1">
                <dt className="text-gray-500 shrink-0">이메일:</dt>
                <dd>contact@cnec.kr</dd>
              </div>
              <div className="flex gap-1">
                <dt className="text-gray-500 shrink-0">사업자등록번호:</dt>
                <dd>확인 중</dd>
              </div>
              <div className="flex gap-1">
                <dt className="text-gray-500 shrink-0">통신판매업신고:</dt>
                <dd>확인 중</dd>
              </div>
              <div className="flex gap-1">
                <dt className="text-gray-500 shrink-0">주소:</dt>
                <dd>서울특별시</dd>
              </div>
              <div className="flex gap-1">
                <dt className="text-gray-500 shrink-0">호스팅서비스:</dt>
                <dd>Vercel Inc.</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-gray-500">
            {shopName ? `${shopName} powered by ` : ''}
            <span className="font-semibold text-gray-400">CNEC Shop</span>
          </p>
          <p className="text-xs text-gray-500">
            &copy; 2026 HOWPAPA Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

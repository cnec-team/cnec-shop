'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Building2, Shield, RefreshCw, Truck, Mail, Phone } from 'lucide-react';

interface LegalFooterProps {
  locale: string;
  shopName?: string;
  creatorCountry?: string;
  variant?: 'full' | 'minimal';
}

interface LegalContent {
  content_type: string;
  title: string;
  content: string;
}

// Static fallback content for each country
const staticLegalContent = {
  KR: {
    business_info: {
      title: '사업자정보',
      content: `상호: (주)케이뷰샵 | 대표: 홍길동 | 사업자등록번호: 123-45-67890
통신판매업신고: 제2024-서울강남-0000호
주소: 서울특별시 강남구 테헤란로 123, 4층
고객센터: 1588-0000 | 이메일: support@cnec.shop`,
    },
    terms: { title: '이용약관', href: '/terms' },
    privacy: { title: '개인정보처리방침', href: '/privacy' },
    refund: { title: '환불정책', content: '상품 수령 후 7일 이내 환불 가능 (단, 개봉/사용 시 환불 불가)' },
  },
  US: {
    business_info: {
      title: 'Business Information',
      content: `Company: CNEC Shop Inc.
Address: 123 Commerce Street, Suite 400, Los Angeles, CA 90001
Customer Service: 1-800-XXX-XXXX | Email: support@cnec.shop`,
    },
    terms: { title: 'Terms of Service', href: '/terms' },
    privacy: { title: 'Privacy Policy', href: '/privacy' },
    refund: { title: 'Refund Policy', content: 'Full refund within 30 days of purchase. Items must be unopened and in original packaging.' },
  },
  JP: {
    business_info: {
      title: '特定商取引法に基づく表記',
      content: `販売業者: CNEC Shop Japan株式会社
代表者: 山田太郎 | 所在地: 〒150-0001 東京都渋谷区神宮前1-2-3
電話番号: 03-XXXX-XXXX | メール: support@cnec.shop
販売価格: 各商品ページに記載 | 送料: 全国一律550円（税込）`,
    },
    terms: { title: '利用規約', href: '/terms' },
    privacy: { title: 'プライバシーポリシー', href: '/privacy' },
    refund: { title: '返品・返金ポリシー', content: '商品到着後7日以内の返品可能（未開封・未使用品に限る）' },
  },
};

export function LegalFooter({ locale, shopName, creatorCountry, variant = 'full' }: LegalFooterProps) {
  const [expanded, setExpanded] = useState(false);

  // Determine country based on locale or creator setting
  const getCountry = () => {
    if (creatorCountry) return creatorCountry;
    if (locale === 'ja') return 'JP';
    if (locale === 'ko') return 'KR';
    return 'US';
  };

  const country = getCountry();
  const staticContent = staticLegalContent[country as keyof typeof staticLegalContent] || staticLegalContent.US;

  // Use static content as fallback
  const getContent = (_type: string) => {
    return undefined; // falls back to static content below
  };

  if (variant === 'minimal') {
    return (
      <footer className="mt-12 py-6 border-t border-border/30" style={{ backgroundColor: '#1a1a2e' }}>
        <div className="container px-4">
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <Link href={`/${locale}${staticContent.terms.href}`} className="hover:text-foreground transition-colors">
              {staticContent.terms.title}
            </Link>
            <span className="text-border">|</span>
            <Link href={`/${locale}${staticContent.privacy.href}`} className="hover:text-foreground transition-colors">
              {staticContent.privacy.title}
            </Link>
            <span className="text-border">|</span>
            <span>{staticContent.refund.title}</span>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            {shopName ? `${shopName} powered by ` : ''}
            <span className="font-medium">CNEC Shop</span> | All rights reserved
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-12 border-t border-border/30" style={{ backgroundColor: '#1a1a2e' }}>
      <div className="container px-4 py-8">
        {/* Main Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              {locale === 'ko' ? '정책' : locale === 'ja' ? 'ポリシー' : 'Policies'}
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href={`/${locale}/terms`} className="hover:text-foreground transition-colors">
                  {staticContent.terms.title}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/privacy`} className="hover:text-foreground transition-colors">
                  {staticContent.privacy.title}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-primary" />
              {staticContent.refund.title}
            </h4>
            <p className="text-sm text-muted-foreground">
              {getContent('refund_policy') || staticContent.refund.content}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              {locale === 'ko' ? '배송안내' : locale === 'ja' ? '配送について' : 'Shipping'}
            </h4>
            <p className="text-sm text-muted-foreground">
              {locale === 'ko'
                ? '주문 후 2-3일 내 발송\n해외배송 7-14일 소요'
                : locale === 'ja'
                ? '注文後2-3日以内に発送\n海外配送7-14日'
                : 'Ships within 2-3 business days\nInternational: 7-14 days'}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              {locale === 'ko' ? '고객센터' : locale === 'ja' ? 'お問い合わせ' : 'Contact'}
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                support@cnec.shop
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                {country === 'KR' ? '1588-0000' : country === 'JP' ? '03-XXXX-XXXX' : '1-800-XXX-XXXX'}
              </li>
            </ul>
          </div>
        </div>

        {/* Business Info (Expandable) */}
        <div className="border-t border-border/30 pt-6">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Building2 className="h-4 w-4" />
            {staticContent.business_info.title}
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {expanded && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground whitespace-pre-line">
              {getContent('business_info') || staticContent.business_info.content}
            </div>
          )}
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t border-border/30 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            {shopName ? `${shopName} powered by ` : ''}
            <span className="font-headline font-bold text-gold-gradient">CNEC Shop</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date().getFullYear()} All rights reserved.
          </p>
        </div>

        {/* Legal Compliance Notice */}
        {country === 'KR' && (
          <p className="mt-4 text-xs text-center text-muted-foreground">
            본 쇼핑몰은 공정거래위원회에서 인증한 표준약관을 사용합니다.
          </p>
        )}
        {country === 'JP' && (
          <p className="mt-4 text-xs text-center text-muted-foreground">
            特定商取引法に基づく表記を遵守しています。
          </p>
        )}
        {country === 'US' && (
          <p className="mt-4 text-xs text-center text-muted-foreground">
            We comply with all applicable consumer protection laws including the FTC Act.
          </p>
        )}
      </div>
    </footer>
  );
}

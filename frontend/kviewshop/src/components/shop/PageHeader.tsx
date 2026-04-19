'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backLink?: string;
  rightAction?: ReactNode;
}

export function PageHeader({ title, subtitle, backLink, rightAction }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {backLink && (
          <Link href={backLink} className="text-gray-500 hover:text-gray-900 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
        )}
        <div>
          <h1 className="text-base font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {rightAction}
    </header>
  );
}

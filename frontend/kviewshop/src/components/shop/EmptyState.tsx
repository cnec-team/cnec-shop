'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
      <Icon className="h-12 w-12 mx-auto mb-4 text-gray-200" />
      <p className="font-semibold text-gray-700 mb-1">{title}</p>
      <p className="text-sm text-gray-400 mb-5">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button size="sm" variant="outline" className="rounded-full">
            {actionLabel}
          </Button>
        </Link>
      )}
    </div>
  );
}

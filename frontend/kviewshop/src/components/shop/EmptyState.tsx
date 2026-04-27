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
      <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
        <Icon className="h-7 w-7 text-muted-foreground/40" />
      </div>
      <p className="font-bold mb-1">{title}</p>
      <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto leading-relaxed">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button size="sm" className="rounded-xl px-5 h-10 font-bold">
            {actionLabel}
          </Button>
        </Link>
      )}
    </div>
  );
}

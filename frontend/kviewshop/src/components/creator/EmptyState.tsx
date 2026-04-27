'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Package,
  type LucideIcon,
} from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon = Package,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <h3 className="text-base font-bold text-center">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground text-center mt-1.5 max-w-xs leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && (actionHref || onAction) && (
        <div className="mt-5">
          {actionHref ? (
            <Button asChild className="rounded-xl px-6 h-11 font-bold">
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : (
            <Button onClick={onAction} className="rounded-xl px-6 h-11 font-bold">{actionLabel}</Button>
          )}
        </div>
      )}
    </div>
  );
}

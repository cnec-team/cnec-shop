'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownBadgeProps {
  endAt: string | Date;
  /** 'badge' for small card badges, 'banner' for large product detail display */
  variant?: 'badge' | 'banner';
  className?: string;
}

export function CountdownBadge({ endAt, variant = 'badge', className = '' }: CountdownBadgeProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    function update() {
      const now = Date.now();
      const end = new Date(endAt).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft('마감');
        return;
      }

      const hours24 = 24 * 60 * 60 * 1000;
      setIsUrgent(diff < hours24);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const pad = (n: number) => n.toString().padStart(2, '0');

      if (days > 0) {
        setTimeLeft(`D-${days} ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      } else {
        setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      }
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endAt]);

  if (variant === 'banner') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Clock className={`h-4 w-4 ${isExpired ? 'text-gray-400' : isUrgent ? 'text-red-500' : 'text-orange-500'}`} />
        <span className={`text-sm font-bold font-mono tabular-nums ${
          isExpired ? 'text-gray-400' : isUrgent ? 'text-red-600 animate-pulse' : 'text-orange-600'
        }`}>
          {timeLeft}
        </span>
      </div>
    );
  }

  // Badge variant (small, for cards)
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
      isExpired
        ? 'bg-gray-100 text-gray-400'
        : isUrgent
          ? 'bg-red-50 text-red-600 animate-pulse'
          : 'bg-orange-50 text-orange-600'
    } ${className}`}>
      <Clock className="h-2.5 w-2.5" />
      {timeLeft}
    </span>
  );
}

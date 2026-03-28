'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  fallbackClassName?: string;
  sizes?: string;
  priority?: boolean;
}

export function SafeImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  fallbackClassName,
  sizes,
  priority,
}: SafeImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!src || error) {
    return (
      <div className={cn('flex items-center justify-center bg-gray-50', fallbackClassName || className)}>
        <Package className="h-8 w-8 text-gray-200" />
      </div>
    );
  }

  return (
    <>
      {loading && (
        <div className={cn('absolute inset-0 animate-pulse bg-gray-100 rounded', fill ? '' : 'hidden')} />
      )}
      {fill ? (
        <Image
          src={src}
          alt={alt}
          fill
          className={cn('object-cover', loading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300', className)}
          sizes={sizes || '(max-width: 768px) 100vw, 50vw'}
          priority={priority}
          onLoad={() => setLoading(false)}
          onError={() => setError(true)}
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          width={width || 200}
          height={height || 200}
          className={cn('object-cover', loading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300', className)}
          sizes={sizes}
          priority={priority}
          onLoad={() => setLoading(false)}
          onError={() => setError(true)}
        />
      )}
    </>
  );
}

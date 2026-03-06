'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Lightbulb } from 'lucide-react';
import { GUIDE_CATEGORY_LABELS } from '@/types/database';
import type { Guide, GuideCategory, GuideSection } from '@/types/database';

function RenderSection({ section }: { section: GuideSection }) {
  switch (section.type) {
    case 'heading':
      return <h2 className="text-xl font-bold mt-6 mb-3">{section.text}</h2>;
    case 'paragraph':
      return <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line mb-4">{section.text}</p>;
    case 'tip':
      return (
        <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <Lightbulb className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">{section.text}</p>
        </div>
      );
    case 'image':
      return section.url ? (
        <img src={section.url} alt={section.alt || ''} className="rounded-lg w-full mb-4" />
      ) : null;
    default:
      return null;
  }
}

export default function BrandGuideDetailPage() {
  const params = useParams();
  const locale = params.locale as string;
  const id = params.id as string;

  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGuide() {
      try {
        const res = await fetch('/api/guides');
        const data = await res.json();
        if (res.ok) {
          const found = (data.guides as Guide[]).find(g => g.id === id);
          setGuide(found ?? null);
        }
      } catch (error) {
        console.error('Failed to fetch guide:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchGuide();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">가이드를 찾을 수 없습니다</p>
        <Link href={`/${locale}/brand/guides`}>
          <Button variant="outline" size="sm" className="mt-4">도움말 목록으로</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/${locale}/brand/guides`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" />
        도움말 목록
      </Link>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {GUIDE_CATEGORY_LABELS[guide.category as GuideCategory]}
            </span>
          </div>
          <h1 className="text-2xl font-bold mb-6">{guide.title}</h1>
          <div>
            {guide.content?.sections?.map((section, i) => (
              <RenderSection key={i} section={section} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

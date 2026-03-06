'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, ChevronRight } from 'lucide-react';
import { GUIDE_CATEGORY_LABELS } from '@/types/database';
import type { Guide, GuideCategory } from '@/types/database';

const BRAND_CATEGORIES: GuideCategory[] = ['BRAND_START', 'BRAND_OPTIMIZE'];

export default function BrandGuidesPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<GuideCategory | 'ALL'>('ALL');

  useEffect(() => {
    async function fetchGuides() {
      try {
        const res = await fetch('/api/guides');
        const data = await res.json();
        if (res.ok) {
          setGuides((data.guides as Guide[]).filter(g =>
            BRAND_CATEGORIES.includes(g.category as GuideCategory)
          ));
        }
      } catch (error) {
        console.error('Failed to fetch guides:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchGuides();
  }, []);

  const filtered = activeCategory === 'ALL'
    ? guides
    : guides.filter(g => g.category === activeCategory);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">도움말</h1>
        <p className="text-sm text-muted-foreground">브랜드 운영에 도움이 되는 가이드입니다</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveCategory('ALL')}
          className={`px-4 py-2 text-sm rounded-full transition-colors ${
            activeCategory === 'ALL' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          전체
        </button>
        {BRAND_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 text-sm rounded-full transition-colors ${
              activeCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {GUIDE_CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">가이드가 없습니다</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((guide) => (
            <Link key={guide.id} href={`/${locale}/brand/guides/${guide.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {GUIDE_CATEGORY_LABELS[guide.category as GuideCategory]}
                      </span>
                    </div>
                    <h3 className="font-semibold text-base">{guide.title}</h3>
                    {guide.content?.sections?.[0]?.type === 'paragraph' && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {guide.content.sections.find(s => s.type === 'paragraph')?.text}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center text-primary text-sm mt-4">
                    자세히 보기 <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

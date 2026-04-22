'use client';

import { useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ImagePlus, X, Loader2, GripVertical, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { SectionCard } from './SectionCard';
import { cn } from '@/lib/utils';

const MAX_IMAGES = 6;
const MAX_SIZE_MB = 5;
const ACCEPT = 'image/jpeg,image/png,image/webp';

interface ImagesSectionProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ImagesSection({ images, onChange }: ImagesSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [dragHover, setDragHover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.indexOf(active.id as string);
      const newIndex = images.indexOf(over.id as string);
      onChange(arrayMove(images, oldIndex, newIndex));
    }
  }

  async function uploadFile(file: File) {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`파일 크기는 ${MAX_SIZE_MB}MB 이하여야 해요`);
      return;
    }
    if (!ACCEPT.split(',').includes(file.type)) {
      toast.error('JPG, PNG, WebP 형식만 지원해요');
      return;
    }
    if (images.length >= MAX_IMAGES) {
      toast.error(`사진은 최대 ${MAX_IMAGES}장까지 올릴 수 있어요`);
      return;
    }

    // Validate dimensions for warning only
    const img = new window.Image();
    img.onload = () => {
      if (img.width < 800 || img.height < 800) {
        toast.warning('더 선명한 사진을 올리면 구매 전환율이 높아져요');
      }
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'products');
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || '업로드 실패');
      }
      const data = await res.json();
      onChange([...images, data.url]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '업로드에 실패했어요');
    } finally {
      setUploading(false);
    }
  }

  async function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    for (const f of arr) {
      await uploadFile(f);
    }
  }

  function removeImage(url: string) {
    onChange(images.filter((u) => u !== url));
  }

  return (
    <SectionCard
      title="상품 사진"
      subtitle={`첫 번째 사진이 대표 이미지(목록 썸네일 + 상세 메인)가 돼요 (최대 ${MAX_IMAGES}장)`}
    >
      <div
        className={cn(
          'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6',
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragHover(true);
        }}
        onDragLeave={() => setDragHover(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragHover(false);
          if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        }}
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images} strategy={rectSortingStrategy}>
            {images.map((url, idx) => (
              <SortableImage key={url} id={url} url={url} isMain={idx === 0} onRemove={removeImage} />
            ))}
          </SortableContext>
        </DndContext>

        {images.length < MAX_IMAGES ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              'flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed text-gray-400 transition-colors',
              dragHover
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/30',
              uploading && 'opacity-50',
            )}
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs font-medium">+ 추가</span>
              </>
            )}
          </button>
        ) : null}

        {Array.from({
          length: Math.max(0, MAX_IMAGES - images.length - 1),
        }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="hidden aspect-square rounded-2xl border-2 border-dashed border-gray-100 sm:flex sm:items-center sm:justify-center"
          >
            <ImageIcon className="h-5 w-5 text-gray-200" />
          </div>
        ))}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            if (inputRef.current) inputRef.current.value = '';
          }}
          className="hidden"
        />
      </div>

      <p className="text-xs text-gray-400">
        사진을 끌어서 순서를 바꿀 수 있어요. 첫 사진이 상세페이지 대표 이미지로 보여요.
      </p>
    </SectionCard>
  );
}

function SortableImage({
  id,
  url,
  isMain,
  onRemove,
}: {
  id: string;
  url: string;
  isMain: boolean;
  onRemove: (url: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative aspect-square overflow-hidden rounded-2xl border border-gray-100 bg-gray-50"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="h-full w-full object-cover" />
      {isMain ? (
        <span className="absolute left-2 top-2 rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white">
          대표
        </span>
      ) : null}
      <button
        type="button"
        onClick={() => onRemove(url)}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
        aria-label="삭제"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute bottom-2 right-2 flex h-7 w-7 cursor-grab items-center justify-center rounded-full bg-white/90 text-gray-700 opacity-0 transition-opacity active:cursor-grabbing group-hover:opacity-100"
        aria-label="순서 변경"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

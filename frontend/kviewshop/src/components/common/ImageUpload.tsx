'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  aspectRatio?: 'square' | 'cover' | 'banner';
  maxSizeMB?: number;
  accept?: string;
  folder?: string;
}

const ASPECT_CLASSES: Record<string, string> = {
  square: 'aspect-square',
  cover: 'aspect-[16/9]',
  banner: 'aspect-[3/1]',
};

export default function ImageUpload({
  value,
  onChange,
  placeholder = '이미지를 업로드하세요',
  aspectRatio = 'square',
  maxSizeMB = 5,
  accept = 'image/jpeg,image/png,image/webp',
  folder = 'uploads',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`);
        return;
      }

      const acceptTypes = accept.split(',').map((t) => t.trim());
      if (!acceptTypes.includes(file.type)) {
        toast.error('지원하지 않는 파일 형식입니다.');
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || '업로드 실패');
        }

        const data = await res.json();
        onChange(data.url);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '업로드에 실패했습니다.');
      } finally {
        setUploading(false);
      }
    },
    [accept, folder, maxSizeMB, onChange],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div
      className={`relative rounded-lg border-2 border-dashed transition-colors overflow-hidden cursor-pointer ${ASPECT_CLASSES[aspectRatio]} ${
        dragOver
          ? 'border-primary bg-primary/5'
          : value
            ? 'border-transparent'
            : 'border-muted-foreground/25 hover:border-primary/50'
      }`}
      onClick={() => !uploading && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {value ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="uploaded"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {!uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Upload className="h-8 w-8" />
          <span className="text-sm text-center px-4">{placeholder}</span>
        </div>
      )}

      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}

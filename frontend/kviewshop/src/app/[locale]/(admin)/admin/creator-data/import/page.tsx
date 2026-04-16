'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileUp, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreatorDataImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/ko/admin/creator-data" className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-3xl font-headline font-bold">데이터 임포트</h1>
          <p className="text-muted-foreground">크리에이터 데이터를 일괄 업로드합니다</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>파일 업로드</CardTitle>
          <CardDescription>CSV 또는 Excel 파일을 업로드하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
            <FileUp className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              파일을 드래그하거나 클릭하여 업로드
            </p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="mt-4"
            />
            {file && (
              <p className="mt-2 text-sm font-medium">{file.name}</p>
            )}
          </div>
          <Button disabled={!file || uploading} className="w-full">
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? '업로드 중...' : '임포트 시작'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

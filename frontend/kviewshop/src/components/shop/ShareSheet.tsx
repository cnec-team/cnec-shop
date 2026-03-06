'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Share2, Copy, MessageCircle, FileText } from 'lucide-react';
import { buildShareUrl } from '@/lib/share';
import { sendKakaoShare } from '@/lib/kakao';

interface ShareSheetProps {
  url: string;
  title: string;
  description: string;
  imageUrl?: string;
  trigger?: React.ReactNode;
}

export function ShareSheet({ url, title, description, imageUrl, trigger }: ShareSheetProps) {
  const [open, setOpen] = useState(false);

  const handleCopyLink = async () => {
    const shareUrl = buildShareUrl(url, 'copy');
    await navigator.clipboard.writeText(shareUrl);
    toast.success('링크가 복사되었습니다!');
    setOpen(false);
  };

  const handleKakaoShare = () => {
    const shareUrl = buildShareUrl(url, 'kakao');
    const sent = sendKakaoShare({ title, description, imageUrl, linkUrl: shareUrl });
    if (!sent) {
      // Fallback: copy link
      navigator.clipboard.writeText(shareUrl);
      toast.success('카카오톡 SDK가 로드되지 않아 링크가 복사되었습니다');
    }
    setOpen(false);
  };

  const handleCopyCaption = async () => {
    const shareUrl = buildShareUrl(url, 'instagram');
    const caption = `${title}\n${description}\n\n${shareUrl}`;
    await navigator.clipboard.writeText(caption);
    toast.success('캡션이 복사되었습니다!');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="icon" className="shrink-0">
            <Share2 className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>공유</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <Button
            variant="outline"
            className="h-12 justify-start gap-3"
            onClick={handleCopyLink}
          >
            <Copy className="h-5 w-5 text-gray-500" />
            링크 복사
          </Button>
          <Button
            variant="outline"
            className="h-12 justify-start gap-3"
            onClick={handleKakaoShare}
          >
            <MessageCircle className="h-5 w-5 text-yellow-500" />
            카카오톡 공유
          </Button>
          <Button
            variant="outline"
            className="h-12 justify-start gap-3"
            onClick={handleCopyCaption}
          >
            <FileText className="h-5 w-5 text-pink-500" />
            캡션 + 링크 복사
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">문제가 발생했습니다</h2>
      <p className="text-sm text-gray-500 text-center max-w-sm mb-6">
        {error.message || "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요."}
      </p>
      <div className="flex gap-3">
        <Button onClick={reset} className="rounded-xl">
          다시 시도
        </Button>
        <Button variant="outline" className="rounded-xl" asChild>
          <a href="/brand/login">로그인으로</a>
        </Button>
      </div>
    </div>
  );
}

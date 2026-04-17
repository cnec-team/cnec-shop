'use client'

interface AlimtalkPreviewProps {
  brandName: string
  title: string
  body: string
}

export function AlimtalkPreview({ brandName, title, body }: AlimtalkPreviewProps) {
  return (
    <div className="max-w-[280px] mx-auto">
      {/* Kakao chat header */}
      <div className="bg-[#FEE500] rounded-t-lg px-3 py-2 flex items-center gap-2">
        <div className="h-5 w-5 bg-[#3C1E1E] rounded-full flex items-center justify-center">
          <span className="text-[8px] text-white font-bold">K</span>
        </div>
        <span className="text-xs font-semibold text-[#3C1E1E]">카카오톡</span>
      </div>
      {/* Message bubble */}
      <div className="bg-gray-100 p-3 rounded-b-lg">
        <div className="bg-white rounded-lg p-3 shadow-sm space-y-2">
          <p className="text-[10px] text-muted-foreground">[{brandName}] 알림톡</p>
          <p className="text-sm font-semibold">{title || '제목 없음'}</p>
          <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
            {body || '내용 없음'}
          </p>
          <div className="border-t pt-2 mt-2">
            <div className="text-center text-xs text-blue-600 font-medium py-1.5 bg-gray-50 rounded">
              자세히 보기
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

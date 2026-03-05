import { formatCurrency } from '@/lib/i18n/config';

interface Settlement {
  id: string;
  recipient_name: string;
  recipient_type: 'creator' | 'brand';
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  period_start: string;
  period_end: string;
  created_at: string;
  paid_at?: string;
}

// Excel 내보내기 (CSV 형식)
export function exportToExcel(settlements: Settlement[], filename: string = 'settlements') {
  const headers = [
    '정산 ID',
    '수령인',
    '유형',
    '금액',
    '통화',
    '상태',
    '정산 기간 시작',
    '정산 기간 종료',
    '생성일',
    '지급일',
  ];

  const rows = settlements.map((s) => [
    s.id,
    s.recipient_name,
    s.recipient_type === 'creator' ? '크리에이터' : '브랜드',
    s.amount.toString(),
    s.currency,
    getStatusLabel(s.status),
    formatDate(s.period_start),
    formatDate(s.period_end),
    formatDate(s.created_at),
    s.paid_at ? formatDate(s.paid_at) : '-',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  // BOM 추가 (엑셀에서 한글 깨짐 방지)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  downloadBlob(blob, `${filename}_${formatDateForFile(new Date())}.csv`);
}

// PDF 인보이스 생성
export function exportToPDF(settlement: Settlement) {
  // 간단한 HTML 기반 PDF 생성 (브라우저 인쇄 기능 활용)
  const invoiceHtml = generateInvoiceHTML(settlement);

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
    printWindow.focus();

    // 약간의 딜레이 후 인쇄 다이얼로그 표시
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}

// 인보이스 HTML 생성
function generateInvoiceHTML(settlement: Settlement): string {
  const statusLabel = getStatusLabel(settlement.status);
  const statusColor = getStatusColor(settlement.status);

  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>Invoice - ${settlement.id}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Noto Sans KR', -apple-system, sans-serif;
          padding: 40px;
          color: #1a1a1a;
          background: white;
        }
        .invoice {
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #d4af37;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #d4af37;
        }
        .logo-sub {
          font-size: 12px;
          color: #666;
          margin-top: 4px;
        }
        .invoice-info {
          text-align: right;
        }
        .invoice-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .invoice-number {
          color: #666;
          font-size: 14px;
        }
        .status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          margin-top: 8px;
          background: ${statusColor.bg};
          color: ${statusColor.text};
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: #666;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .info-item label {
          display: block;
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }
        .info-item p {
          font-size: 16px;
          font-weight: 500;
        }
        .amount-section {
          background: #f8f8f8;
          padding: 30px;
          border-radius: 8px;
          text-align: center;
        }
        .amount-label {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }
        .amount {
          font-size: 36px;
          font-weight: bold;
          color: #d4af37;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        @media print {
          body {
            padding: 20px;
          }
          .invoice {
            max-width: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice">
        <div class="header">
          <div>
            <div class="logo">CNEC Shop</div>
            <div class="logo-sub">Data-Driven Global Beauty Incubator</div>
          </div>
          <div class="invoice-info">
            <div class="invoice-title">정산 내역서</div>
            <div class="invoice-number">No. ${settlement.id}</div>
            <div class="status">${statusLabel}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">수령인 정보</div>
          <div class="info-grid">
            <div class="info-item">
              <label>이름</label>
              <p>${settlement.recipient_name}</p>
            </div>
            <div class="info-item">
              <label>유형</label>
              <p>${settlement.recipient_type === 'creator' ? '크리에이터' : '브랜드'}</p>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">정산 기간</div>
          <div class="info-grid">
            <div class="info-item">
              <label>시작일</label>
              <p>${formatDate(settlement.period_start)}</p>
            </div>
            <div class="info-item">
              <label>종료일</label>
              <p>${formatDate(settlement.period_end)}</p>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="amount-section">
            <div class="amount-label">정산 금액</div>
            <div class="amount">${formatCurrency(settlement.amount, settlement.currency as 'USD' | 'JPY' | 'KRW')}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">정산 정보</div>
          <div class="info-grid">
            <div class="info-item">
              <label>생성일</label>
              <p>${formatDate(settlement.created_at)}</p>
            </div>
            <div class="info-item">
              <label>지급일</label>
              <p>${settlement.paid_at ? formatDate(settlement.paid_at) : '-'}</p>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>해외 크리에이터 정산 시 원천징수세가 적용되지 않습니다.</p>
          <p>본 문서는 정산 확인용으로 세금계산서를 대체하지 않습니다.</p>
          <p style="margin-top: 10px;">CNEC Shop &copy; ${new Date().getFullYear()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// 헬퍼 함수들
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: '대기중',
    processing: '처리중',
    completed: '완료',
    failed: '실패',
  };
  return labels[status] || status;
}

function getStatusColor(status: string): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    pending: { bg: '#fef3c7', text: '#92400e' },
    processing: { bg: '#dbeafe', text: '#1e40af' },
    completed: { bg: '#d1fae5', text: '#065f46' },
    failed: { bg: '#fee2e2', text: '#991b1b' },
  };
  return colors[status] || { bg: '#f3f4f6', text: '#374151' };
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateForFile(date: Date): string {
  return date.toISOString().split('T')[0].replace(/-/g, '');
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

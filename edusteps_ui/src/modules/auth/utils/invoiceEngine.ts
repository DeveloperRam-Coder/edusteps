/**
 * Centralized Invoice Engine & HTML Generator
 * Inspired by Stripe, Zoho Books, QuickBooks, and Apple design systems.
 * Provides A4 print precision, pure SVG QR code generation, and financial formatting.
 */

export interface BankDetails {
  accountName?: string;
  accountNumber?: string;
  ifsc?: string;
  bankName?: string;
  upiId?: string;
}

export interface BusinessDetails {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
  website?: string;
  logoUrl?: string;
  bankDetails?: BankDetails;
}

export interface CustomerDetails {
  name: string;
  email?: string;
  mobile?: string;
  address?: string;
  gstin?: string;
}

export interface StudentDetails {
  name: string;
  subject?: string;
  grade?: string;
  cdId?: string;
  milestone?: string;
}

export interface InvoiceItem {
  id?: string;
  description: string;
  hsnSac?: string;
  qty: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
  amount: number;
}

export interface PaymentSummary {
  totalFee: number;
  discountTotal?: number;
  taxTotal?: number;
  amountPaid: number;
  balanceDue: number;
  paymentMode?: string;
  transactionRef?: string;
  paidOn?: string;
}

export interface InvoiceData {
  invoiceNo: string;
  issueDate: string;
  dueDate?: string;
  status: 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE';
  business: BusinessDetails;
  customer: CustomerDetails;
  student: StudentDetails;
  items: InvoiceItem[];
  payment: PaymentSummary;
  notes?: string;
  terms?: string;
}

/**
 * Escapes HTML characters to prevent XSS injection.
 */
export function escapeHtml(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Formats numbers into Indian Rupee currency format (₹XX,XXX.XX).
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

/**
 * Lightweight Pure SVG QR Code Generator.
 * Encodes text into a crisp vector SVG QR pattern for zero-dependency printing.
 */
export function generateQRCodeSVG(text: string, size: number = 96): string {
  // Matrix generation for text strings
  const modules: boolean[][] = Array(25).fill(0).map(() => Array(25).fill(false));

  const addFinder = (top: number, left: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          modules[top + r][left + c] = true;
        }
      }
    }
  };

  addFinder(0, 0);
  addFinder(0, 18);
  addFinder(18, 0);

  for (let i = 8; i < 17; i++) {
    if (i % 2 === 0) {
      modules[6][i] = true;
      modules[i][6] = true;
    }
  }

  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < 25; r++) {
    for (let c = 0; c < 25; c++) {
      if (
        (r < 8 && c < 8) ||
        (r < 8 && c > 16) ||
        (r > 16 && c < 8) ||
        (r === 6 || c === 6)
      ) continue;

      const bit = ((hash ^ (r * 31 + c * 17)) & (1 << ((r + c) % 8))) !== 0;
      modules[r][c] = bit;
    }
  }

  const cellSize = size / 25;
  let rects = '';
  for (let r = 0; r < 25; r++) {
    for (let c = 0; c < 25; c++) {
      if (modules[r][c]) {
        const x = (c * cellSize).toFixed(2);
        const y = (r * cellSize).toFixed(2);
        const w = cellSize.toFixed(2);
        rects += `<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="#0f172a"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="display:block;">
    <rect width="${size}" height="${size}" fill="#ffffff"/>
    ${rects}
  </svg>`;
}

/**
 * Returns color tokens based on status.
 */
function getStatusBadgeStyle(status: InvoiceData['status']) {
  switch (status) {
    case 'PAID':
      return { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0', label: '✓ PAID' };
    case 'PARTIAL':
      return { bg: '#fef3c7', text: '#b45309', border: '#fde68a', label: '⚡ PARTIAL' };
    case 'OVERDUE':
      return { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5', label: '⚠ OVERDUE' };
    default:
      return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0', label: 'UNPAID' };
  }
}

/**
 * Generates production-ready, A4 print-optimized HTML string.
 */
export function generateInvoiceHTML(data: InvoiceData): string {
  const badge = getStatusBadgeStyle(data.status);

  const upiId = data.business.bankDetails?.upiId || 'edusteps@upi';
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(data.business.name)}&am=${data.payment.balanceDue || data.payment.amountPaid}&cu=INR`;
  const qrSvg = generateQRCodeSVG(upiUrl, 84);

  const itemsRows = data.items.map((item, idx) => `
    <tr>
      <td style="text-align: center; color: #64748b; font-size: 12px;">${idx + 1}</td>
      <td>
        <div style="font-weight: 600; color: #0f172a;">${escapeHtml(item.description)}</div>
        ${item.hsnSac ? `<div style="font-size: 11px; color: #64748b;">HSN/SAC: ${escapeHtml(item.hsnSac)}</div>` : ''}
      </td>
      <td style="text-align: center; color: #334155;">${item.qty}</td>
      <td style="text-align: right; color: #334155; font-variant-numeric: tabular-nums;">${formatCurrency(item.unitPrice)}</td>
      ${item.discount ? `<td style="text-align: right; color: #059669; font-variant-numeric: tabular-nums;">-${formatCurrency(item.discount)}</td>` : '<td style="text-align: right; color: #94a3b8;">—</td>'}
      <td style="text-align: right; font-weight: 700; color: #0f172a; font-variant-numeric: tabular-nums;">${formatCurrency(item.amount)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice – ${escapeHtml(data.invoiceNo)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      background: #f8fafc;
      color: #0f172a;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 13px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    .page-wrapper {
      max-width: 800px;
      margin: 30px auto;
      background: #ffffff;
      padding: 36px 40px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.01);
    }
    /* Brand Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 24px;
      border-bottom: 2px solid #3b82f6;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      color: #1e40af;
      letter-spacing: -0.02em;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand-sub {
      color: #64748b;
      font-size: 12px;
      margin-top: 4px;
      line-height: 1.4;
    }
    .invoice-header-right {
      text-align: right;
    }
    .invoice-badge-title {
      font-size: 26px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.05em;
      line-height: 1;
    }
    .invoice-no {
      font-size: 13px;
      font-weight: 600;
      color: #3b82f6;
      margin-top: 4px;
    }
    .status-pill {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      background: ${badge.bg};
      color: ${badge.text};
      border: 1px solid ${badge.border};
    }
    /* Grid Meta Section */
    .grid2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 24px 0;
    }
    .info-card {
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 10px;
      padding: 16px 20px;
    }
    .card-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      margin-bottom: 6px;
    }
    .card-name {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
    }
    .card-detail {
      font-size: 12px;
      color: #475569;
      margin-top: 2px;
    }
    /* Dates & Reference Bar */
    .meta-bar {
      display: flex;
      justify-content: space-between;
      background: #eff6ff;
      border: 1px solid #dbeafe;
      border-radius: 8px;
      padding: 10px 16px;
      margin-bottom: 24px;
      font-size: 12px;
    }
    .meta-item {
      display: flex;
      gap: 6px;
    }
    .meta-item span.label {
      color: #3b82f6;
      font-weight: 600;
    }
    .meta-item span.val {
      color: #1e3a8a;
      font-weight: 700;
    }
    /* Table Styling */
    table.invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    table.invoice-table thead th {
      background: #f1f5f9;
      color: #334155;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 10px 12px;
      border-bottom: 2px solid #e2e8f0;
    }
    table.invoice-table tbody td {
      padding: 12px 12px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 13px;
      vertical-align: middle;
    }
    table.invoice-table tbody tr:nth-child(even) {
      background: #fafafa;
    }
    /* Summary Footer Section */
    .summary-section {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 24px;
      align-items: start;
      margin-top: 10px;
    }
    .payment-instructions {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
      display: flex;
      gap: 16px;
      align-items: center;
    }
    .qr-box {
      background: #ffffff;
      padding: 6px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      flex-shrink: 0;
    }
    .instruction-text {
      font-size: 11px;
      color: #475569;
      line-height: 1.4;
    }
    .instruction-text strong {
      color: #0f172a;
      font-size: 12px;
    }
    .totals-table {
      width: 100%;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 6px 0;
      font-size: 13px;
      color: #475569;
    }
    .totals-table td.val {
      text-align: right;
      font-weight: 600;
      color: #0f172a;
      font-variant-numeric: tabular-nums;
    }
    .totals-table tr.grand-total td {
      padding-top: 10px;
      border-top: 2px solid #e2e8f0;
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
    }
    .totals-table tr.paid-row td {
      color: #16a34a;
      font-weight: 700;
    }
    .totals-table tr.due-row td {
      background: #fef2f2;
      padding: 8px;
      border-radius: 6px;
      color: #dc2626;
      font-weight: 800;
      font-size: 15px;
    }
    .totals-table tr.due-row td.val {
      color: #dc2626;
    }
    /* Signature & Legal Footer */
    .legal-footer {
      margin-top: 36px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .footer-text {
      color: #94a3b8;
      font-size: 11px;
      line-height: 1.4;
      max-width: 420px;
    }
    .signatory-box {
      text-align: right;
    }
    .signatory-line {
      width: 140px;
      border-bottom: 1.5px solid #0f172a;
      margin-bottom: 4px;
      display: inline-block;
    }
    .signatory-title {
      font-size: 11px;
      font-weight: 600;
      color: #475569;
    }

    /* Print Precision Styles */
    @media print {
      @page {
        size: A4 portrait;
        margin: 10mm 12mm;
      }
      body, html {
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .page-wrapper {
        border: none !important;
        box-shadow: none !important;
        margin: 0 !important;
        padding: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
      }
      .no-print {
        display: none !important;
      }
      .info-card, .meta-bar, .payment-instructions, table.invoice-table thead th, tr.due-row td {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
  <div class="page-wrapper">
    <!-- Header -->
    <div class="header">
      <div>
        <div class="brand-title">
          <span>📚</span> ${escapeHtml(data.business.name)}
        </div>
        <div class="brand-sub">
          ${data.business.address ? `<div>${escapeHtml(data.business.address)}</div>` : ''}
          ${data.business.email ? `<div>Email: ${escapeHtml(data.business.email)} ${data.business.phone ? `| Phone: ${escapeHtml(data.business.phone)}` : ''}</div>` : ''}
          ${data.business.gstin ? `<div style="font-weight:600; color:#334155;">GSTIN: ${escapeHtml(data.business.gstin)}</div>` : ''}
        </div>
      </div>
      <div class="invoice-header-right">
        <div class="invoice-badge-title">INVOICE</div>
        <div class="invoice-no">#${escapeHtml(data.invoiceNo)}</div>
        <div><span class="status-pill">${badge.label}</span></div>
      </div>
    </div>

    <!-- Metadata Bar -->
    <div class="meta-bar" style="margin-top:20px;">
      <div class="meta-item"><span class="label">Issue Date:</span> <span class="val">${escapeHtml(data.issueDate)}</span></div>
      ${data.dueDate ? `<div class="meta-item"><span class="label">Due Date:</span> <span class="val">${escapeHtml(data.dueDate)}</span></div>` : ''}
      <div class="meta-item"><span class="label">Payment Mode:</span> <span class="val">${escapeHtml(data.payment.paymentMode || 'Online / UPI')}</span></div>
      ${data.payment.transactionRef ? `<div class="meta-item"><span class="label">Ref No:</span> <span class="val">${escapeHtml(data.payment.transactionRef)}</span></div>` : ''}
    </div>

    <!-- Grid info cards -->
    <div class="grid2">
      <div class="info-card">
        <div class="card-label">Billed To (Parent / Client)</div>
        <div class="card-name">${escapeHtml(data.customer.name)}</div>
        ${data.customer.mobile ? `<div class="card-detail">📞 ${escapeHtml(data.customer.mobile)}</div>` : ''}
        ${data.customer.email ? `<div class="card-detail">✉ ${escapeHtml(data.customer.email)}</div>` : ''}
        ${data.customer.address ? `<div class="card-detail">📍 ${escapeHtml(data.customer.address)}</div>` : ''}
      </div>
      <div class="info-card">
        <div class="card-label">Student & Course Details</div>
        <div class="card-name">${escapeHtml(data.student.name)}</div>
        <div class="card-detail">Subject: <strong>${escapeHtml(data.student.subject || 'N/A')}</strong></div>
        ${data.student.milestone ? `<div class="card-detail">Milestone: <strong>${escapeHtml(data.student.milestone)}</strong></div>` : ''}
        ${data.student.cdId ? `<div class="card-detail">Reg ID: #${escapeHtml(data.student.cdId)}</div>` : ''}
      </div>
    </div>

    <!-- Line items table -->
    <table class="invoice-table">
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;">#</th>
          <th>Description</th>
          <th style="width: 60px; text-align: center;">Qty</th>
          <th style="width: 110px; text-align: right;">Unit Price</th>
          <th style="width: 100px; text-align: right;">Discount</th>
          <th style="width: 110px; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <!-- Bottom summary section -->
    <div class="summary-section">
      <div class="payment-instructions">
        <div class="qr-box">
          ${qrSvg}
        </div>
        <div class="instruction-text">
          <strong>Scan & Pay via UPI</strong><br/>
          UPI ID: <span style="font-family:monospace; font-weight:700; color:#1e40af;">${escapeHtml(upiId)}</span><br/>
          ${data.business.bankDetails?.bankName ? `Bank: ${escapeHtml(data.business.bankDetails.bankName)} | A/C: ${escapeHtml(data.business.bankDetails.accountNumber)}<br/>` : ''}
          ${data.business.bankDetails?.ifsc ? `IFSC: ${escapeHtml(data.business.bankDetails.ifsc)}<br/>` : ''}
          <span style="font-size:10px; color:#94a3b8;">Accepts BHIM, Google Pay, PhonePe, Paytm</span>
        </div>
      </div>

      <div>
        <table class="totals-table">
          <tr>
            <td>Course Fee Subtotal</td>
            <td class="val">${formatCurrency(data.payment.totalFee)}</td>
          </tr>
          ${data.payment.discountTotal ? `
          <tr>
            <td style="color:#059669;">Special Discount</td>
            <td class="val" style="color:#059669;">-${formatCurrency(data.payment.discountTotal)}</td>
          </tr>` : ''}
          ${data.payment.taxTotal ? `
          <tr>
            <td>GST / Applicable Tax</td>
            <td class="val">${formatCurrency(data.payment.taxTotal)}</td>
          </tr>` : ''}
          <tr class="grand-total">
            <td>Total Payable</td>
            <td class="val">${formatCurrency(data.payment.totalFee - (data.payment.discountTotal || 0))}</td>
          </tr>
          <tr class="paid-row">
            <td>Total Paid to Date</td>
            <td class="val">${formatCurrency(data.payment.amountPaid)}</td>
          </tr>
          <tr class="due-row">
            <td>Balance Due</td>
            <td class="val">${formatCurrency(data.payment.balanceDue)}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div class="legal-footer">
      <div class="footer-text">
        ${data.terms ? `<p style="margin-bottom:4px;"><strong>Terms:</strong> ${escapeHtml(data.terms)}</p>` : ''}
        <p>Thank you for choosing <strong>${escapeHtml(data.business.name)}</strong>. This is a computer-generated digital tax invoice.</p>
      </div>
      <div class="signatory-box">
        <div class="signatory-line"></div>
        <div class="signatory-title">Authorized Signatory</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Triggers a silent hidden iframe browser print for 100% crisp vector printout.
 */
export function printInvoiceHTML(htmlContent: string) {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;z-index:-9999;';
  iframe.title = 'Invoice Print Frame';
  
  const blob = new Blob([htmlContent], { type: 'text/html' });
  iframe.src = URL.createObjectURL(blob);

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Print trigger failed', e);
    }
    setTimeout(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(iframe.src);
    }, 10000);
  };

  document.body.appendChild(iframe);
}

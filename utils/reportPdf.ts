import type {
  ExpoRegistration,
  ExpoRegistrationsResponse,
  FunyulaReportsResponse,
  Payment,
  RiseReportItem,
  RiseReportsResponse,
  Volunteer,
  VolunteersResponse,
} from '@/types/reports';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

function escapeHtml(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatKes(amount: string): string {
  const n = parseFloat(amount);
  if (Number.isNaN(n)) return escapeHtml(amount);
  return `KES ${n.toLocaleString()}`;
}

function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return escapeHtml(d.toLocaleString());
  } catch {
    return escapeHtml(String(dateString));
  }
}

const pdfStyles = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #111; padding: 16px; }
  h1 { font-size: 18px; margin: 0 0 8px; }
  h2 { font-size: 14px; margin: 20px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  .meta { color: #666; font-size: 10px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #f4f4f4; font-weight: 600; }
  tr:nth-child(even) { background: #fafafa; }
  .summary { display: flex; flex-wrap: wrap; gap: 12px; margin: 12px 0; }
  .summary-card { border: 1px solid #ccc; border-radius: 8px; padding: 10px 12px; min-width: 140px; }
  .summary-label { font-size: 10px; color: #666; }
  .summary-value { font-size: 14px; font-weight: 700; margin-top: 4px; }
`;

function wrapDocument(title: string, bodyInner: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title><style>${pdfStyles}</style></head><body>
<h1>${escapeHtml(title)}</h1>
<div class="meta">Generated ${escapeHtml(new Date().toLocaleString())}</div>
${bodyInner}
</body></html>`;
}

export function buildFunyulaContributionsPdfHtml(data: FunyulaReportsResponse): string {
  const { summary, payments, pagination } = data.data;
  const breakdownRows = summary.statusBreakdown
    .map(
      (b, index) =>
        `<tr><td>${escapeHtml(index + 1)}</td><td>${escapeHtml(b.status)}</td><td>${escapeHtml(b.count)}</td><td>${formatKes(b.totalAmount)}</td></tr>`
    )
    .join('');

  const paymentRows = payments
    .map(
      (p: Payment, index) =>
        `<tr>
          <td>${escapeHtml(index + 1)}</td>
          <td>${escapeHtml(p.status)}</td>
          <td>${escapeHtml(p.phoneNumber || 'N/A')}</td>
          <td>${formatKes(p.amount)}</td>
          <td>${formatDateTime(p.transactionDate)}</td>
          <td>${escapeHtml((p.merchantRequestID || '').slice(0, 24))}</td>
          <td>${escapeHtml(p.resultDesc || '')}</td>
        </tr>`
    )
    .join('');

  const inner = `
    <div class="summary">
      <div class="summary-card"><div class="summary-label">Total amount</div><div class="summary-value">${formatKes(summary.totalAmount)}</div></div>
      <div class="summary-card"><div class="summary-label">Transactions</div><div class="summary-value">${escapeHtml(summary.totalTransactions)}</div></div>
      <div class="summary-card"><div class="summary-label">Rows in PDF</div><div class="summary-value">${escapeHtml(payments.length)} of ${escapeHtml(pagination.totalCount)}</div></div>
    </div>
    <h2>Status breakdown</h2>
    <table><thead><tr><th>ID</th><th>Status</th><th>Count</th><th>Amount</th></tr></thead><tbody>${breakdownRows}</tbody></table>
    <h2>Payments (all records)</h2>
    <table><thead><tr><th>ID</th><th>Status</th><th>Phone</th><th>Amount</th><th>Date</th><th>Merchant ref</th><th>Description</th></tr></thead><tbody>${paymentRows}</tbody></table>
  `;
  return wrapDocument('Funyula contributions', inner);
}

export function buildFunyulaVolunteersPdfHtml(data: VolunteersResponse): string {
  const { pagination } = data;
  const rows = data.data
    .map(
      (v: Volunteer, index) =>
        `<tr>
          <td>${escapeHtml(index + 1)}</td>
          <td>${escapeHtml(v.fullName)}</td>
          <td>${escapeHtml(v.ward)}</td>
          <td>${escapeHtml(v.location)}</td>
          <td>${escapeHtml(v.subLocation)}</td>
          <td>${escapeHtml(v.pollingStation)}</td>
          <td>${escapeHtml(v.phone)}</td>
          <td>${formatDateTime(v.createdAt)}</td>
        </tr>`
    )
    .join('');

  const inner = `
    <div class="meta">Total ${escapeHtml(pagination.totalCount)} · ${escapeHtml(data.data.length)} rows in this PDF (full export)</div>
    <table><thead><tr><th>ID</th><th>Name</th><th>Ward</th><th>Location</th><th>Sub-location</th><th>Polling station</th><th>Phone</th><th>Registered</th></tr></thead><tbody>${rows}</tbody></table>
  `;
  return wrapDocument('Funyula volunteers', inner);
}

export function buildSamiaWomenPdfHtml(data: ExpoRegistrationsResponse): string {
  const { pagination } = data;
  const rows = data.data
    .map(
      (r: ExpoRegistration, index) =>
        `<tr>
          <td>${escapeHtml(index + 1)}</td>
          <td>${escapeHtml(r.groupName)}</td>
          <td>${escapeHtml(r.designation)}</td>
          <td>${escapeHtml(r.groupLeaderName)}</td>
          <td>${escapeHtml(r.yourName)}</td>
          <td>${escapeHtml(r.idNumber)}</td>
          <td>${escapeHtml(r.phoneNumber)}</td>
          <td>${escapeHtml(r.isVerified ? 'Yes' : 'No')}</td>
          <td>${formatDateTime(r.createdAt)}</td>
        </tr>`
    )
    .join('');

  const inner = `
    <div class="meta">Total ${escapeHtml(pagination.totalCount)} · ${escapeHtml(data.data.length)} rows in this PDF (full export)</div>
    <table><thead><tr><th>ID</th><th>Group</th><th>Designation</th><th>Group leader</th><th>Your name</th><th>ID number</th><th>Phone</th><th>Verified</th><th>Registered</th></tr></thead><tbody>${rows}</tbody></table>
  `;
  return wrapDocument('Samia women registration', inner);
}

export function buildRiseReportPdfHtml(
  title: 'RISE profile reports' | 'RISE investors',
  data: RiseReportsResponse
): string {
  const { pagination } = data;
  const rows = data.data
    .map(
      (item: RiseReportItem, index) =>
        `<tr>
          <td>${escapeHtml(index + 1)}</td>
          <td>${escapeHtml(item.name)}</td>
          <td>${escapeHtml(item.email)}</td>
          <td>${escapeHtml(item.receipt_url || '—')}</td>
          <td>${formatDateTime(item.createdAt)}</td>
        </tr>`
    )
    .join('');

  const inner = `
    <div class="meta">Total ${escapeHtml(pagination.total)} · ${escapeHtml(data.data.length)} rows in this PDF (full export)</div>
    <table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Receipt URL</th><th>Created</th></tr></thead><tbody>${rows}</tbody></table>
  `;
  return wrapDocument(title, inner);
}

function sanitizeFileBase(name: string): string {
  return name.replace(/[^a-z0-9-_]+/gi, '_').slice(0, 80) || 'report';
}

export async function exportHtmlToPdf(html: string, fileBaseName: string): Promise<void> {
  if (Platform.OS === 'web') {
    Alert.alert('PDF export', 'PDF download is supported in the iOS and Android builds of this app.');
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });
  const safeName = sanitizeFileBase(fileBaseName);
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Download PDF',
      UTI: 'com.adobe.pdf',
    });
  } else {
    Alert.alert('PDF ready', `Saved to:\n${uri}\n\nFilename: ${safeName}.pdf`);
  }
}

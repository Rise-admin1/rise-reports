import * as WebBrowser from 'expo-web-browser';

export function formatAmount(amount?: number | null): string {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '—';
  return amount.toLocaleString();
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

export function documentUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.toString();
  } catch {
    return null;
  }
  return null;
}

export async function openDocument(url: string): Promise<void> {
  await WebBrowser.openBrowserAsync(url);
}

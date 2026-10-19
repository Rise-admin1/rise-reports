import * as WebBrowser from 'expo-web-browser';

export function formatMinor(amount: number, currency = 'AED'): string {
  const major = amount / 100;
  return `${currency.toUpperCase()} ${major.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

export function formatUnix(value?: number | null): string {
  if (value == null) return '—';
  try {
    return new Date(value * 1000).toLocaleDateString();
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

export function formatCsvField(value?: string | null): string {
  if (!value?.trim()) return '—';
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ');
}

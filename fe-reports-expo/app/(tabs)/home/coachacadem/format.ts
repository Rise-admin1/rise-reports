import * as WebBrowser from 'expo-web-browser';

export function formatMinor(amount: number, currency = 'AED'): string {
  const major = amount / 100;
  return `${currency} ${major.toLocaleString(undefined, {
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

export function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
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

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

export function jsonAsLines(value: unknown): string[] {
  if (value == null) return [];
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const record = item as Record<string, unknown>;
          if (typeof record.url === 'string') return record.url;
          if (typeof record.name === 'string') return record.name;
          try {
            return JSON.stringify(item);
          } catch {
            return String(item);
          }
        }
        return String(item);
      })
      .filter((line) => line.trim().length > 0);
  }
  try {
    return [JSON.stringify(value)];
  } catch {
    return [String(value)];
  }
}

const REFERENCE_SUNDAY_UTC = Date.UTC(2025, 0, 5);

function parseHm(hm: string): { h: number; m: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hm.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return null;
  }
  return { h, m };
}

function formatHm(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function hmToMinutes(hm: string): number | null {
  const parsed = parseHm(hm);
  if (!parsed) return null;
  return parsed.h * 60 + parsed.m;
}

export function validateHourlyTime(hm: string): string | null {
  const parsed = parseHm(hm);
  if (!parsed) return 'Use HH:MM format (e.g. 09:00)';
  if (parsed.m !== 0) return 'Times must be on the hour (:00 minutes only)';
  return null;
}

function windowsOverlap(
  a: { dayOfWeek: number; startTime: string; endTime: string },
  b: { dayOfWeek: number; startTime: string; endTime: string }
): boolean {
  if (a.dayOfWeek !== b.dayOfWeek) return false;
  const aStart = hmToMinutes(a.startTime);
  const aEnd = hmToMinutes(a.endTime);
  const bStart = hmToMinutes(b.startTime);
  const bEnd = hmToMinutes(b.endTime);
  if (aStart == null || aEnd == null || bStart == null || bEnd == null) return false;
  return aStart < bEnd && bStart < aEnd;
}

export function validateAvailabilityWindowUtc(
  payload: { dayOfWeek: number; startTime: string; endTime: string },
  existing: Array<{ id: string; dayOfWeek: number; startTime: string; endTime: string; dayName?: string }>,
  excludeId?: string | null
): string | null {
  const startErr = validateHourlyTime(payload.startTime);
  if (startErr) return `Start time: ${startErr}`;
  const endErr = validateHourlyTime(payload.endTime);
  if (endErr) return `End time: ${endErr}`;

  const startMin = hmToMinutes(payload.startTime);
  const endMin = hmToMinutes(payload.endTime);
  if (startMin == null || endMin == null) return 'Invalid time format';
  if (endMin <= startMin) return 'End time must be after start time';

  for (const row of existing) {
    if (excludeId && row.id === excludeId) continue;
    if (windowsOverlap(payload, row)) {
      const label = row.dayName ?? `Day ${row.dayOfWeek}`;
      return `Overlaps an existing ${label} window (${row.startTime}–${row.endTime} UTC)`;
    }
  }

  return null;
}

export function validateAvailabilityFormLocal(
  form: { dayOfWeek: number; startTime: string; endTime: string },
  existing: Array<{ id: string; dayOfWeek: number; startTime: string; endTime: string; dayName?: string }>,
  excludeId?: string | null
): string | null {
  const startErr = validateHourlyTime(form.startTime);
  if (startErr) return `Start time: ${startErr}`;
  const endErr = validateHourlyTime(form.endTime);
  if (endErr) return `End time: ${endErr}`;

  const localStart = hmToMinutes(form.startTime);
  const localEnd = hmToMinutes(form.endTime);
  if (localStart == null || localEnd == null) return 'Invalid time format';
  if (localEnd <= localStart) return 'End time must be after start time';

  const payload = localAvailabilityToUtc(form.dayOfWeek, form.startTime, form.endTime);
  return validateAvailabilityWindowUtc(payload, existing, excludeId);
}

export function utcWeeklyInstant(dayOfWeek: number, hm: string): Date | null {
  const parsed = parseHm(hm);
  if (!parsed) return null;

  const dayMs = REFERENCE_SUNDAY_UTC + dayOfWeek * 24 * 60 * 60 * 1000;
  const day = new Date(dayMs);
  return new Date(
    Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), parsed.h, parsed.m, 0, 0)
  );
}

export function getLocalTimezoneLabel(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'Local time';
  }
}

export function formatAvailabilityLocal(
  dayOfWeek: number,
  startTime: string,
  endTime: string
): string {
  const start = utcWeeklyInstant(dayOfWeek, startTime);
  const end = utcWeeklyInstant(dayOfWeek, endTime);
  if (!start || !end) return `${startTime} – ${endTime}`;

  const fmtTime = (date: Date) =>
    date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const fmtDay = (date: Date) =>
    date.toLocaleDateString(undefined, { weekday: 'short' });

  const startDay = fmtDay(start);
  const endDay = fmtDay(end);

  if (startDay === endDay) {
    return `${fmtTime(start)} – ${fmtTime(end)}`;
  }
  return `${startDay} ${fmtTime(start)} – ${endDay} ${fmtTime(end)}`;
}

export function getLocalAvailabilityDayName(dayOfWeek: number, startTime: string): string {
  const start = utcWeeklyInstant(dayOfWeek, startTime);
  if (!start) return '';
  return start.toLocaleDateString(undefined, { weekday: 'long' });
}

export function utcAvailabilityToLocalForm(
  dayOfWeek: number,
  startTime: string,
  endTime: string
): { dayOfWeek: number; startTime: string; endTime: string } {
  const start = utcWeeklyInstant(dayOfWeek, startTime);
  const end = utcWeeklyInstant(dayOfWeek, endTime);
  if (!start || !end) {
    return { dayOfWeek, startTime, endTime };
  }

  return {
    dayOfWeek: start.getDay(),
    startTime: formatHm(start.getHours(), start.getMinutes()),
    endTime: formatHm(end.getHours(), end.getMinutes()),
  };
}

export function localAvailabilityToUtc(
  dayOfWeek: number,
  startTime: string,
  endTime: string
): { dayOfWeek: number; startTime: string; endTime: string } {
  const startParsed = parseHm(startTime);
  const endParsed = parseHm(endTime);
  if (!startParsed || !endParsed) {
    return { dayOfWeek, startTime, endTime };
  }

  const now = new Date();
  const startLocal = new Date(now);
  startLocal.setDate(now.getDate() + (dayOfWeek - now.getDay()));
  startLocal.setHours(startParsed.h, startParsed.m, 0, 0);

  const endLocal = new Date(now);
  endLocal.setDate(now.getDate() + (dayOfWeek - now.getDay()));
  endLocal.setHours(endParsed.h, endParsed.m, 0, 0);

  if (endLocal.getTime() <= startLocal.getTime()) {
    endLocal.setDate(endLocal.getDate() + 1);
  }

  return {
    dayOfWeek: startLocal.getUTCDay(),
    startTime: formatHm(startLocal.getUTCHours(), startLocal.getUTCMinutes()),
    endTime: formatHm(endLocal.getUTCHours(), endLocal.getUTCMinutes()),
  };
}

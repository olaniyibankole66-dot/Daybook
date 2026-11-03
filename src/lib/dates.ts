export type Period = "today" | "week" | "month" | "30days";

export function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDay(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(value);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function periodBounds(period: Period, now = new Date()): { start: Date; end: Date } {
  const end = endOfDay(now);
  const start = startOfDay(now);
  if (period === "today") return { start, end };
  if (period === "week") {
    const day = start.getDay();
    const mondayOffset = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - mondayOffset);
    return { start, end };
  }
  if (period === "month") {
    start.setDate(1);
    return { start, end };
  }
  start.setDate(start.getDate() - 29);
  return { start, end };
}

export function inPeriod(date: Date, period: Period, now = new Date()): boolean {
  const { start, end } = periodBounds(period, now);
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

export function eachDay(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cursor = startOfDay(start);
  const last = startOfDay(end);
  while (cursor.getTime() <= last.getTime() && days.length < 62) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function shiftDays(now: Date, daysAgo: number, hour: number, minute: number): string {
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export function shiftDayKey(now: Date, daysAgo: number): string {
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  return dayKey(date);
}

export const TIME_ZONE = "America/New_York";

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const dateTime = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const dateOnly = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  month: "short",
  day: "numeric",
  year: "numeric",
});

const dayKey = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const weekdayHour = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "short",
  hour: "numeric",
  hourCycle: "h23",
});

export function formatCount(value: number): string {
  return value >= 1000 ? compact.format(value) : value.toLocaleString("en-US");
}

export function formatPercent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

export function formatDuration(ms: number | null): string {
  if (ms === null) {
    return "—";
  }

  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

export function formatDate(iso: string): string {
  return dateOnly.format(new Date(iso));
}

// YYYY-MM-DD in New York time, so "today" matches the campus clock.
export function toDayKey(date: Date | string): string {
  return dayKey.format(new Date(date));
}

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function toWeekdayHour(iso: string): { weekday: number; hour: number } {
  const parts = weekdayHour.formatToParts(new Date(iso));
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "Mon";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);

  return { weekday: Math.max(0, WEEKDAYS.indexOf(weekday)), hour: hour % 24 };
}

export function fullName(profile: {
  first_name: string | null;
  last_name: string | null;
} | null | undefined): string {
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");
  return name || "Unnamed user";
}

export function shortId(id: string): string {
  return id.slice(0, 8);
}

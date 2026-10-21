import type { ReactNode } from "react";
import { WEEKDAYS, formatCount } from "@/lib/format";

// Dark-mode steps of the reference palette: series slot 1 and the blue sequential ramp.
const SERIES = "#3987e5";
const HEAT_STEPS = ["#27272a", "#0d366b", "#184f95", "#256abf", "#3987e5", "#6da7ec", "#b7d3f6"];

function Tooltip({ children }: { children: ReactNode }) {
  return (
    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-100 shadow-lg group-hover:block group-focus:block">
      {children}
    </span>
  );
}

function dayLabel(day: string) {
  const [, month, date] = day.split("-").map(Number);
  return `${month}/${date}`;
}

export function ColumnChart({
  data,
  unit,
}: {
  data: { day: string; value: number }[];
  unit: string;
}) {
  const max = Math.max(1, ...data.map((point) => point.value));
  const total = data.reduce((sum, point) => sum + point.value, 0);
  const tick = Math.max(1, Math.ceil(max / 2));

  return (
    <figure>
      <div className="relative flex h-40 gap-[2px] border-b border-zinc-700">
        {[tick * 2, tick].map((value) => (
          <div
            key={value}
            className="pointer-events-none absolute inset-x-0 border-t border-zinc-800"
            style={{ bottom: `${(value / Math.max(max, tick * 2)) * 100}%` }}
          >
            <span className="absolute -top-2 right-full mr-2 text-[10px] text-zinc-500">{formatCount(value)}</span>
          </div>
        ))}
        {data.map((point) => (
          <div
            key={point.day}
            tabIndex={0}
            aria-label={`${dayLabel(point.day)}: ${point.value} ${unit}`}
            className="group relative flex flex-1 items-end justify-center outline-none hover:bg-zinc-800/50 focus:bg-zinc-800/50"
          >
            <div
              className="w-full max-w-6 rounded-t"
              style={{
                height: `${(point.value / Math.max(max, tick * 2)) * 100}%`,
                background: SERIES,
                minHeight: point.value > 0 ? 2 : 0,
              }}
            />
            <Tooltip>
              {dayLabel(point.day)} · <strong>{point.value}</strong> {unit}
            </Tooltip>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-zinc-500">
        <span>{dayLabel(data[0]?.day ?? "")}</span>
        <span>{dayLabel(data[Math.floor(data.length / 2)]?.day ?? "")}</span>
        <span>Today</span>
      </div>
      <figcaption className="sr-only">
        {total} {unit} over the last {data.length} days.
      </figcaption>
    </figure>
  );
}

export function Heatmap({ grid }: { grid: number[][] }) {
  const max = Math.max(1, ...grid.flat());
  const step = (value: number) =>
    value === 0 ? HEAT_STEPS[0] : HEAT_STEPS[Math.min(HEAT_STEPS.length - 1, 1 + Math.floor((value / max) * (HEAT_STEPS.length - 1.01)))];

  const hourLabel = (hour: number) => (hour === 0 ? "12a" : hour < 12 ? `${hour}a` : hour === 12 ? "12p" : `${hour - 12}p`);

  return (
    <figure>
      <div className="overflow-x-auto">
        <div className="grid min-w-[560px] grid-cols-[32px_repeat(24,minmax(0,1fr))] gap-[2px]">
          <span />
          {Array.from({ length: 24 }, (_, hour) => (
            <span key={hour} className="text-center text-[10px] text-zinc-500">
              {hour % 3 === 0 ? hourLabel(hour) : ""}
            </span>
          ))}
          {grid.map((row, weekday) => (
            <div key={weekday} className="contents">
              <span className="self-center text-[10px] text-zinc-500">{WEEKDAYS[weekday]}</span>
              {row.map((value, hour) => (
                <span
                  key={hour}
                  tabIndex={0}
                  aria-label={`${WEEKDAYS[weekday]} ${hourLabel(hour)}: ${value} votes`}
                  className="group relative aspect-square rounded-[3px] outline-none ring-zinc-100 focus:ring-1"
                  style={{ background: step(value) }}
                >
                  <Tooltip>
                    {WEEKDAYS[weekday]} {hourLabel(hour)} · <strong>{value}</strong> votes
                  </Tooltip>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <figcaption className="mt-3 flex items-center gap-2 text-[10px] text-zinc-500">
        Fewer
        {HEAT_STEPS.map((color) => (
          <span key={color} className="size-3 rounded-[3px]" style={{ background: color }} />
        ))}
        More · New York time
      </figcaption>
    </figure>
  );
}

// Horizontal bars for one measure across labelled rows; values sit at the bar tip.
export function BarList({
  rows,
}: {
  rows: { key: string; label: ReactNode; value: number; display: string; color?: string; hint?: string }[];
}) {
  const max = Math.max(1, ...rows.map((row) => row.value));

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.key} title={row.hint}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-zinc-200">{row.label}</span>
            <span className="shrink-0 tabular-nums text-zinc-300">{row.display}</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-800">
            <div
              className="h-2 rounded-full"
              style={{ width: `${(row.value / max) * 100}%`, background: row.color ?? SERIES }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

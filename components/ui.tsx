import Link from "next/link";
import type { ReactNode } from "react";
import { vibeInfo } from "@/lib/vibes";

// Pill buttons, as in the CaptionNYC app (.btn / .btn-accent / .btn-outline).
const buttonBase =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-xs font-bold uppercase tracking-[0.08em] transition duration-150 hover:-translate-y-px active:translate-y-0 active:scale-[0.97] disabled:cursor-wait disabled:opacity-50 disabled:hover:translate-y-0";

export const buttonClass = {
  primary: `${buttonBase} bg-accent text-ink hover:bg-accent-hover`,
  secondary: `${buttonBase} border border-line bg-surface text-ink hover:border-ink`,
  danger: `${buttonBase} border border-danger/30 bg-surface text-danger hover:bg-danger-soft`,
};

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold text-ink md:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-muted">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Card({
  title,
  description,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[28px] border border-line-soft bg-surface p-6 ${className}`}>
      {title && (
        <header className="mb-5">
          <h2 className="text-lg font-extrabold text-ink">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </header>
      )}
      {children}
    </section>
  );
}

export function StatTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: ReactNode;
}) {
  return (
    <div className="flex min-h-32 flex-col justify-end gap-1.5 rounded-[20px] border border-line-soft bg-surface p-6 transition duration-200 hover:-translate-y-[3px] hover:border-line hover:shadow-card">
      <p className="text-4xl font-extrabold leading-none tracking-[-0.04em] text-ink">{value}</p>
      <p className="text-sm font-semibold text-muted">{label}</p>
      {detail && <p className="text-xs text-muted">{detail}</p>}
    </div>
  );
}

export function Delta({ current, previous, label }: { current: number; previous: number; label: string }) {
  if (previous === 0) {
    return <span>{label}</span>;
  }

  const change = (current - previous) / previous;
  const up = change >= 0;

  return (
    <span>
      <span className={`font-semibold ${up ? "text-accent-deep" : "text-danger"}`}>
        {up ? "▲" : "▼"} {Math.abs(Math.round(change * 100))}%
      </span>{" "}
      {label}
    </span>
  );
}

export function VibeTag({ vibe }: { vibe: string | null }) {
  const info = vibeInfo(vibe);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-[0.04em] ${
        info?.tag ?? "bg-cream-2 text-muted"
      }`}
    >
      {info?.label ?? vibe ?? "None"}
    </span>
  );
}

export function VoteTag({ vote }: { vote: number }) {
  return vote === 1 ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-ink">▲ Up</span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-surface">▼ Down</span>
  );
}

export function Thumb({ src, alt, className = "" }: { src: string | null | undefined; alt: string; className?: string }) {
  if (!src) {
    return <div className={`bg-cream-2 ${className}`} />;
  }

  // Media URLs can point at any host an admin enters, so skip next/image's allowlist.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className={`bg-cream-2 object-cover ${className}`} />;
}

export function Avatar({ src, name }: { src: string | null | undefined; name: string }) {
  if (src) {
    return <Thumb src={src} alt="" className="size-9 shrink-0 rounded-full" />;
  }

  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cream-3 text-sm font-bold text-ink">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function Flash({ notice, error }: { notice?: string | null; error?: string | null }) {
  if (error) {
    return (
      <p role="alert" className="mb-6 rounded-[14px] bg-danger-soft px-4 py-3.5 font-medium text-danger">
        {error}
      </p>
    );
  }

  if (notice) {
    return (
      <p role="status" className="mb-6 rounded-[14px] bg-accent-soft px-4 py-3.5 font-semibold text-accent-deep">
        {notice}
      </p>
    );
  }

  return null;
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-[28px] border border-dashed border-line bg-surface px-6 py-14 text-center text-muted">{children}</p>
  );
}

export function Pagination({
  page,
  total,
  pageSize,
  href,
}: {
  page: number;
  total: number;
  pageSize: number;
  href: (page: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));

  if (pages <= 1) {
    return null;
  }

  const disabled = `${buttonClass.secondary} pointer-events-none opacity-40`;

  return (
    <nav className="mt-6 flex items-center justify-between text-sm">
      <span className="text-muted">
        Page {page} of {pages} · {total.toLocaleString("en-US")} total
      </span>
      <div className="flex gap-2">
        {page > 1 ? <Link className={buttonClass.secondary} href={href(page - 1)}>Previous</Link> : <span className={disabled}>Previous</span>}
        {page < pages ? <Link className={buttonClass.secondary} href={href(page + 1)}>Next</Link> : <span className={disabled}>Next</span>}
      </div>
    </nav>
  );
}

// Matches the app's .nav-link pills: active is white with a hairline ring.
export function FilterLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-2 transition-colors duration-200 text-xs font-bold uppercase tracking-[0.08em] ${
        active ? "bg-surface text-ink ring-1 ring-ink" : "text-muted ring-1 ring-line-soft hover:bg-surface/60 hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

export const inputClass =
  "min-h-11 w-full rounded-[14px] border border-line bg-field px-4 py-2.5 text-base text-ink placeholder:text-muted focus:bg-surface";

export const labelClass = "mb-2 block text-sm font-bold text-ink";

export const tableClass = {
  wrap: "overflow-x-auto rounded-[20px] border border-line-soft bg-surface",
  head: "bg-cream-2/60 text-xs font-bold uppercase tracking-[0.06em] text-muted",
  row: "transition-colors duration-200 hover:bg-cream/60",
};

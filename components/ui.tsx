import Link from "next/link";
import type { ReactNode } from "react";
import { vibeInfo } from "@/lib/vibes";

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
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-400">{description}</p>}
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
    <section className={`rounded-2xl border border-zinc-800 bg-zinc-900 p-5 ${className}`}>
      {title && (
        <header className="mb-4">
          <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-zinc-400">{description}</p>}
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
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50">{value}</p>
      {detail && <p className="mt-1 text-xs text-zinc-400">{detail}</p>}
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
      <span className={up ? "text-emerald-400" : "text-red-400"}>
        {up ? "▲" : "▼"} {Math.abs(Math.round(change * 100))}%
      </span>{" "}
      {label}
    </span>
  );
}

export function VibeTag({ vibe }: { vibe: string | null }) {
  const info = vibeInfo(vibe);

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-300">
      <span className="size-2 rounded-full" style={{ background: info?.color ?? "#71717a" }} />
      {info?.label ?? vibe ?? "None"}
    </span>
  );
}

export function VoteTag({ vote }: { vote: number }) {
  return vote === 1 ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
      ▲ Upvote
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
      ▼ Downvote
    </span>
  );
}

export function Thumb({ src, alt, className = "" }: { src: string | null | undefined; alt: string; className?: string }) {
  if (!src) {
    return <div className={`bg-zinc-800 ${className}`} />;
  }

  // Media URLs can point at any host an admin enters, so skip next/image's allowlist.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className={`bg-zinc-800 object-cover ${className}`} />;
}

export function Avatar({ src, name }: { src: string | null | undefined; name: string }) {
  if (src) {
    return <Thumb src={src} alt="" className="size-8 shrink-0 rounded-full" />;
  }

  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-300">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function Flash({ notice, error }: { notice?: string | null; error?: string | null }) {
  if (error) {
    return (
      <p role="alert" className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {error}
      </p>
    );
  }

  if (notice) {
    return (
      <p role="status" className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
        {notice}
      </p>
    );
  }

  return null;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">{children}</p>;
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

  const link = "rounded-lg border border-zinc-800 px-3 py-1.5 hover:bg-zinc-800";
  const disabled = "rounded-lg border border-zinc-900 px-3 py-1.5 text-zinc-600";

  return (
    <nav className="mt-6 flex items-center justify-between text-sm text-zinc-300">
      <span className="text-zinc-500">
        Page {page} of {pages} · {total.toLocaleString("en-US")} total
      </span>
      <div className="flex gap-2">
        {page > 1 ? <Link className={link} href={href(page - 1)}>Previous</Link> : <span className={disabled}>Previous</span>}
        {page < pages ? <Link className={link} href={href(page + 1)}>Next</Link> : <span className={disabled}>Next</span>}
      </div>
    </nav>
  );
}

export function FilterLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-sm ${
        active ? "bg-zinc-100 font-medium text-zinc-900" : "border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
      }`}
    >
      {children}
    </Link>
  );
}

export const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none";

export const labelClass = "mb-1.5 block text-xs font-medium text-zinc-400";

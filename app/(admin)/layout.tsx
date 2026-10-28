import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/app/actions";
import { LogoMark } from "@/components/icons";
import { NavLinks, NavList } from "@/components/nav";
import { Avatar } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";

async function AdminBadge() {
  const admin = await requireAdmin();

  return (
    <div className="flex items-center gap-3">
      <Avatar src={admin.avatarUrl} name={admin.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-ink">{admin.name}</p>
        <p className="text-xs text-muted">Superadmin</p>
      </div>
      <form action={signOut}>
        <button type="submit" className="cursor-pointer rounded-full border border-line-soft bg-surface px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-muted transition duration-200 hover:border-line hover:bg-cream-2 hover:text-ink active:scale-[0.94]">
          Sign out
        </button>
      </form>
    </div>
  );
}

export default function AdminLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-ink md:flex-row">
      <aside className="flex shrink-0 flex-col gap-6 border-b border-line-soft p-4 md:sticky md:top-0 md:h-screen md:w-60 md:border-b-0 md:border-r">
        <Link href="/dashboard" className="group flex items-center gap-2.5 px-3 pt-2 transition-colors duration-200 hover:text-accent-deep">
          <span className="transition-transform duration-200 group-hover:-rotate-[8deg] group-hover:scale-[1.08]">
            <LogoMark />
          </span>
          <div>
            <p className="text-sm font-extrabold tracking-[0.06em]">CAPTIONNYC</p>
            <p className="text-xs font-bold uppercase tracking-[0.06em] text-accent-deep">Admin</p>
          </div>
        </Link>
        <nav aria-label="Admin sections" className="overflow-x-auto md:min-h-0 md:overflow-y-auto">
          <Suspense fallback={<NavList />}>
            <NavLinks />
          </Suspense>
        </nav>
        <div className="mt-auto border-t border-line-soft px-1 pt-4">
          <Suspense fallback={<div className="h-8" />}>
            <AdminBadge />
          </Suspense>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-8 md:px-10">{children}</main>
    </div>
  );
}

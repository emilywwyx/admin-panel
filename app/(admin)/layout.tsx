import { Suspense } from "react";
import { signOut } from "@/app/actions";
import { NavLinks, NavList } from "@/components/nav";
import { Avatar } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";

async function AdminBadge() {
  const admin = await requireAdmin();

  return (
    <div className="flex items-center gap-3">
      <Avatar src={admin.avatarUrl} name={admin.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-100">{admin.name}</p>
        <p className="text-xs text-zinc-500">Superadmin</p>
      </div>
      <form action={signOut}>
        <button type="submit" className="cursor-pointer rounded-lg px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100">
          Sign out
        </button>
      </form>
    </div>
  );
}

export default function AdminLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 md:flex-row">
      <aside className="flex shrink-0 flex-col gap-6 border-b border-zinc-800 p-4 md:sticky md:top-0 md:h-screen md:w-60 md:border-b-0 md:border-r">
        <div className="px-3 pt-2">
          <p className="text-xs font-medium tracking-wide text-zinc-500">CAPTION NYC</p>
          <p className="text-lg font-semibold">Admin Panel</p>
        </div>
        <nav aria-label="Admin sections" className="overflow-x-auto md:min-h-0 md:overflow-y-auto">
          <Suspense fallback={<NavList />}>
            <NavLinks />
          </Suspense>
        </nav>
        <div className="mt-auto border-t border-zinc-800 px-1 pt-4">
          <Suspense fallback={<div className="h-8" />}>
            <AdminBadge />
          </Suspense>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-8 md:px-10">{children}</main>
    </div>
  );
}

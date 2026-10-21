"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/users", label: "Users" },
  { href: "/media", label: "Media" },
  { href: "/votes", label: "Votes" },
];

export function NavLinks() {
  const pathname = usePathname();

  return <NavList active={(href) => pathname === href || pathname.startsWith(`${href}/`)} />;
}

export function NavList({ active = () => false }: { active?: (href: string) => boolean }) {
  return (
    <ul className="flex gap-1 md:flex-col">
      {NAV_ITEMS.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className={`block rounded-lg px-3 py-2 text-sm ${
              active(item.href) ? "bg-zinc-800 font-medium text-zinc-50" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
            }`}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

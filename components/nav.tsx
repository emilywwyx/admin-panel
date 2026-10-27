"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard" }],
  },
  {
    label: "Community",
    items: [
      { href: "/users", label: "Users" },
      { href: "/votes", label: "Votes" },
    ],
  },
  {
    label: "Content",
    items: [{ href: "/media", label: "Images & captions" }],
  },
  {
    label: "Pipeline",
    items: [
      { href: "/prompt-chains", label: "Prompt chains" },
      { href: "/terms", label: "Terms" },
      { href: "/examples", label: "Generation examples" },
      { href: "/generation-requests", label: "Generation requests" },
      { href: "/llm-responses", label: "LLM responses" },
    ],
  },
  {
    label: "Models",
    items: [
      { href: "/llm-providers", label: "LLM providers" },
      { href: "/llm-models", label: "LLM models" },
    ],
  },
  {
    label: "Access",
    items: [
      { href: "/signup-domains", label: "Signup domains" },
      { href: "/whitelisted-emails", label: "Whitelisted emails" },
    ],
  },
];

export function NavLinks() {
  const pathname = usePathname();

  return <NavList active={(href) => pathname === href || pathname.startsWith(`${href}/`)} />;
}

export function NavList({ active = () => false }: { active?: (href: string) => boolean }) {
  return (
    <div className="flex gap-4 md:flex-col">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label} className="shrink-0">
          <p className="mb-1 hidden px-3 text-[11px] font-medium uppercase tracking-wide text-zinc-600 md:block">
            {section.label}
          </p>
          <ul className="flex gap-1 md:flex-col">
            {section.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${
                    active(item.href) ? "bg-zinc-800 font-medium text-zinc-50" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

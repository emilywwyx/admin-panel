"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

const VARIANTS = {
  primary: "bg-zinc-100 text-zinc-900 hover:bg-white",
  secondary: "border border-zinc-700 text-zinc-200 hover:bg-zinc-800",
  danger: "border border-red-500/40 text-red-300 hover:bg-red-500/10",
};

export function SubmitButton({
  children,
  variant = "primary",
  confirm,
}: {
  children: ReactNode;
  variant?: keyof typeof VARIANTS;
  confirm?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (confirm && !window.confirm(confirm)) {
          event.preventDefault();
        }
      }}
      className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium disabled:cursor-wait disabled:opacity-50 ${VARIANTS[variant]}`}
    >
      {pending ? "Working…" : children}
    </button>
  );
}

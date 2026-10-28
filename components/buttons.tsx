"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { buttonClass } from "@/components/ui";

export function SubmitButton({
  children,
  variant = "primary",
  confirm,
}: {
  children: ReactNode;
  variant?: keyof typeof buttonClass;
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
      className={buttonClass[variant]}
    >
      {pending ? "Working…" : children}
    </button>
  );
}

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const feedbackKindClasses = {
  loading: "feedback-loading border-[color:var(--line)] bg-[color:var(--paper-raised)] text-[color:var(--ink-soft)]",
  empty: "feedback-empty border-[color:color-mix(in_srgb,var(--line)_72%,transparent)] bg-[color:color-mix(in_srgb,var(--paper-raised)_68%,transparent)] text-[color:var(--ink-soft)]",
  error: "feedback-error border-[color:color-mix(in_srgb,var(--danger)_46%,var(--line))] bg-[color:color-mix(in_srgb,var(--danger)_8%,var(--paper-raised))] text-[color:var(--danger)]",
  success: "feedback-success border-[color:color-mix(in_srgb,var(--success)_42%,var(--line))] bg-[color:color-mix(in_srgb,var(--success)_8%,var(--paper-raised))] text-[color:var(--success)]",
};

export function Feedback({
  children,
  kind = "loading",
}: {
  children: ReactNode;
  kind?: "loading" | "empty" | "error" | "success";
}) {
  const role = kind === "error" ? "alert" : "status";

  return (
    <div
      className={cn(
        "feedback rounded-[var(--radius-md)] border p-5 text-sm leading-6 shadow-[0_16px_40px_rgba(88,70,49,0.08)]",
        feedbackKindClasses[kind],
      )}
      role={role}
    >
      {children}
    </div>
  );
}

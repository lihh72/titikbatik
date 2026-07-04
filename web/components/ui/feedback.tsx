import type { ReactNode } from "react";

export function Feedback({
  children,
  kind = "loading",
}: {
  children: ReactNode;
  kind?: "loading" | "empty" | "error" | "success";
}) {
  const role = kind === "error" ? "alert" : "status";

  return (
    <div className={`feedback feedback-${kind}`} role={role}>
      {children}
    </div>
  );
}

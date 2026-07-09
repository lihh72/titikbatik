import type { ReactNode } from "react";

type PageHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: PageHeadingProps) {
  return (
    <header className="page-heading flex items-end justify-between gap-6 border-b border-[var(--line)] pb-6 max-[47.99rem]:flex-col max-[47.99rem]:items-stretch">
      <div>
        <p className="eyebrow m-0 text-[0.76rem] font-extrabold tracking-[0.12em] text-[color:var(--terracotta-dark)] uppercase">{eyebrow}</p>
        <h1 className="mt-2 max-w-[13ch] text-[clamp(2rem,4vw,3.5rem)] leading-[1.04] font-semibold tracking-[-0.05em] text-[color:var(--ink)] text-balance">{title}</h1>
        {description && <p className="mt-3 max-w-[46rem] text-base leading-[1.7] text-[color:var(--ink-soft)]">{description}</p>}
      </div>
      {actions && <div className="page-actions flex flex-wrap gap-3 max-[47.99rem]:w-full max-[47.99rem]:justify-start">{actions}</div>}
    </header>
  );
}

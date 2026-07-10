import Link from "next/link";
import type { ComponentProps, ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ActionVariant = "primary" | "secondary" | "quiet" | "danger";

type SharedActionProps = {
  children: ReactNode;
  className?: string;
  variant?: ActionVariant;
};

type LinkActionProps = SharedActionProps &
  Omit<ComponentProps<typeof Link>, "children" | "className" | "href"> & {
    href: ComponentProps<typeof Link>["href"];
  };

type ButtonActionProps = SharedActionProps &
  ComponentPropsWithoutRef<"button"> & {
    href?: never;
  };

export type ActionProps = LinkActionProps | ButtonActionProps;

const baseActionClass =
  "action inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] border border-transparent px-4 py-[0.7rem] text-sm font-bold leading-[1.2] transition-[background-color,border-color,color,transform] duration-[180ms] hover:-translate-y-px active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60";

const variantClasses: Record<ActionVariant, string> = {
  primary:
    "action-primary bg-[color:var(--terracotta-dark)] !text-white hover:bg-[#8c2e21]",
  secondary:
    "action-secondary border-[color:var(--line)] bg-transparent text-[color:var(--ink)] hover:border-[color:var(--terracotta-dark)] hover:bg-[color-mix(in_srgb,var(--terracotta)_10%,var(--paper-raised))] hover:text-[color:var(--terracotta-dark)]",
  quiet:
    "action-quiet border-transparent bg-transparent px-1 text-[color:var(--ink)] underline decoration-transparent underline-offset-4 hover:text-[color:var(--terracotta-dark)] hover:decoration-current",
  danger:
    "action-danger border-[color:var(--danger)] bg-[color:var(--danger)] text-[color:var(--paper-raised)] hover:border-[#8f1d14] hover:bg-[#8f1d14]",
};

export function Action({
  children,
  className,
  variant = "primary",
  ...actionProps
}: ActionProps) {
  const classes = cn(baseActionClass, variantClasses[variant], className);

  if ("href" in actionProps && actionProps.href !== undefined) {
    const { href, onClick, tabIndex, ...linkProps } = actionProps;
    const disabled = linkProps["aria-disabled"] === true || linkProps["aria-disabled"] === "true";

    if (disabled) {
      const inertProps = Object.fromEntries(
        Object.entries(linkProps).filter(([key]) => (
          key === "id"
          || key === "title"
          || key === "dir"
          || key === "lang"
          || key.startsWith("aria-")
          || key.startsWith("data-")
        )),
      ) as ComponentPropsWithoutRef<"span">;

      return (
        <span
          {...inertProps}
          aria-disabled="true"
          className={classes}
          data-variant={variant}
          tabIndex={-1}
        >
          {children}
        </span>
      );
    }

    return (
      <Link
        {...linkProps}
        className={classes}
        data-variant={variant}
        href={href}
        onClick={onClick}
        tabIndex={tabIndex}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      {...actionProps}
      className={classes}
      data-variant={variant}
      type={actionProps.type ?? "button"}
    >
      {children}
    </button>
  );
}

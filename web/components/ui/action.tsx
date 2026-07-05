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

export function Action({
  children,
  className,
  variant = "primary",
  ...actionProps
}: ActionProps) {
  const classes = cn("action", `action-${variant}`, className);

  if ("href" in actionProps && actionProps.href !== undefined) {
    const { href, onClick, tabIndex, ...linkProps } = actionProps;
    const disabled = linkProps["aria-disabled"] === true || linkProps["aria-disabled"] === "true";

    return (
      <Link
        {...linkProps}
        className={classes}
        data-variant={variant}
        href={href}
        onClick={(event) => {
          if (disabled) {
            event.preventDefault();
            return;
          }

          onClick?.(event);
        }}
        tabIndex={disabled ? -1 : tabIndex}
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

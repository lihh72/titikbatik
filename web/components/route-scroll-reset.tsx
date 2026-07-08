"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";

export function RouteScrollReset() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useLayoutEffect(() => {
    if (previousPathname.current === pathname) return;

    previousPathname.current = pathname;

    const html = document.documentElement;
    const body = document.body;
    const previousHtmlScrollBehavior = html.style.scrollBehavior;
    const previousBodyScrollBehavior = body.style.scrollBehavior;

    html.style.scrollBehavior = "auto";
    body.style.scrollBehavior = "auto";
    window.scrollTo({ left: 0, top: 0, behavior: "auto" });

    window.requestAnimationFrame(() => {
      html.style.scrollBehavior = previousHtmlScrollBehavior;
      body.style.scrollBehavior = previousBodyScrollBehavior;
    });
  }, [pathname]);

  return null;
}

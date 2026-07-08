import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RouteScrollReset } from "@/components/route-scroll-reset";

const navigation = vi.hoisted(() => ({ pathname: "/gallery" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

describe("RouteScrollReset", () => {
  beforeEach(() => {
    navigation.pathname = "/gallery";
    vi.restoreAllMocks();
    document.documentElement.style.scrollBehavior = "smooth";
    document.body.style.scrollBehavior = "smooth";
  });

  it("forces a new route to start from the top", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 0;
    });

    const { rerender } = render(<RouteScrollReset />);

    expect(scrollTo).not.toHaveBeenCalled();

    navigation.pathname = "/gallery/motif-1";
    rerender(<RouteScrollReset />);

    expect(scrollTo).toHaveBeenCalledWith({ behavior: "auto", left: 0, top: 0 });
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminShell } from "@/components/admin-shell";

const navigation = vi.hoisted(() => ({
  pathname: "/admin/history",
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({
    replace: navigation.replace,
    refresh: navigation.refresh,
  }),
}));

describe("AdminShell", () => {
  beforeEach(() => {
    navigation.pathname = "/admin/history";
    navigation.replace.mockReset();
    navigation.refresh.mockReset();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  });

  it("renders grouped administrator navigation with the active route", () => {
    render(<AdminShell><p>Konten admin</p></AdminShell>);

    expect(screen.getByText("Operasi")).toBeInTheDocument();
    expect(screen.getByText("Kurasi")).toBeInTheDocument();
    expect(screen.getByText("Sistem")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Batch dan job" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Galeri AI publik" })).toHaveAttribute("href", "/");
    expect(screen.getByText("Konten admin")).toBeInTheDocument();
  });

  it("opens the mobile drawer and logs out through the existing endpoint", async () => {
    const user = userEvent.setup();
    render(<AdminShell><p>Konten admin</p></AdminShell>);

    await user.click(screen.getByRole("button", { name: "Buka menu admin" }));

    expect(screen.getByRole("dialog", { name: "Navigasi admin" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Keluar" }));

    expect(fetch).toHaveBeenCalledWith("/api/admin/logout", { method: "POST" });
    expect(navigation.replace).toHaveBeenCalledWith("/admin/login");
    expect(navigation.refresh).toHaveBeenCalled();
  });

  it("manages mobile drawer focus and restores the trigger", async () => {
    const user = userEvent.setup();
    render(<AdminShell><p>Konten admin</p></AdminShell>);

    const trigger = screen.getByRole("button", { name: "Buka menu admin" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("dialog", { name: "Navigasi admin" })).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("button", { name: "Tutup menu admin" })).toHaveFocus();
    expect(document.body).toHaveStyle({ overflow: "hidden" });

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog", { name: "Navigasi admin" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.body).not.toHaveStyle({ overflow: "hidden" });
  });
});

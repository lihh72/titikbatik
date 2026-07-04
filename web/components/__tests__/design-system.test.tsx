import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Action } from "@/components/ui/action";
import { LogoMark } from "@/components/logo";

describe("design system", () => {
  it("renders the brand mark and semantic action variants", () => {
    render(<><LogoMark /><Action href="/gallery">Jelajahi koleksi</Action></>);
    expect(screen.getByLabelText("TitikBatik AI")).toHaveClass("logo-mark");
    expect(screen.getByRole("link", { name: "Jelajahi koleksi" })).toHaveAttribute("href", "/gallery");
    expect(screen.getByRole("link", { name: "Jelajahi koleksi" })).toHaveAttribute("data-variant", "primary");
  });

  it("renders button actions with safe defaults and forwarded presentation", () => {
    render(
      <>
        <Action>Simpan konsep</Action>
        <Action type="submit" variant="danger" className="custom-action">Hapus konsep</Action>
      </>,
    );

    expect(screen.getByRole("button", { name: "Simpan konsep" })).toHaveAttribute("type", "button");
    expect(screen.getByRole("button", { name: "Hapus konsep" })).toHaveAttribute("type", "submit");
    expect(screen.getByRole("button", { name: "Hapus konsep" })).toHaveAttribute("data-variant", "danger");
    expect(screen.getByRole("button", { name: "Hapus konsep" })).toHaveClass("action", "action-danger", "custom-action");
  });

  it("can hide a decorative brand mark from assistive technology", () => {
    const { container } = render(<LogoMark decorative />);
    const mark = container.querySelector(".logo-mark");

    expect(mark).toHaveAttribute("aria-hidden", "true");
    expect(mark).not.toHaveAttribute("role");
    expect(mark).not.toHaveAttribute("aria-label");
  });
});

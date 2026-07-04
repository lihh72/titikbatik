import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Action } from "@/components/ui/action";
import { LogoMark } from "@/components/logo";

describe("design system", () => {
  it("renders the brand mark and semantic action variants", () => {
    render(<><LogoMark /><Action href="/gallery">Jelajahi koleksi</Action></>);
    expect(screen.getByLabelText("TitikBatik AI")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Jelajahi koleksi" })).toHaveAttribute("href", "/gallery");
    expect(screen.getByRole("link", { name: "Jelajahi koleksi" })).toHaveAttribute("data-variant", "primary");
  });
});

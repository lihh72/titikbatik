import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MotifCard } from "@/components/motif-card";
import {
  COSTUME_CYCLE_MS,
  HOVER_INTENT_MS,
} from "@/components/motif-card";
import type { Batik } from "@/lib/automation-types";

const motionState = vi.hoisted(() => ({ reduced: false }));

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => motionState.reduced,
}));

vi.mock("@/components/app-provider", () => ({
  useApp: () => ({
    likedIds: [],
    bookmarkedIds: [],
    toggleLike: vi.fn(),
    toggleBookmark: vi.fn(),
  }),
}));

const batik: Batik = {
  id: 42,
  slug: "kawung-indigo",
  keyword: "Kawung Indigo",
  warna: "indigo",
  style: "Kontemporer",
  seed: 42,
  positive_prompt: "batik kawung indigo",
  negative_prompt: null,
  file_preview: "kawung.webp",
  file_video: null,
  prompt_hash: "hash-kawung",
  is_published: true,
  created_at: "2026-07-03T00:00:00Z",
  updated_at: "2026-07-03T00:00:00Z",
  preview_url: "http://127.0.0.1:8000/api/v1/images/preview/kawung.webp",
  costume_urls: [
    "http://127.0.0.1:8000/api/v1/images/costume/kawung-costume-1.webp",
    "http://127.0.0.1:8000/api/v1/images/costume/kawung-costume-2.webp",
  ],
  costume_files: [],
};

function setPointerCapability(finePointer: boolean) {
  vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
    matches: query.includes("(hover: hover) and (pointer: fine)")
      ? finePointer
      : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe("motif card costume preview", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    motionState.reduced = false;
    setPointerCapability(true);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("keeps the motif stable until hover intent, then cycles only the active tile", async () => {
    render(<MotifCard batik={batik} />);

    const card = screen.getByRole("article", { name: "Kawung Indigo" });
    await act(async () => {
      fireEvent.mouseEnter(card);
    });

    act(() => {
      vi.advanceTimersByTime(HOVER_INTENT_MS - 1);
    });
    expect(screen.getByTestId("motif-preview")).toHaveAttribute(
      "src",
      batik.preview_url,
    );
    expect(screen.queryByTestId("costume-preview")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByTestId("costume-preview")).toHaveAttribute(
      "src",
      batik.costume_urls[0],
    );

    act(() => {
      vi.advanceTimersByTime(COSTUME_CYCLE_MS);
    });
    expect(screen.getByTestId("costume-preview")).toHaveAttribute(
      "src",
      batik.costume_urls[1],
    );

    fireEvent.mouseLeave(card);
    expect(screen.getByTestId("motif-preview")).toHaveAttribute(
      "src",
      batik.preview_url,
    );
    expect(screen.queryByTestId("costume-preview")).not.toBeInTheDocument();
  });

  it("uses the same preview timing for keyboard focus and restores on blur", async () => {
    render(<MotifCard batik={batik} />);

    const card = screen.getByRole("article", { name: "Kawung Indigo" });
    await act(async () => {
      fireEvent.focus(card);
    });
    act(() => {
      vi.advanceTimersByTime(HOVER_INTENT_MS);
    });

    expect(screen.getByTestId("costume-preview")).toHaveAttribute(
      "src",
      batik.costume_urls[0],
    );

    fireEvent.blur(card, { relatedTarget: document.body });
    expect(screen.queryByTestId("costume-preview")).not.toBeInTheDocument();
  });

  it("leaves tiles without costume images on the motif", async () => {
    render(<MotifCard batik={{ ...batik, costume_urls: [] }} />);

    fireEvent.mouseEnter(screen.getByRole("article", { name: "Kawung Indigo" }));
    act(() => {
      vi.advanceTimersByTime(HOVER_INTENT_MS + COSTUME_CYCLE_MS);
    });

    expect(screen.getByTestId("motif-preview")).toHaveAttribute(
      "src",
      batik.preview_url,
    );
    expect(screen.queryByTestId("costume-preview")).not.toBeInTheDocument();
  });

  it("does not start pointer previews on touch-style input", async () => {
    setPointerCapability(false);
    render(<MotifCard batik={batik} />);

    fireEvent.mouseEnter(screen.getByRole("article", { name: "Kawung Indigo" }));
    act(() => {
      vi.advanceTimersByTime(HOVER_INTENT_MS + COSTUME_CYCLE_MS);
    });

    expect(screen.queryByTestId("costume-preview")).not.toBeInTheDocument();
  });

  it("reveals one costume immediately with reduced motion and does not cycle", async () => {
    motionState.reduced = true;
    render(<MotifCard batik={batik} />);

    fireEvent.focus(screen.getByRole("article", { name: "Kawung Indigo" }));

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByTestId("costume-preview")).toHaveAttribute(
      "src",
      batik.costume_urls[0],
    );

    act(() => {
      vi.advanceTimersByTime(COSTUME_CYCLE_MS * 2);
    });
    expect(screen.getByTestId("costume-preview")).toHaveAttribute(
      "src",
      batik.costume_urls[0],
    );
  });

  it("cleans preview timers when the active tile unmounts", async () => {
    const { unmount } = render(<MotifCard batik={batik} />);

    fireEvent.mouseEnter(screen.getByRole("article", { name: "Kawung Indigo" }));
    unmount();
    act(() => {
      vi.advanceTimersByTime(HOVER_INTENT_MS + COSTUME_CYCLE_MS);
    });

    expect(vi.getTimerCount()).toBe(0);
  });
});

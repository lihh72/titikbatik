import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminDashboard } from "@/components/admin-dashboard";
import type { DashboardData } from "@/lib/automation-types";

const mocks = vi.hoisted(() => ({
  getDashboard: vi.fn(),
}));

vi.mock("@/lib/automation-api", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/automation-api")>(),
  getDashboard: mocks.getDashboard,
}));

const dashboard: DashboardData = {
  total_batik: 48,
  published_batik: 22,
  active_batches: 3,
  job_queued: 5,
  job_running: 2,
  job_failed: 1,
  comfyui: "connected",
  last_worker_heartbeat: {
    worker_id: "worker-local",
    heartbeat_at: "2026-07-05T09:30:00Z",
  },
};

describe("AdminDashboard", () => {
  beforeEach(() => {
    mocks.getDashboard.mockReset();
    mocks.getDashboard.mockResolvedValue(dashboard);
  });

  it("renders pipeline-first dashboard modules from backend data", async () => {
    render(<AdminDashboard />);

    expect(await screen.findByRole("heading", { name: "Status produksi Titik Batik" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Tahap produksi" })).toBeInTheDocument();
    expect(screen.getByText("Prompt")).toBeInTheDocument();
    expect(screen.getByText("Generate")).toBeInTheDocument();
    expect(screen.getByText("Combine")).toBeInTheDocument();
    expect(screen.getByText("Video")).toBeInTheDocument();
    expect(screen.getByText("48")).toBeInTheDocument();
    expect(screen.getByText("22")).toBeInTheDocument();
    expect(screen.getByText("Terhubung")).toBeInTheDocument();
    expect(screen.getByText("worker-local")).toBeInTheDocument();
  });

  it("refreshes dashboard data and renders errors as alerts", async () => {
    const user = userEvent.setup();
    mocks.getDashboard
      .mockResolvedValueOnce(dashboard)
      .mockRejectedValueOnce(new Error("Dashboard gagal dimuat."));

    render(<AdminDashboard />);

    await screen.findByText("worker-local");
    await user.click(screen.getByRole("button", { name: "Muat ulang dashboard" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Dashboard gagal dimuat.");
    });
  });
});

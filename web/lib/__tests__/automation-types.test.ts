import { describe, expect, it } from "vitest";

import { unwrapAutomationResponse } from "@/lib/automation-types";

describe("unwrapAutomationResponse", () => {
  it("returns data from a successful FastAPI envelope", () => {
    expect(unwrapAutomationResponse({ success: true, message: "ok", data: { id: 4 } })).toEqual({ id: 4 });
  });

  it("throws the backend message for an error envelope", () => {
    expect(() =>
      unwrapAutomationResponse({ success: false, message: "Invalid admin key", errors: {} }),
    ).toThrow("Invalid admin key");
  });
});

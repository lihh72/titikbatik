import { describe, expect, it } from "vitest";

import packageJson from "@/package.json";

describe("development startup", () => {
  it("clears production route cache before starting Next dev", () => {
    expect(packageJson.scripts.predev).toContain("rmSync('.next'");
  });
});

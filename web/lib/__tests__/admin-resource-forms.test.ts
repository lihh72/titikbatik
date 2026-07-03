import { describe, expect, it } from "vitest";

import { parseImportLines, parseSettingObject } from "@/lib/admin-resource-forms";

describe("admin resource form parsing", () => {
  it("trims and removes empty wordlist lines", () => {
    expect(parseImportLines(" kawung \n\n mega mendung\r\n ")).toEqual(["kawung", "mega mendung"]);
  });

  it("accepts only JSON objects for settings", () => {
    expect(parseSettingObject('{"enabled":true}')).toEqual({ enabled: true });
    expect(() => parseSettingObject("[1,2]")).toThrow("Settings harus berupa object JSON");
  });
});

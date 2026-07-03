import { describe, expect, it } from "vitest";

import { buildGenerationPayload } from "@/lib/generation-form";

describe("buildGenerationPayload", () => {
  it("creates the one-generate-one-combine-one-video payload", () => {
    expect(
      buildGenerationPayload({
        amount: 1,
        mode: "random",
        combineEnabled: true,
        videoEnabled: true,
        templateMode: "random_one",
        selectedTemplateIds: [],
        activeTemplateCount: 2,
        randomSeed: "",
        allowDuplicates: false,
      }),
    ).toEqual({
      amount: 1,
      mode: "random",
      combine_enabled: true,
      video_enabled: true,
      costume_template_mode: "random_one",
      costume_template_ids: [],
      random_seed: null,
      allow_duplicate_prompts: false,
      fixed_wordlist_items: {},
      requested_by: "web-admin",
    });
  });

  it("rejects video when more than one selected template resolves", () => {
    expect(() =>
      buildGenerationPayload({
        amount: 1,
        mode: "random",
        combineEnabled: true,
        videoEnabled: true,
        templateMode: "selected",
        selectedTemplateIds: [1, 2],
        activeTemplateCount: 2,
        randomSeed: "",
        allowDuplicates: false,
      }),
    ).toThrow("Video membutuhkan tepat satu template costume");
  });
});

import type { CostumeTemplateMode, GenerationBatchCreate, GenerationMode } from "@/lib/automation-types";

export type GenerationFormState = {
  amount: number;
  mode: GenerationMode;
  combineEnabled: boolean;
  videoEnabled: boolean;
  templateMode: CostumeTemplateMode;
  selectedTemplateIds: number[];
  activeTemplateCount: number;
  randomSeed: string;
  allowDuplicates: boolean;
  fixedWordlistItems?: Record<string, number | number[] | string | string[]>;
};

export function buildGenerationPayload(state: GenerationFormState): GenerationBatchCreate {
  if (!Number.isInteger(state.amount) || state.amount < 1 || state.amount > 500) {
    throw new Error("Jumlah generation harus antara 1 dan 500.");
  }

  const combineEnabled = state.combineEnabled || state.videoEnabled;
  const templateMode = combineEnabled ? state.templateMode : "none";
  const selectedTemplateIds = templateMode === "selected" ? state.selectedTemplateIds : [];

  if (combineEnabled && state.activeTemplateCount < 1) {
    throw new Error("Aktifkan setidaknya satu template costume sebelum combine.");
  }
  if (templateMode === "selected" && selectedTemplateIds.length < 1) {
    throw new Error("Pilih setidaknya satu template costume.");
  }
  if (state.videoEnabled) {
    const resolvedTemplateCount = templateMode === "random_one"
      ? 1
      : templateMode === "selected"
        ? selectedTemplateIds.length
        : templateMode === "all"
          ? state.activeTemplateCount
          : 0;
    if (resolvedTemplateCount !== 1) {
      throw new Error("Video membutuhkan tepat satu template costume.");
    }
  }

  const randomSeed = state.randomSeed.trim() ? Number(state.randomSeed) : null;
  if (randomSeed !== null && (!Number.isInteger(randomSeed) || randomSeed < 0)) {
    throw new Error("Random seed harus berupa bilangan bulat positif.");
  }

  return {
    amount: state.amount,
    mode: state.mode,
    combine_enabled: combineEnabled,
    video_enabled: state.videoEnabled,
    costume_template_mode: templateMode,
    costume_template_ids: selectedTemplateIds,
    random_seed: randomSeed,
    allow_duplicate_prompts: state.allowDuplicates,
    fixed_wordlist_items: state.fixedWordlistItems ?? {},
    requested_by: "web-admin",
  };
}

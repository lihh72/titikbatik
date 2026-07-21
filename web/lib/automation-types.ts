export type AutomationSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type AutomationError = {
  success: false;
  message: string;
  errors?: Record<string, unknown> | unknown[];
};

export type AutomationResponse<T> = AutomationSuccess<T> | AutomationError;

export function unwrapAutomationResponse<T>(payload: AutomationResponse<T>): T {
  if (!payload.success) {
    throw new Error(payload.message || "Permintaan backend gagal.");
  }
  return payload.data;
}

export type DashboardData = {
  total_batik: number;
  published_batik: number;
  active_batches: number;
  job_queued: number;
  job_running: number;
  job_failed: number;
  comfyui: "connected" | "disconnected";
  last_worker_heartbeat: { worker_id?: string; heartbeat_at?: string } | null;
};

export type GenerationMode = "random" | "fixed" | "mixed";
export type CostumeTemplateMode = "all" | "random_one" | "selected" | "none";

export type GenerationBatchCreate = {
  amount: number;
  mode: GenerationMode;
  combine_enabled: boolean;
  video_enabled: boolean;
  costume_template_mode: CostumeTemplateMode;
  costume_template_ids: number[];
  random_seed?: number | null;
  allow_duplicate_prompts: boolean;
  fixed_wordlist_items?: Record<string, number | number[] | string | string[]>;
  requested_by?: string | null;
};

export type GenerationBatchQueued = {
  batch_id: string;
  requested_count: number;
  status: string;
  status_url: string;
};

export type GenerationBatch = {
  id: string;
  requested_count: number;
  generate_count: number;
  combine_enabled: boolean;
  video_enabled: boolean;
  costume_template_mode: string;
  status: string;
  queued_count: number;
  running_count: number;
  completed_count: number;
  failed_count: number;
  cancelled_count: number;
  requested_by: string | null;
  settings_json: Record<string, unknown>;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  progress_percent: number;
};

export type GenerationJob = {
  id: string;
  batch_id: string;
  sequence_number: number;
  job_type: "generate" | "combine" | "video" | string;
  status: string;
  attempt_count: number;
  max_attempts: number;
  positive_prompt: string | null;
  negative_prompt: string | null;
  prompt_hash: string | null;
  seed: number | null;
  workflow_name: string;
  comfyui_prompt_id: string | null;
  source_batik_id: number | null;
  costume_template_id: number | null;
  source_costume_file_id: number | null;
  input_preview_filename: string | null;
  output_filename: string | null;
  error_message: string | null;
  available_at: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  settings_json: Record<string, unknown> | null;
};

export type CostumeTemplateMini = {
  id: number;
  name: string;
  filename: string;
};

export type CostumeFile = {
  id: number;
  filename: string;
  file_video: string | null;
  video_url: string | null;
  template_id: number | null;
  template: CostumeTemplateMini | null;
  sort_order: number;
  created_at: string;
};

export type Batik = {
  id: number;
  slug: string;
  keyword: string;
  warna: string;
  style: string;
  seed: number;
  positive_prompt: string | null;
  negative_prompt: string | null;
  file_preview: string;
  file_video: string | null;
  prompt_hash: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  preview_url: string | null;
  costume_urls: string[];
  costume_files: CostumeFile[];
};

export type Pagination = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export type PublicBatikList = {
  items: Batik[];
  pagination: Pagination;
};

export type WordlistCategory = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  is_required: boolean;
  selection_min: number;
  selection_max: number;
  sort_order: number;
  is_active: boolean;
};

export type WordlistItem = {
  id: number;
  category_id: number;
  value: string;
  label: string | null;
  weight: number;
  is_active: boolean;
  metadata_json: Record<string, unknown> | null;
};

export type CostumeTemplate = {
  id: number;
  name: string;
  filename: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type AppSettings = Record<string, Record<string, unknown>>;

export type BtxImportRequest = { limit: number };

export type BtxImportSummary = {
  requested_limit: number;
  examined: number;
  imported: number;
  skipped_duplicates: number;
  failed: number;
  errors: string[];
};

export type BtxImportJob = {
  id: number;
  status: string;
  requested_limit: number;
  examined: number;
  imported: number;
  skipped_duplicates: number;
  failed: number;
  errors: string[];
  error_message: string | null;
  attempt_count: number;
  max_attempts: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

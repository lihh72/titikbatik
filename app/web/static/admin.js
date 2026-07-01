const state = {
  key: localStorage.getItem("titikbatik_admin_key") || "",
  batches: [],
  batiks: [],
  templates: [],
  refreshTimer: null,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function headers(json = true) {
  const result = { "X-Admin-Key": state.key };
  if (json) result["Content-Type"] = "application/json";
  return result;
}

async function api(path, options = {}) {
  const response = await fetch(path, options);
  let payload = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) payload = await response.json();
  if (!response.ok) {
    const message = payload?.message || response.statusText || "Request failed";
    throw new Error(message);
  }
  return payload;
}

function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.add("is-visible");
  window.clearTimeout(node._timer);
  node._timer = window.setTimeout(() => node.classList.remove("is-visible"), 3200);
}

function setStatus(text) {
  $("#statusLine").textContent = text;
}

function selectedTemplateIds() {
  return [...$("#templateSelect").selectedOptions].map((option) => Number(option.value));
}

function numberOrNull(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  return Number(value);
}

function boolValue(value) {
  return value === true || value === "true";
}

function switchView(viewId) {
  $$(".view").forEach((view) => view.classList.toggle("is-visible", view.id === viewId));
  $$(".nav-item").forEach((item) => item.classList.toggle("is-active", item.dataset.view === viewId));
  $("#viewTitle").textContent = {
    dashboard: "Dashboard",
    generate: "Generate",
    templates: "Model Costume",
    batches: "Batch",
    results: "Hasil Batik",
  }[viewId];
}

async function loadDashboard() {
  const payload = await api("/api/admin/dashboard", { headers: headers(false) });
  const data = payload.data || {};
  $("#metricTotalBatik").textContent = data.total_batik ?? 0;
  $("#metricPublishedBatik").textContent = data.published_batik ?? 0;
  $("#metricQueued").textContent = data.job_queued ?? 0;
  $("#metricRunning").textContent = data.job_running ?? 0;
  $("#metricFailed").textContent = data.job_failed ?? 0;
  $("#metricComfyUI").textContent = data.comfyui || "-";
}

async function loadTemplates() {
  const payload = await api("/api/admin/costume-templates", { headers: headers(false) });
  state.templates = payload.data || [];
  renderTemplates();
  renderTemplateSelect();
}

function renderTemplates() {
  const grid = $("#templateGrid");
  if (!state.templates.length) {
    grid.innerHTML = "";
    return;
  }
  grid.innerHTML = state.templates
    .map(
      (template) => `
        <article class="template-card">
          <img src="/api/v1/images/template/${encodeURIComponent(template.filename)}" alt="${escapeHtml(template.name)}" />
          <div class="template-body">
            <strong>${escapeHtml(template.name)}</strong>
            <span>${escapeHtml(template.filename)}</span>
            <span class="badge ${template.is_active ? "ok" : ""}">${template.is_active ? "Aktif" : "Nonaktif"}</span>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderTemplateSelect() {
  const select = $("#templateSelect");
  const active = state.templates.filter((template) => template.is_active);
  select.innerHTML = active
    .map((template) => `<option value="${template.id}">${escapeHtml(template.name)}</option>`)
    .join("");
}

async function loadBatches() {
  const payload = await api("/api/admin/generation-batches", { headers: headers(false) });
  state.batches = payload.data || [];
  renderBatches();
}

async function loadBatiks() {
  const limit = Number($("#resultLimit")?.value || 24);
  const payload = await api(`/api/admin/batiks?limit=${limit}&offset=0`, { headers: headers(false) });
  state.batiks = payload.data || [];
  renderBatikPairs();
}

function renderBatikPairs() {
  const grid = $("#resultGrid");
  if (!state.batiks.length) {
    grid.innerHTML = `<div class="empty-state">Belum ada hasil batik.</div>`;
    return;
  }
  grid.innerHTML = state.batiks
    .map((batik) => {
      const costumes = batik.costume_files || [];
      return `
        <article class="result-card">
          <div class="result-preview">
            <img src="/api/image/${encodeURIComponent(batik.file_preview)}" alt="${escapeHtml(batik.keyword)}" />
            <div>
              <strong>${escapeHtml(batik.keyword)}</strong>
              <span>${escapeHtml(batik.warna)} · ${escapeHtml(batik.style)}</span>
              <span class="badge ${batik.is_published ? "ok" : ""}">${batik.is_published ? "Published" : "Draft"}</span>
            </div>
          </div>
          <div class="paired-costumes">
            ${renderCostumePairs(costumes, batik.id)}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderCostumePairs(costumes, batikId) {
  if (!costumes.length) {
    return `<div class="costume-empty">Costume belum tergenerate.</div>`;
  }
  return costumes
    .map((costume) => {
      const modelName = costume.template?.name || "Model tidak diketahui";
      const video = costume.file_video
        ? `<video controls muted playsinline preload="metadata" src="/api/image/${encodeURIComponent(costume.file_video)}"></video>`
        : `<div class="video-pending">Video belum tersedia.</div>`;
      return `
        <figure class="costume-pair">
          <img src="/api/image/${encodeURIComponent(costume.filename)}" alt="${escapeHtml(modelName)}" />
          ${video}
          <figcaption>
            <strong>${escapeHtml(modelName)}</strong>
            <span>${escapeHtml(costume.filename)}</span>
          </figcaption>
          ${
            costumes.length === 1
              ? `<button class="button secondary" type="button" data-regenerate-video="${batikId}">Generate Ulang Video</button>`
              : ""
          }
        </figure>
      `;
    })
    .join("");
}

function renderBatches() {
  const rows = $("#batchRows");
  if (!state.batches.length) {
    rows.innerHTML = `<tr><td colspan="8">Belum ada batch.</td></tr>`;
    return;
  }
  rows.innerHTML = state.batches
    .map((batch) => {
      const percent = Number(batch.progress_percent || 0);
      return `
        <tr>
          <td><code>${escapeHtml(batch.id)}</code></td>
          <td><span class="badge ${batch.status === "failed" ? "failed" : ""}">${escapeHtml(batch.status)}</span></td>
          <td>
            <div class="progress"><span style="width: ${Math.min(percent, 100)}%"></span></div>
            ${percent}%
          </td>
          <td>${batch.queued_count}</td>
          <td>${batch.running_count}</td>
          <td>${batch.completed_count}</td>
          <td>${batch.failed_count}</td>
          <td>
            <div class="action-row">
              <button class="button secondary" type="button" data-jobs="${batch.id}">Jobs</button>
              <button class="button secondary" type="button" data-retry="${batch.id}">Retry</button>
              <button class="button danger" type="button" data-cancel="${batch.id}">Cancel</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

async function loadJobs(batchId) {
  const payload = await api(`/api/admin/generation-batches/${batchId}/jobs`, { headers: headers(false) });
  const jobs = payload.data || [];
  $("#jobPanel").innerHTML = `
    <h3>Jobs</h3>
    <div class="job-list">
      ${jobs
        .map(
          (job) => `
          <div class="job-item">
            <span class="badge ${job.status === "failed" ? "failed" : ""}">${escapeHtml(job.status)}</span>
            <strong>${escapeHtml(job.job_type)}</strong>
            <code>${escapeHtml(job.id)}</code>
          </div>
        `,
        )
        .join("")}
    </div>
  `;
}

async function createBatch(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  let templateMode = form.get("costume_template_mode");
  const videoEnabled = boolValue(form.get("video_enabled"));
  const combineEnabled = boolValue(form.get("combine_enabled"));
  const templateIds = selectedTemplateIds();
  if (videoEnabled && !combineEnabled) {
    throw new Error("Video memerlukan combine aktif.");
  }
  if (videoEnabled && templateMode === "none") {
    throw new Error("Video memerlukan satu model costume.");
  }
  if (videoEnabled && templateMode === "selected" && templateIds.length !== 1) {
    throw new Error("Pilih tepat satu model costume untuk video.");
  }
  if (videoEnabled && templateMode === "all" && state.templates.filter((template) => template.is_active).length > 1) {
    templateMode = "random_one";
  }
  const body = {
    amount: Number(form.get("amount")),
    mode: form.get("mode"),
    combine_enabled: combineEnabled,
    video_enabled: videoEnabled,
    costume_template_mode: templateMode,
    costume_template_ids: templateMode === "selected" ? templateIds : [],
    random_seed: numberOrNull(form.get("random_seed")),
    allow_duplicate_prompts: boolValue(form.get("allow_duplicate_prompts")),
    fixed_wordlist_items: {},
  };
  const payload = await api("/api/admin/generation-batches", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  toast(payload.message || "Batch queued");
  switchView("batches");
  await refreshAll();
}

async function uploadTemplate(event) {
  event.preventDefault();
  const formElement = event.currentTarget;
  const form = new FormData(formElement);
  form.set("is_active", "true");
  const payload = await api("/api/admin/costume-templates/upload", {
    method: "POST",
    headers: { "X-Admin-Key": state.key },
    body: form,
  });
  formElement.reset();
  toast(payload.message || "Model uploaded");
  await loadTemplates();
}

async function cancelBatch(batchId) {
  const payload = await api(`/api/admin/generation-batches/${batchId}/cancel`, {
    method: "POST",
    headers: headers(false),
  });
  toast(payload.message || "Batch cancelled");
  await refreshAll();
}

async function retryBatch(batchId) {
  const payload = await api(`/api/admin/generation-batches/${batchId}/retry-failed`, {
    method: "POST",
    headers: headers(false),
  });
  toast(payload.message || "Failed jobs queued");
  await refreshAll();
}

async function regenerateVideo(batikId) {
  const payload = await api(`/api/admin/batiks/${batikId}/regenerate-video`, {
    method: "POST",
    headers: headers(false),
  });
  toast(payload.message || "Video regeneration queued");
  await refreshAll();
}

async function refreshAll() {
  if (!state.key) {
    setStatus("Masukkan Admin Key.");
    return;
  }
  try {
    await Promise.all([loadDashboard(), loadTemplates(), loadBatches(), loadBatiks()]);
    setStatus(`Tersambung. ${new Date().toLocaleTimeString("id-ID")}`);
  } catch (error) {
    setStatus(error.message);
    toast(error.message);
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function bindEvents() {
  $("#adminKey").value = state.key;
  $("#saveKey").addEventListener("click", async () => {
    state.key = $("#adminKey").value.trim();
    localStorage.setItem("titikbatik_admin_key", state.key);
    toast("Admin key tersimpan");
    await refreshAll();
  });

  $$(".nav-item").forEach((item) => {
    item.addEventListener("click", () => switchView(item.dataset.view));
  });

  $("#refreshAll").addEventListener("click", refreshAll);
  $("#refreshResults").addEventListener("click", () => loadBatiks().catch((error) => toast(error.message)));
  $("#resultLimit").addEventListener("change", () => loadBatiks().catch((error) => toast(error.message)));
  $("#reloadTemplatesFromGenerate").addEventListener("click", loadTemplates);
  $("#generateForm").addEventListener("submit", (event) => createBatch(event).catch((error) => toast(error.message)));
  $("#templateUploadForm").addEventListener("submit", (event) =>
    uploadTemplate(event).catch((error) => toast(error.message)),
  );
  $("#batchRows").addEventListener("click", (event) => {
    const target = event.target.closest("button");
    if (!target) return;
    if (target.dataset.jobs) loadJobs(target.dataset.jobs).catch((error) => toast(error.message));
    if (target.dataset.cancel) cancelBatch(target.dataset.cancel).catch((error) => toast(error.message));
    if (target.dataset.retry) retryBatch(target.dataset.retry).catch((error) => toast(error.message));
  });
  $("#resultGrid").addEventListener("click", (event) => {
    const target = event.target.closest("button[data-regenerate-video]");
    if (!target) return;
    regenerateVideo(target.dataset.regenerateVideo).catch((error) => toast(error.message));
  });
}

bindEvents();
refreshAll();
state.refreshTimer = window.setInterval(refreshAll, 10000);

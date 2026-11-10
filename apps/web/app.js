import { FIXTURES, VERDICTS, parseAcceptance, parseJob, stageStates, financialEvidence, receiptDigest, apiError } from "./state.mjs";

const $ = selector => document.querySelector(selector);
const jobs = new Map();
const lastByFixture = new Map();
const pendingKeys = new Map();
let selectedFixture = "vulnerable";
let currentId = null;
let submitting = false;

function setText(selector, value) { $(selector).textContent = value; }
function showError(message, canRetryStatus = false) {
  const alert = $("#run-alert");
  alert.textContent = message;
  alert.hidden = !message;
  $("#retry-status").hidden = !canRetryStatus;
}

function renderSubmission() {
  const fixture = FIXTURES[selectedFixture];
  for (const button of document.querySelectorAll(".fixture-option")) {
    const selected = button.dataset.fixture === selectedFixture;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  }
  setText("#claim-title", fixture.title);
  setText("#claim-description", fixture.description);
  setText("#contract-name", fixture.contract);
  setText("#oracle-name", fixture.oracle);
  setText("#expected-result", fixture.expected);
  setText("#invariant", fixture.invariant);
  $("#verify-button").disabled = submitting;
}

function renderComparison() {
  for (const fixture of ["vulnerable", "patched"]) {
    const job = jobs.get(lastByFixture.get(fixture));
    const verdict = job?.state === "finished" ? VERDICTS[job.result.status].label : job?.state === "running" ? "Running" : job?.state === "queued" ? "Queued" : "Not run";
    setText(`#compare-${fixture}`, verdict);
    setText(`#compare-${fixture}-hash`, receiptDigest(job?.result) ?? "No receipt digest");
  }
}

function renderRun() {
  const job = jobs.get(currentId);
  const fixture = job && FIXTURES[job.fixture];
  const result = job?.result;
  setText("#current-job", job ? job.id : "No job submitted");
  setText("#run-status", job ? job.state.toUpperCase() : "AWAITING SUBMISSION");
  setText("#run-summary", !job ? "Choose a reviewed fixture and press Verify PoC." : job.state === "finished"
    ? `Foundry run finished for ${fixture.name}. Inspect the verdict and private evidence below.`
    : job.state === "queued" ? "The API accepted the reviewed fixture; execution is waiting in the local queue."
      : "The worker is running the trusted Foundry oracle. Stage details are reported after completion.");
  const stages = stageStates(job);
  for (const node of document.querySelectorAll(".stage")) {
    const state = stages[Number(node.dataset.stage)];
    node.dataset.state = state;
    node.querySelector(".stage-state").textContent = ({ done: "Complete", active: "Running", failed: "Failed", unavailable: "Unavailable", pending: "Pending" })[state];
  }
  const verdict = result && VERDICTS[result.status];
  setText("#verdict", verdict?.label ?? "Awaiting run");
  $("#verdict").className = `verdict ${verdict?.tone ?? "neutral"}`;
  setText("#verdict-explanation", verdict ? `${verdict.explanation}${result.reason ? ` Worker reason: ${result.reason}.` : ""}`
    : "A verdict appears only after the API returns a finished job.");
  const numbers = financialEvidence(result);
  const metricNodes = document.querySelectorAll("#financial-metrics strong");
  [numbers?.attackerBefore, numbers?.attackerAfter, numbers?.victimShares].forEach((value, index) => {
    metricNodes[index].textContent = value ?? "Not captured";
  });
  setText("#metrics-note", numbers ? "Values returned by this job's structured execution evidence."
    : "Measured values are unavailable for this job. Inspect the trusted invariant and raw Foundry output in the private evidence JSON.");
}

function renderEvidence() {
  const job = jobs.get(currentId);
  const receipt = job?.result?.receipt;
  const fixture = job && FIXTURES[job.fixture];
  setText("#report-id", job?.id ?? "—");
  setText("#report-status", job?.state === "finished" ? VERDICTS[job.result.status].label : job?.state ?? "Awaiting run");
  setText("#report-claim", fixture?.title ?? "—");
  setText("#report-target", fixture ? `${fixture.contract} / ${job.fixture}` : "—");
  setText("#report-invariant", receipt?.invariant ? `${receipt.invariant.passed ? "Passed" : "Not passed"} / ${receipt.invariant.name}` : "Not evaluated");
  setText("#report-chain", receipt?.chain?.chainId ? `Chain ${receipt.chain.chainId}, block ${receipt.chain.forkBlock}` : "Local EVM; no fork");
  setText("#report-image", receipt?.input?.imageId ?? "Not available");
  setText("#report-input", receipt?.input?.sourceSha256 ?? "Not available");
  setText("#report-tools", receipt?.tools ? `Forge ${receipt.tools.forge} / solc ${receipt.tools.solc}` : "Not available");
  setText("#report-log", receipt?.evidence?.executionLogSha256 ?? "Not available");
  setText("#report-digest", receiptDigest(job?.result) ?? "No receipt yet");
  setText("#evidence-json", job?.state === "finished" ? JSON.stringify(job, null, 2) : "No finished evidence yet.");
  $("#copy-evidence").disabled = job?.state !== "finished";
  $("#copy-evidence").textContent = "Copy private evidence JSON";
}

function render() { renderSubmission(); renderRun(); renderEvidence(); renderComparison(); }

async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(path, { ...options, credentials: "omit", cache: "no-store",
      headers: { ...(options.headers ?? {}), Authorization: `Bearer ${$("#token").value}` } });
  } catch { throw new Error("The local API is unavailable. Start it and retry."); }
  let data;
  try { data = await response.json(); } catch { throw new Error("The API returned an unreadable response."); }
  if (!response.ok) throw new Error(apiError(response.status, data.error));
  return data;
}

async function poll(id) {
  const previous = jobs.get(id);
  if (!previous || previous.state === "finished") return;
  try {
    const data = await apiRequest(`/v1/jobs/${id}`);
    const job = parseJob(data, id, previous.fixture);
    jobs.set(id, job);
    if (id === currentId) { showError(""); render(); }
    else renderComparison();
    if (job.state !== "finished") setTimeout(() => poll(id), 2000);
  } catch (error) {
    if (id === currentId) showError(`${error.message} The job may still be running. Retry status lookup.`, true);
  }
}

async function submit() {
  if (submitting) return;
  const token = $("#token").value;
  if (!token) { showError("Enter the local API token before verifying a PoC."); $("#token").focus(); return; }
  submitting = true;
  renderSubmission();
  showError("");
  const fixture = selectedFixture;
  const key = pendingKeys.get(fixture) ?? crypto.randomUUID();
  pendingKeys.set(fixture, key);
  try {
    const accepted = parseAcceptance(await apiRequest("/v1/verify-poc", { method: "POST", headers: {
      "Content-Type": "application/json", "Idempotency-Key": key },
      body: JSON.stringify({ artifactFormat: "repo-fixture-v1", fixture }) }));
    const initial = accepted.state === "finished"
      ? parseJob(await apiRequest(`/v1/jobs/${accepted.id}`), accepted.id, fixture)
      : { id: accepted.id, kind: "verify", fixture, state: accepted.state, result: null };
    pendingKeys.delete(fixture);
    currentId = accepted.id;
    jobs.set(accepted.id, initial);
    lastByFixture.set(fixture, accepted.id);
    render();
    $("#verification").scrollIntoView({ behavior: "smooth", block: "start" });
    if (initial.state !== "finished") poll(accepted.id);
  } catch (error) {
    showError(`${error.message} Press Verify PoC to retry this fixture.`);
    $("#verification").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  finally { submitting = false; renderSubmission(); }
}

for (const button of document.querySelectorAll(".fixture-option")) button.addEventListener("click", () => {
  selectedFixture = button.dataset.fixture;
  renderSubmission();
});
$("#verify-button").addEventListener("click", submit);
$("#retry-status").addEventListener("click", () => { if (currentId) { showError(""); poll(currentId); } });
$("#copy-evidence").addEventListener("click", async () => {
  const job = jobs.get(currentId);
  if (job?.state !== "finished") return;
  try { await navigator.clipboard.writeText(JSON.stringify(job, null, 2)); $("#copy-evidence").textContent = "Copied — share only with authorized reviewers"; }
  catch { $("#copy-evidence").textContent = "Clipboard failed — copy JSON manually"; }
});

async function readIdentity() {
  try {
    const response = await fetch("/.well-known/agent-card.json", { cache: "no-store" });
    if (!response.ok) throw new Error("card unavailable");
    const card = await response.json();
    if (!card.registrations?.some(item => item.agentId === 1067)) throw new Error("card mismatch");
    setText("#identity-state", "Agent #1067 is listed in the published card. Open the registry link for a current read-only check; this session has no signed request authentication.");
  } catch { setText("#identity-state", "The published card could not be read. Registry status and request identity are unverified in this session."); }
}

render();
readIdentity();

const jobs = document.querySelector("#jobs");
const token = document.querySelector("#token");
const active = new Map();
const label = status => ({ reproduced: "Reproduced", not_reproduced: "Not reproduced",
  identified: "Static findings", analyzed_no_findings: "No static findings", tool_error: "Tool error",
  inconclusive: "Inconclusive" })[status] ?? status;
function element(name, className, value) {
  const node = document.createElement(name);
  if (className) node.className = className;
  if (value !== undefined) node.textContent = value;
  return node;
}
function render() {
  jobs.replaceChildren();
  if (!active.size) { jobs.append(element("div", "empty", "No jobs yet. Choose a fixture above to start a real local run.")); return; }
  for (const entry of [...active.values()].reverse()) {
    const card = element("article", "job panel");
    const top = element("div", "job-top");
    top.append(element("strong", "", entry.title), element("span", `pill ${entry.result?.status ?? entry.state}`, label(entry.result?.status ?? entry.state)));
    card.append(top, element("p", "job-id", `Job ${entry.id}`));
    if (entry.error) card.append(element("p", "error", entry.error));
    if (entry.result) {
      card.append(element("p", "", entry.result.reason ?? (entry.result.report ? `${entry.result.report.findings.length} normalized finding(s)` : "")));
      if (entry.result.anchor) card.append(element("p", "digest", `Receipt SHA-256  ${entry.result.anchor.receiptSha256}`));
      if (entry.result.receipt) { const details = element("details"); details.append(element("summary", "", "Receipt fields"),
        element("pre", "", JSON.stringify(entry.result.receipt, null, 2))); card.append(details); }
      if (entry.result.report?.findings) for (const finding of entry.result.report.findings.slice(0, 8)) {
        const place = finding.primaryLocation;
        card.append(element("p", "finding", `${finding.severity} · ${finding.rule} · ${place ? `${place.file}:${place.startLine ?? "?"}` : "location unavailable"}`));
      }
      if (entry.result.output) { const details = element("details"); details.append(element("summary", "", "Foundry output"), element("pre", "", entry.result.output)); card.append(details); }
      if (!entry.result.anchor && entry.kind === "verify") card.append(element("p", "note", "Receipt unavailable for this result."));
    }
    jobs.append(card);
  }
}
async function request(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { ...(options.headers ?? {}), Authorization: `Bearer ${token.value}` } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? `HTTP ${response.status}`);
  return body;
}
async function poll(entry) {
  try { Object.assign(entry, await request(`/v1/jobs/${entry.id}`)); }
  catch (error) { entry.error = error.message; }
  render();
  if (entry.state !== "finished" && !entry.error) setTimeout(() => poll(entry), 1000);
}
for (const button of document.querySelectorAll("button[data-kind]")) button.addEventListener("click", async () => {
  const kind = button.dataset.kind;
  const fixture = button.dataset.fixture;
  const title = kind === "scan" ? "Slither · reviewed vaults" : `Foundry · ${fixture} vault`;
  const entry = { id: crypto.randomUUID(), title, kind, state: "requesting" };
  active.set(entry.id, entry);
  button.disabled = true;
  render();
  try {
    const body = kind === "scan" ? { artifactFormat: "repo-fixture-v1", target: "local-vaults" }
      : { artifactFormat: "repo-fixture-v1", fixture };
    const accepted = await request(kind === "scan" ? "/v1/scan" : "/v1/verify-poc", {
      method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": entry.id }, body: JSON.stringify(body)
    });
    active.delete(entry.id);
    entry.id = accepted.id;
    entry.state = accepted.state;
    active.set(entry.id, entry);
    poll(entry);
  } catch (error) { entry.error = error.message; render(); }
  finally { button.disabled = false; }
});

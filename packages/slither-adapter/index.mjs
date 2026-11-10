import { createHash } from "node:crypto";

const hash = value => createHash("sha256").update(value).digest("hex");
const text = value => typeof value === "string" ? value : "";
const integer = value => Number.isSafeInteger(value) && value >= 0 ? value : null;

function location(element) {
  const map = element?.source_mapping;
  if (!map || typeof map !== "object") return null;
  const file = text(map.filename_relative).replaceAll("\\", "/");
  if (!file || file.startsWith("/") || file.split("/").includes("..")) return null;
  const lines = Array.isArray(map.lines) ? map.lines.filter(n => Number.isSafeInteger(n) && n > 0) : [];
  return { file, startLine: lines[0] ?? null, endLine: lines.at(-1) ?? null,
    startByte: integer(map.start), lengthBytes: integer(map.length) };
}

export function parseCallGraph(dot = "") {
  if (typeof dot !== "string") throw new Error("call graph must be DOT text");
  const edges = new Map();
  for (const line of dot.split(/\r?\n/)) {
    const match = line.match(/^\s*"([^"\r\n]+)"\s*->\s*"([^"\r\n]+)"/);
    if (match) edges.set(`${match[1]}\0${match[2]}`, { from: match[1], to: match[2] });
  }
  return [...edges.values()].sort((a, b) => (a.from + a.to).localeCompare(b.from + b.to));
}

export function normalizeSlither(raw, { version, sourceHash, callGraph = "" } = {}) {
  const results = raw?.results;
  if (raw?.success !== true || !results || typeof results !== "object" || Array.isArray(results)
    || (results.detectors !== undefined && !Array.isArray(results.detectors))) {
    throw new Error("invalid successful Slither JSON results");
  }
  if (!version || !/^0\.11\.6(?:\b|$)/.test(version)) throw new Error("unexpected Slither version");
  if (!/^[a-f0-9]{64}$/.test(sourceHash ?? "")) throw new Error("source SHA-256 required");
  const findings = new Map();
  for (const detector of results.detectors ?? []) {
    const rule = text(detector?.check);
    if (!rule) throw new Error("detector missing rule");
    const locations = (Array.isArray(detector.elements) ? detector.elements : [])
      .map(location).filter(Boolean);
    const primary = locations[0] ?? null;
    const key = JSON.stringify([sourceHash, rule, primary?.file ?? "", primary?.startByte ?? -1,
      primary?.lengthBytes ?? -1]);
    const finding = { findingId: `slither:${hash(key)}`, tool: "slither", rule,
      severity: text(detector.impact) || "Unknown", confidence: text(detector.confidence) || "Unknown",
      description: text(detector.description), primaryLocation: primary, locations,
      provenance: { version, sourceHash, originalId: text(detector.id) || null } };
    if (!findings.has(finding.findingId)) findings.set(finding.findingId, finding);
  }
  return { status: "analyzed", tool: "slither", version, sourceHash,
    findings: [...findings.values()].sort((a, b) => a.findingId.localeCompare(b.findingId)),
    callGraph: { format: "dot-edges", edges: parseCallGraph(callGraph), sha256: hash(callGraph) } };
}

export function classifyFailure({ timedOut = false, stderr = "", exitCode = null } = {}) {
  const message = timedOut ? "Slither timed out" : /compil|solc|forge/i.test(stderr)
    ? "Compilation failed" : "Slither failed";
  return { status: "tool_error", tool: "slither", error: {
    code: timedOut ? "timeout" : message === "Compilation failed" ? "compile_error" : "tool_error",
    message, exitCode } };
}

import { backendOrigin } from "@/lib/backend-url";

type Context = { params: Promise<{ segments: string[] }> };
const jobId = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const noStore = { "cache-control": "no-store", "x-content-type-options": "nosniff" };
const error = (status: number, message: string) => Response.json({ error: message }, { status, headers: noStore });

async function forward(request: Request, context: Context, method: "GET" | "POST") {
  const { segments } = await context.params;
  const path = method === "POST" && segments.length === 1 && segments[0] === "verify-poc" ? "/v1/verify-poc"
    : method === "GET" && segments.length === 2 && segments[0] === "jobs" && jobId.test(segments[1]) ? `/v1/jobs/${segments[1]}`
    : segments[0] === "auth" && (
      (method === "GET" && segments.length === 2 && segments[1] === "me")
      || (method === "POST" && segments.length === 2 && (segments[1] === "role" || segments[1] === "logout"))
      || (method === "POST" && segments.length === 3 && segments[1] === "concordium" && (segments[2] === "challenge" || segments[2] === "verify"))
    ) ? `/v1/${segments.join("/")}`
    : segments[0] === "programs" && (
      (method === "POST" && segments.length === 1)
      || (method === "POST" && segments.length === 2 && segments[1] === "agent-setup")
      || (method === "GET" && segments.length === 2 && ["mine", "invited", "public"].includes(segments[1]))
      || (segments.length >= 2 && jobId.test(segments[1]) && (
        (method === "GET" && (segments.length === 2 || (segments.length === 3 && ["submissions", "jobs"].includes(segments[2]))))
        || (method === "POST" && segments.length === 3 && ["invitations", "status"].includes(segments[2]))
      ))
    ) ? `/v1/${segments.join("/")}`
    : segments[0] === "programs" && segments[1] === "demo-vault" && (
      (method === "GET" && segments.length === 2)
      || (method === "GET" && segments.length === 3 && segments[2] === "submissions")
      || (method === "POST" && segments.length === 3 && segments[2] === "submissions")
      || (method === "GET" && segments.length === 4 && segments[2] === "jobs" && jobId.test(segments[3]))
      || (method === "POST" && segments.length === 5 && segments[2] === "submissions" && jobId.test(segments[3]) && segments[4] === "jobs")
    ) ? `/v1/${segments.join("/")}` : null;
  if (!path) return error(404, "not found");

  let origin: URL | null;
  try { origin = backendOrigin(process.env.AUDITOR_API_ORIGIN, process.env.NODE_ENV === "production"); }
  catch { return error(503, "verification API origin is invalid"); }
  if (!origin) return error(503, "verification API is not configured");

  const headers = new Headers();
  for (const name of ["authorization", "content-type", "idempotency-key", "cookie", "origin", "x-auditor-csrf"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const requestIsHttps = request.url.startsWith("https://") || request.headers.get("x-forwarded-proto") === "https";
  if (requestIsHttps) headers.set("x-forwarded-proto", "https");
  let body: ArrayBuffer | undefined;
  if (method === "POST") {
    const reader = request.body?.getReader();
    if (!reader) {
      if (path !== "/v1/auth/logout") return error(400, "JSON body required");
    } else {
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > (path === "/v1/programs" ? 16_384 : path === "/v1/programs/agent-setup" ? 12_000 : 4096)) { await reader.cancel(); return error(413, "request too large"); }
        chunks.push(value);
      }
      const buffer = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.byteLength; }
      body = buffer.buffer;
    }
  }
  try {
    const response = await fetch(new URL(path, origin), { method, headers, body, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10_000) });
    const responseHeaders = new Headers({ ...noStore, "content-type": "application/json; charset=utf-8" });
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) responseHeaders.set("set-cookie", setCookie);
    return new Response(await response.text(), { status: response.status, headers: responseHeaders });
  } catch { return error(502, "verification API is unavailable"); }
}

export function GET(request: Request, context: Context) { return forward(request, context, "GET"); }
export function POST(request: Request, context: Context) { return forward(request, context, "POST"); }

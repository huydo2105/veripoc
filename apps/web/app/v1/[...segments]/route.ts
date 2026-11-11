import { backendOrigin } from "@/lib/backend-url";

type Context = { params: Promise<{ segments: string[] }> };
const jobId = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const noStore = { "cache-control": "no-store", "x-content-type-options": "nosniff" };
const error = (status: number, message: string) => Response.json({ error: message }, { status, headers: noStore });

async function forward(request: Request, context: Context, method: "GET" | "POST") {
  const { segments } = await context.params;
  const path = method === "POST" && segments.length === 1 && segments[0] === "verify-poc" ? "/v1/verify-poc"
    : method === "GET" && segments.length === 2 && segments[0] === "jobs" && jobId.test(segments[1]) ? `/v1/jobs/${segments[1]}` : null;
  if (!path) return error(404, "not found");

  let origin: URL | null;
  try { origin = backendOrigin(process.env.VERIPOC_API_ORIGIN, process.env.NODE_ENV === "production"); }
  catch { return error(503, "verification API origin is invalid"); }
  if (!origin) return error(503, "verification API is not configured");

  const headers = new Headers();
  for (const name of ["authorization", "content-type", "idempotency-key"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  let body: ArrayBuffer | undefined;
  if (method === "POST") {
    const reader = request.body?.getReader();
    if (!reader) return error(400, "JSON body required");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) { await reader.cancel(); return error(413, "request too large"); }
      chunks.push(value);
    }
    const buffer = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.byteLength; }
    body = buffer.buffer;
  }
  try {
    const response = await fetch(new URL(path, origin), { method, headers, body, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10_000) });
    return new Response(await response.text(), { status: response.status, headers: { ...noStore, "content-type": "application/json; charset=utf-8" } });
  } catch { return error(502, "verification API is unavailable"); }
}

export function GET(request: Request, context: Context) { return forward(request, context, "GET"); }
export function POST(request: Request, context: Context) { return forward(request, context, "POST"); }

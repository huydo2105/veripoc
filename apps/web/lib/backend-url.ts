export function backendOrigin(raw: string | undefined, production: boolean): URL | null {
  if (!raw) return production ? null : new URL("http://127.0.0.1:8787");
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("VERIPOC_API_ORIGIN is not a valid URL"); }
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash)
    throw new Error("VERIPOC_API_ORIGIN must be an origin without credentials or a path");
  if (production && url.protocol !== "https:") throw new Error("Production verification API must use HTTPS");
  if (!production && url.protocol !== "https:" && !(url.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)))
    throw new Error("HTTP verification API is allowed only on local loopback");
  return url;
}

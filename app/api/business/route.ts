import { businessDatabase } from "@/db/business";
import { applyBusinessCommand, BusinessError, createBusiness } from "@/lib/business";
import type { BusinessWorkspaceData } from "@/lib/business";

const COOKIE = "cbl_workspace";
const headers = { "Cache-Control": "no-store", "Vary": "Cookie" };
async function identity(request: Request) {
  const existing = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  const valid = existing && /^[a-f0-9]{64}$/.test(existing);
  const token = valid ? existing : Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, "0")).join("");
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))), (b) => b.toString(16).padStart(2, "0")).join("");
  return { hash, valid: Boolean(valid), cookie: `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000${new URL(request.url).protocol === "https:" ? "; Secure" : ""}` };
}
function failure(error: unknown) {
  if (error instanceof BusinessError) return Response.json({ error: error.code }, { status: error.code === "conflict" ? 409 : 400, headers });
  return Response.json({ error: "storage_unavailable" }, { status: 503, headers });
}
export async function GET(request: Request) {
  try {
    const owner = await identity(request);
    const row = await businessDatabase().prepare("SELECT payload FROM business_workspaces WHERE owner_hash = ?").bind(owner.hash).first<{ payload: string }>();
    return Response.json({ business: row ? JSON.parse(row.payload) : null }, { headers: { ...headers, "Set-Cookie": owner.cookie } });
  } catch (error) { return failure(error); }
}
async function mutate(request: Request) {
  try {
    if (request.headers.get("origin") !== new URL(request.url).origin || request.headers.get("sec-fetch-site") === "cross-site") return Response.json({ error: "origin_denied" }, { status: 403, headers });
    if (!request.headers.get("content-type")?.startsWith("application/json")) throw new BusinessError("invalid_input");
    const reader = request.body?.getReader();
    if (!reader) throw new BusinessError("invalid_input");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 16_384) { await reader.cancel(); throw new BusinessError("invalid_input"); }
      chunks.push(value);
    }
    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
    const text = new TextDecoder().decode(body);
    let input: Record<string, unknown>;
    try { input = JSON.parse(text); } catch { throw new BusinessError("invalid_input"); }
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new BusinessError("invalid_input");
    const owner = await identity(request);
    if (!owner.valid) return Response.json({ error: "session_required" }, { status: 401, headers });
    const db = businessDatabase();
    const row = await db.prepare("SELECT payload FROM business_workspaces WHERE owner_hash = ?").bind(owner.hash).first<{ payload: string }>();
    let business: BusinessWorkspaceData;
    if (request.method === "POST") {
      if (row) throw new BusinessError("conflict");
      business = createBusiness(input);
      const result = await db.prepare("INSERT OR IGNORE INTO business_workspaces (owner_hash, id, revision, payload, updated_at) VALUES (?, ?, ?, ?, ?)").bind(owner.hash, business.id, business.revision, JSON.stringify(business), business.updatedAt).run();
      if (!result.meta.changes) throw new BusinessError("conflict");
    } else {
      if (!row) return Response.json({ error: "not_found" }, { status: 404, headers });
      const current = JSON.parse(row.payload) as BusinessWorkspaceData;
      if (input.businessId !== current.id) throw new BusinessError("conflict");
      if (request.method === "DELETE") {
        if (input.confirmed !== true || input.revision !== current.revision) throw new BusinessError("conflict");
        const result = await db.prepare("DELETE FROM business_workspaces WHERE owner_hash = ? AND id = ? AND revision = ?").bind(owner.hash, current.id, input.revision).run();
        if (!result.meta.changes) throw new BusinessError("conflict");
        return Response.json({ business: null }, { headers });
      }
      business = applyBusinessCommand(current, input);
      const result = await db.prepare("UPDATE business_workspaces SET revision = ?, payload = ?, updated_at = ? WHERE owner_hash = ? AND id = ? AND revision = ?").bind(business.revision, JSON.stringify(business), business.updatedAt, owner.hash, current.id, current.revision).run();
      if (!result.meta.changes) throw new BusinessError("conflict");
    }
    return Response.json({ business }, { status: request.method === "POST" ? 201 : 200, headers });
  } catch (error) { return failure(error); }
}
export const POST = mutate;
export const PATCH = mutate;
export const DELETE = mutate;

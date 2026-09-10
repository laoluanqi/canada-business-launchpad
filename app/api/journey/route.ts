import { businessDatabase } from "@/db/business";
import { applyLaunchCommand, emptyLaunchJourney, JourneyError } from "@/lib/launchpad-progress";
import type { LaunchJourney } from "@/lib/launchpad-progress";

const COOKIE = "cbl_journey";
const HEADERS = { "Cache-Control": "no-store", Vary: "Cookie" };
async function identity(request: Request) {
  const value = request.headers.get("cookie")?.split(";").map(item => item.trim()).find(item => item.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  const valid = typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
  const token = valid ? value : Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, "0")).join("");
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))), n => n.toString(16).padStart(2, "0")).join("");
  return { valid, hash, cookie: `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000${new URL(request.url).protocol === "https:" ? "; Secure" : ""}` };
}
function failure(error: unknown) {
  const code = error instanceof JourneyError ? error.message : "storage_unavailable";
  return Response.json({ error: code }, { status: code === "conflict" ? 409 : code === "storage_unavailable" ? 503 : 400, headers: HEADERS });
}
export async function GET(request: Request) {
  try {
    const owner = await identity(request);
    const row = await businessDatabase().prepare("SELECT payload FROM launch_journeys WHERE owner_hash = ?").bind(owner.hash).first<{ payload: string }>();
    return Response.json({ journey: row ? JSON.parse(row.payload) : null }, { headers: { ...HEADERS, "Set-Cookie": owner.cookie } });
  } catch (error) { return failure(error); }
}
export async function PATCH(request: Request) {
  try {
    if (request.headers.get("origin") !== new URL(request.url).origin || request.headers.get("sec-fetch-site") === "cross-site") return Response.json({ error: "origin_denied" }, { status: 403, headers: HEADERS });
    if (!request.headers.get("content-type")?.startsWith("application/json")) throw new JourneyError("invalid_input");
    const owner = await identity(request);
    if (!owner.valid) return Response.json({ error: "session_required" }, { status: 401, headers: HEADERS });
    const reader = request.body?.getReader();
    if (!reader) throw new JourneyError("invalid_input");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 4096) { await reader.cancel(); throw new JourneyError("invalid_input"); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    let input: Record<string, unknown>;
    try { input = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new JourneyError("invalid_input"); }
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new JourneyError("invalid_input");
    const db = businessDatabase();
    const row = await db.prepare("SELECT payload FROM launch_journeys WHERE owner_hash = ?").bind(owner.hash).first<{ payload: string }>();
    const current: LaunchJourney = row ? JSON.parse(row.payload) : emptyLaunchJourney();
    const journey = applyLaunchCommand(current, input);
    if (!row) {
      journey.id = crypto.randomUUID();
      const inserted = await db.prepare("INSERT OR IGNORE INTO launch_journeys (owner_hash, id, revision, payload, updated_at) VALUES (?, ?, ?, ?, ?)").bind(owner.hash, journey.id, journey.revision, JSON.stringify(journey), journey.updatedAt).run();
      if (!inserted.meta.changes) throw new JourneyError("conflict");
    } else {
      const updated = await db.prepare("UPDATE launch_journeys SET revision = ?, payload = ?, updated_at = ? WHERE owner_hash = ? AND id = ? AND revision = ?").bind(journey.revision, JSON.stringify(journey), journey.updatedAt, owner.hash, current.id, current.revision).run();
      if (!updated.meta.changes) throw new JourneyError("conflict");
    }
    return Response.json({ journey }, { headers: HEADERS });
  } catch (error) { return failure(error); }
}

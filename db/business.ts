import { env } from "cloudflare:workers";

export function businessDatabase(): D1Database {
  if (!env.DB) throw new Error("Business storage unavailable");
  return env.DB;
}

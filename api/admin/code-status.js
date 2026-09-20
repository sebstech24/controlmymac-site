import { inventoryCounts, pendingBatches } from "../_lib/database.js";

export async function GET(request) {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
  const [inventory, generating] = await Promise.all([inventoryCounts(), pendingBatches()]);
  return new Response(JSON.stringify({ ok: true, inventory, generating }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

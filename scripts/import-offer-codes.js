import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { importCodeRows, upsertBatch } from "../api/_lib/database.js";
import { parseOfferCodeCsv, prepareCodeRows } from "../api/_lib/apple-offers.js";

const [file, batchId, expiresAt, source = "sandbox"] = process.argv.slice(2);
if (!file || !batchId || !expiresAt) {
  console.error("Usage: npm run codes:import -- <apple.csv> <batch-id> <ISO-expiry> [sandbox|manual]");
  process.exitCode = 1;
} else {
  const csv = await readFile(file, "utf8");
  const values = parseOfferCodeCsv(csv);
  if (!values.length) throw new Error("No offer codes found in the Apple CSV");
  await upsertBatch({
    id: batchId,
    source,
    environment: source === "sandbox" ? "SANDBOX" : "PRODUCTION",
    expectedCount: values.length,
    expiresAt,
    state: "generating",
  });
  const rows = prepareCodeRows(
    values,
    expiresAt,
    process.env.CODE_ENCRYPTION_KEY,
    process.env.EMAIL_HASH_SECRET,
  );
  const inserted = await importCodeRows(batchId, rows);
  console.log(`Imported ${inserted} codes from ${basename(file)} into batch ${batchId}.`);
}

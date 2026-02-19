import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const specPath = resolve(process.cwd(), "docs/api/openapi-agent.json");
const schemaPath = resolve(
  process.cwd(),
  "src/shared/lib/agent/ingestion-schema.ts",
);

const spec = readFileSync(specPath, "utf8");
const schema = readFileSync(schemaPath, "utf8");

const requiredContractMarkers = [
  "/agent/products/upsert",
  "/agent/products/publish",
  "/agent/moderation/resolve",
  "/agent/signals/submit",
];

for (const marker of requiredContractMarkers) {
  if (!spec.includes(marker)) {
    console.error(`OpenAPI spec missing endpoint marker: ${marker}`);
    process.exit(1);
  }
}

const requiredSchemaMarkers = [
  "AgentProductUpsertInputSchema",
  "AgentProductPublishInputSchema",
  "AgentModerationResolveInputSchema",
  "AgentSignalSubmissionInputSchema",
];

for (const marker of requiredSchemaMarkers) {
  if (!schema.includes(marker)) {
    console.error(`Ingestion schema missing marker: ${marker}`);
    process.exit(1);
  }
}

console.log("API contract drift checks passed.");

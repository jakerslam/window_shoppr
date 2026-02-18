import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const specPath = resolve(process.cwd(), "docs/api/openapi-agent.json");
const spec = JSON.parse(readFileSync(specPath, "utf8"));

const EXPECTED_PATHS = [
  "/api/agent/products/upsert",
  "/api/agent/products/publish",
  "/api/agent/moderation/resolve",
  "/api/agent/signals/submit",
];

const EXPECTED_PUBLISH_STATES = ["draft", "published", "unpublished"];
const EXPECTED_MODERATION_STATUSES = ["triaged", "resolved", "dismissed"];
const EXPECTED_SIGNAL_SOURCES = [
  "slickdeals_rss",
  "manual_competitor_signal",
  "other_signal",
];

/**
 * Validate baseline OpenAPI document shape for agent ingestion contracts.
 */
test("agent OpenAPI spec exists with required endpoint contracts", () => {
  assert.equal(spec.openapi, "3.1.0");
  assert.equal(typeof spec.info?.title, "string");
  assert.equal(typeof spec.paths, "object");

  EXPECTED_PATHS.forEach((path) => {
    assert.ok(spec.paths[path], `missing path: ${path}`);
    assert.ok(spec.paths[path].post, `missing POST operation for ${path}`);

    const requestSchemaRef = spec.paths[path].post.requestBody?.content?.["application/json"]?.schema?.$ref;
    assert.ok(requestSchemaRef, `missing request schema for ${path}`);

    const responseSchemaRef = spec.paths[path].post.responses?.["200"]?.content?.["application/json"]?.schema?.$ref;
    assert.equal(
      responseSchemaRef,
      "#/components/schemas/AgentAcknowledgeResponse",
      `unexpected success response schema for ${path}`,
    );
  });
});

/**
 * Validate enum-based contracts against ingestion/moderation source-of-truth values.
 */
test("agent OpenAPI enums match ingestion schema contract values", () => {
  const publishEnum =
    spec.components.schemas.AgentProductPublishInput.properties.publishState.enum;
  assert.deepEqual(publishEnum, EXPECTED_PUBLISH_STATES);

  const moderationEnum =
    spec.components.schemas.AgentModerationResolveInput.properties.status.enum;
  assert.deepEqual(moderationEnum, EXPECTED_MODERATION_STATUSES);

  const signalEnum =
    spec.components.schemas.AgentSignalSubmissionInput.properties.source.enum;
  assert.deepEqual(signalEnum, EXPECTED_SIGNAL_SOURCES);
});

/**
 * Validate security and required-key discipline for contract consumers.
 */
test("agent OpenAPI defines API key security and required schema keys", () => {
  const securityScheme = spec.components.securitySchemes.AgentKey;
  assert.deepEqual(securityScheme, {
    type: "apiKey",
    in: "header",
    name: "x-agent-key",
  });

  const ackRequired = spec.components.schemas.AgentAcknowledgeResponse.required;
  assert.deepEqual(ackRequired, ["ok", "id", "idempotencyKey", "acceptedAt"]);

  const upsertRequired = spec.components.schemas.AgentProductUpsertInput.required;
  assert.deepEqual(upsertRequired, ["product"]);
});

import { z } from "zod";
import { ProductSchema } from "@/shared/lib/catalog/schema";

/**
 * Shared publish state enum for agent ingestion operations.
 */
export const AGENT_PUBLISH_STATE_SCHEMA = z.enum([
  "draft",
  "published",
  "unpublished",
]);

/**
 * Auth header contract for agent operations.
 */
export const AGENT_AUTH_INPUT_SCHEMA = z.object({
  agentKey: z.string().trim().min(1),
});

/**
 * Product upsert payload contract for agent ingestion.
 */
export const AGENT_PRODUCT_UPSERT_INPUT_SCHEMA = z.object({
  product: ProductSchema,
  dryRun: z.boolean().optional(),
});

/**
 * Publish-state mutation payload contract for existing products.
 */
export const AGENT_PRODUCT_PUBLISH_INPUT_SCHEMA = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  publishState: AGENT_PUBLISH_STATE_SCHEMA,
});

/**
 * Moderation resolution payload contract for report queue items.
 */
export const AGENT_MODERATION_RESOLVE_INPUT_SCHEMA = z.object({
  queueItemId: z.string().trim().min(1),
  status: z.enum(["triaged", "resolved", "dismissed"]),
  reviewNotes: z.string().trim().min(1).optional(),
});

export type AgentAuthInput = z.infer<typeof AGENT_AUTH_INPUT_SCHEMA>;
export type AgentProductUpsertInput = z.infer<
  typeof AGENT_PRODUCT_UPSERT_INPUT_SCHEMA
>;
export type AgentProductPublishInput = z.infer<
  typeof AGENT_PRODUCT_PUBLISH_INPUT_SCHEMA
>;
export type AgentModerationResolveInput = z.infer<
  typeof AGENT_MODERATION_RESOLVE_INPUT_SCHEMA
>;

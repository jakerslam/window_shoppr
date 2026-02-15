import { z } from "zod";
import { buildProductIdempotencyKey } from "@/shared/lib/catalog/products";
import {
  AGENT_AUTH_INPUT_SCHEMA,
  AGENT_MODERATION_RESOLVE_INPUT_SCHEMA,
  AGENT_PRODUCT_PUBLISH_INPUT_SCHEMA,
  AGENT_PRODUCT_UPSERT_INPUT_SCHEMA,
  AgentAuthInput,
  AgentModerationResolveInput,
  AgentProductPublishInput,
  AgentProductUpsertInput,
} from "@/shared/lib/agent/ingestion-schema";

type AgentQueueRecord<TAction extends string, TPayload> = {
  id: string;
  action: TAction;
  payload: TPayload;
  idempotencyKey: string;
  receivedAt: string;
};

type AgentAcknowledgeResponse = {
  ok: true;
  id: string;
  idempotencyKey: string;
  acceptedAt: string;
};

const AGENT_UPSERT_QUEUE_KEY = "window_shoppr_agent_upsert_queue"; // Local stub queue for upsert operations.
const AGENT_PUBLISH_QUEUE_KEY = "window_shoppr_agent_publish_queue"; // Local stub queue for publish-state operations.
const AGENT_MODERATION_QUEUE_KEY = "window_shoppr_agent_moderation_queue"; // Local stub queue for moderation resolve operations.
const MAX_QUEUE_SIZE = 500; // Prevent unbounded queue growth in local storage.

const readQueue = <T>(key: string): T[] => {
  if (typeof window === "undefined") {
    return []; // Skip storage reads during SSR and static export builds.
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

const writeQueue = (key: string, queue: unknown[]) => {
  if (typeof window === "undefined") {
    return; // Skip storage writes during SSR and static export builds.
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(queue.slice(-MAX_QUEUE_SIZE)));
  } catch {
    // Ignore storage failures to keep caller flows non-blocking.
  }
};

export const validateAgentAuth = (input: AgentAuthInput) => {
  const parsed = AGENT_AUTH_INPUT_SCHEMA.parse(input);
  const configuredKey = process.env.AGENT_API_KEY?.trim();

  if (!configuredKey) {
    return {
      ok: true,
      mode: "open_stub",
    } as const; // Keep stub endpoints usable locally when no key is configured.
  }

  if (parsed.agentKey !== configuredKey) {
    throw new z.ZodError([
      {
        code: "custom",
        message: "Invalid agent key",
        path: ["agentKey"],
      },
    ]);
  }

  return {
    ok: true,
    mode: "enforced",
  } as const;
};

export const queueAgentProductUpsert = ({
  auth,
  input,
}: {
  auth: AgentAuthInput;
  input: AgentProductUpsertInput;
}): AgentAcknowledgeResponse => {
  validateAgentAuth(auth);
  const parsed = AGENT_PRODUCT_UPSERT_INPUT_SCHEMA.parse(input);
  const receivedAt = new Date().toISOString();
  const id = `aup_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const idempotencyKey = buildProductIdempotencyKey(parsed.product);
  const record: AgentQueueRecord<"product_upsert", AgentProductUpsertInput> = {
    id,
    action: "product_upsert",
    payload: parsed,
    idempotencyKey,
    receivedAt,
  };
  const queue = readQueue<typeof record>(AGENT_UPSERT_QUEUE_KEY);
  writeQueue(AGENT_UPSERT_QUEUE_KEY, [...queue, record]);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("agent:product:upsert", { detail: record }));
  }

  return {
    ok: true,
    id,
    idempotencyKey,
    acceptedAt: receivedAt,
  };
};

export const queueAgentPublishMutation = ({
  auth,
  input,
}: {
  auth: AgentAuthInput;
  input: AgentProductPublishInput;
}): AgentAcknowledgeResponse => {
  validateAgentAuth(auth);
  const parsed = AGENT_PRODUCT_PUBLISH_INPUT_SCHEMA.parse(input);
  const receivedAt = new Date().toISOString();
  const id = `apm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const idempotencyKey = `publish:${parsed.slug}`;
  const record: AgentQueueRecord<"product_publish", AgentProductPublishInput> = {
    id,
    action: "product_publish",
    payload: parsed,
    idempotencyKey,
    receivedAt,
  };
  const queue = readQueue<typeof record>(AGENT_PUBLISH_QUEUE_KEY);
  writeQueue(AGENT_PUBLISH_QUEUE_KEY, [...queue, record]);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("agent:product:publish", { detail: record }));
  }

  return {
    ok: true,
    id,
    idempotencyKey,
    acceptedAt: receivedAt,
  };
};

export const queueAgentModerationResolution = ({
  auth,
  input,
}: {
  auth: AgentAuthInput;
  input: AgentModerationResolveInput;
}): AgentAcknowledgeResponse => {
  validateAgentAuth(auth);
  const parsed = AGENT_MODERATION_RESOLVE_INPUT_SCHEMA.parse(input);
  const receivedAt = new Date().toISOString();
  const id = `amr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const idempotencyKey = `moderation:${parsed.queueItemId}:${parsed.status}`;
  const record: AgentQueueRecord<
    "moderation_resolve",
    AgentModerationResolveInput
  > = {
    id,
    action: "moderation_resolve",
    payload: parsed,
    idempotencyKey,
    receivedAt,
  };
  const queue = readQueue<typeof record>(AGENT_MODERATION_QUEUE_KEY);
  writeQueue(AGENT_MODERATION_QUEUE_KEY, [...queue, record]);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("agent:moderation:resolve", { detail: record }),
    );
  }

  return {
    ok: true,
    id,
    idempotencyKey,
    acceptedAt: receivedAt,
  };
};

export const readAgentStubQueues = () => ({
  upserts: readQueue<AgentQueueRecord<"product_upsert", AgentProductUpsertInput>>(
    AGENT_UPSERT_QUEUE_KEY,
  ),
  publishMutations: readQueue<
    AgentQueueRecord<"product_publish", AgentProductPublishInput>
  >(AGENT_PUBLISH_QUEUE_KEY),
  moderationResolutions: readQueue<
    AgentQueueRecord<"moderation_resolve", AgentModerationResolveInput>
  >(AGENT_MODERATION_QUEUE_KEY),
});

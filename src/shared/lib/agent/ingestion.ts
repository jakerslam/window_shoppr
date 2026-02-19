import { z } from "zod";
import { buildProductIdempotencyKey } from "@/shared/lib/catalog/products";
import {
  AGENT_MODERATION_RESOLVE_INPUT_SCHEMA,
  AGENT_PRODUCT_PUBLISH_INPUT_SCHEMA,
  AGENT_SIGNAL_SUBMISSION_INPUT_SCHEMA,
  AGENT_PRODUCT_UPSERT_INPUT_SCHEMA,
  AgentAuthInput,
  AgentModerationResolveInput,
  AgentProductPublishInput,
  AgentSignalSubmissionInput,
  AgentProductUpsertInput,
} from "@/shared/lib/agent/ingestion-schema";
import {
  normalizeHttpUrl,
  resolveMerchantUrlFromSignal,
} from "@/shared/lib/agent/signal-utils";
import { validateAgentAuth } from "@/shared/lib/agent/ingestion-auth";
import {
  AGENT_MODERATION_QUEUE_KEY,
  AGENT_PUBLISH_QUEUE_KEY,
  AGENT_SIGNAL_QUEUE_KEY,
  AGENT_UPSERT_QUEUE_KEY,
  AgentQueueRecord,
  createQueueId,
  readQueue,
  writeQueue,
} from "@/shared/lib/agent/ingestion-storage";
import { buildAffiliateMintQueueSnapshot } from "@/shared/lib/engagement/affiliate-minting";
import { logPrivilegedAuditEvent } from "@/shared/lib/platform/auth/audit-log";
import { readAuthSession } from "@/shared/lib/platform/auth-session";

type AgentAcknowledgeResponse = {
  ok: true;
  id: string;
  idempotencyKey: string;
  acceptedAt: string;
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
  const id = createQueueId("aup");
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
  void logPrivilegedAuditEvent({
    action: "agent.queue.product_upsert",
    status: "allowed",
    session: readAuthSession(),
    metadata: { id, idempotencyKey },
  });

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
  const id = createQueueId("apm");
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
  void logPrivilegedAuditEvent({
    action: "agent.queue.product_publish",
    status: "allowed",
    session: readAuthSession(),
    metadata: { id, idempotencyKey },
  });

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
  const id = createQueueId("amr");
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
  void logPrivilegedAuditEvent({
    action: "agent.queue.moderation_resolve",
    status: "allowed",
    session: readAuthSession(),
    metadata: { id, idempotencyKey },
  });

  return {
    ok: true,
    id,
    idempotencyKey,
    acceptedAt: receivedAt,
  };
};

/**
 * Queue a competitor/source signal for merchant verification and no-copy enrichment.
 */
export const queueAgentSignalSubmission = ({
  auth,
  input,
}: {
  auth: AgentAuthInput;
  input: AgentSignalSubmissionInput;
}): AgentAcknowledgeResponse => {
  validateAgentAuth(auth);
  const parsed = AGENT_SIGNAL_SUBMISSION_INPUT_SCHEMA.parse(input);
  const signalUrl = normalizeHttpUrl(parsed.signalUrl);

  if (!signalUrl) {
    throw new z.ZodError([
      {
        code: "custom",
        message: "Signal URL must use http or https.",
        path: ["signalUrl"],
      },
    ]);
  }

  const merchantUrl = resolveMerchantUrlFromSignal({
    signalUrl,
    merchantUrl: parsed.merchantUrl,
  });

  if (!merchantUrl) {
    throw new z.ZodError([
      {
        code: "custom",
        message: "Merchant URL is required or must be extractable from the signal URL.",
        path: ["merchantUrl"],
      },
    ]);
  }

  const receivedAt = new Date().toISOString();
  const id = createQueueId("asg");
  const idempotencyKey = `signal:${parsed.source}:${merchantUrl}`;
  const record: AgentQueueRecord<
    "signal_submission",
    AgentSignalSubmissionInput & {
      signalUrl: string;
      merchantUrl: string;
      complianceMode: "signal_only_no_copy";
    }
  > = {
    id,
    action: "signal_submission",
    payload: {
      ...parsed,
      signalUrl,
      merchantUrl,
      complianceMode: "signal_only_no_copy",
    },
    idempotencyKey,
    receivedAt,
  };
  const queue = readQueue<typeof record>(AGENT_SIGNAL_QUEUE_KEY);
  writeQueue(AGENT_SIGNAL_QUEUE_KEY, [...queue, record]);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("agent:signal:enqueue", { detail: record }));
  }
  void logPrivilegedAuditEvent({
    action: "agent.queue.signal_submission",
    status: "allowed",
    session: readAuthSession(),
    metadata: { id, idempotencyKey, source: parsed.source },
  });

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
  signalSubmissions: readQueue<
    AgentQueueRecord<"signal_submission", AgentSignalSubmissionInput>
  >(AGENT_SIGNAL_QUEUE_KEY),
  affiliateMinting: buildAffiliateMintQueueSnapshot(), // Include pending affiliate mint jobs for agent processing.
});

import { z } from "zod";
import {
  AGENT_AUTH_INPUT_SCHEMA,
  AgentAuthInput,
} from "@/shared/lib/agent/ingestion-schema";
import { logPrivilegedAuditEvent } from "@/shared/lib/platform/auth/audit-log";
import { assertPrivilegedSession } from "@/shared/lib/platform/auth/authorization";
import { readAuthSession } from "@/shared/lib/platform/auth-session";

/**
 * Validate agent auth via API key or privileged session fallback.
 */
export const validateAgentAuth = (input: AgentAuthInput) => {
  const parsed = AGENT_AUTH_INPUT_SCHEMA.parse(input);
  const configuredKey = process.env.AGENT_API_KEY?.trim();
  const currentSession = readAuthSession();

  if (!configuredKey) {
    const privilegedSession = assertPrivilegedSession({
      reason: "agent ingestion queue mutation",
    });
    void logPrivilegedAuditEvent({
      action: "agent.auth.session_role",
      status: "allowed",
      session: privilegedSession,
      metadata: { mode: "session_role" },
    });

    return {
      ok: true,
      mode: "session_role",
    } as const;
  }

  if (parsed.agentKey !== configuredKey) {
    void logPrivilegedAuditEvent({
      action: "agent.auth.api_key",
      status: "denied",
      session: currentSession,
      metadata: { mode: "api_key", reason: "invalid_key" },
    });
    throw new z.ZodError([
      {
        code: "custom",
        message: "Invalid agent key",
        path: ["agentKey"],
      },
    ]);
  }

  void logPrivilegedAuditEvent({
    action: "agent.auth.api_key",
    status: "allowed",
    session: currentSession,
    metadata: { mode: "api_key" },
  });

  return {
    ok: true,
    mode: "api_key",
  } as const;
};

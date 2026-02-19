import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const monitoringPath = resolve(process.cwd(), "src/shared/lib/engagement/monitoring.ts");
const bootstrapPath = resolve(process.cwd(), "src/shared/components/monitoring/MonitoringBootstrap.tsx");
const monitoringSource = readFileSync(monitoringPath, "utf8");
const bootstrapSource = readFileSync(bootstrapPath, "utf8");

/**
 * Ensure monitoring emits request IDs and structured logs.
 */
test("monitoring includes request correlation and structured logs", () => {
  assert.match(monitoringSource, /requestId: string/);
  assert.match(monitoringSource, /type MonitoringStructuredLog/);
  assert.match(monitoringSource, /const LOG_STORAGE_KEY = "window_shoppr_monitoring_logs"/);
  assert.match(monitoringSource, /createRequestId/);
  assert.match(monitoringSource, /dispatchMonitoringEnvelope\("log"/);
});

/**
 * Ensure uptime checks are included in trace taxonomy and bootstrap probes.
 */
test("monitoring includes uptime check probes", () => {
  assert.match(monitoringSource, /type MonitoringTraceType = "initial_navigation" \| "route_transition" \| "uptime_check"/);
  assert.match(bootstrapSource, /fetch\("\/robots\.txt"/);
  assert.match(bootstrapSource, /type: "uptime_check"/);
  assert.match(bootstrapSource, /setInterval\(\(\) =>/);
});

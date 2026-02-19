import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const requiredFiles = [
  "docs/INCIDENT_RESPONSE.md",
  "docs/runbooks/availability.md",
  "docs/runbooks/error-spike.md",
  "docs/runbooks/performance-degradation.md",
];

const requiredHeadings = [
  "## SLOs",
  "## Alert thresholds",
  "## Escalation flow",
  "## On-call rotation policy",
  "## Runbooks",
];

for (const file of requiredFiles) {
  const filePath = resolve(process.cwd(), file);
  if (!existsSync(filePath)) {
    throw new Error(`Missing incident readiness file: ${file}`);
  }
}

const incidentDoc = readFileSync(resolve(process.cwd(), "docs/INCIDENT_RESPONSE.md"), "utf8");
for (const heading of requiredHeadings) {
  if (!incidentDoc.includes(heading)) {
    throw new Error(`Incident response doc missing section: ${heading}`);
  }
}

console.log("Incident readiness checks passed.");

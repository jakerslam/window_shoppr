import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const docPath = resolve(process.cwd(), "docs/THREAT_MODEL.md");
const source = readFileSync(docPath, "utf8");

const requiredSections = [
  "Assets",
  "Trust Boundaries",
  "Threats",
  "Mitigations",
  "Open Risks",
  "Review Owner",
];

for (const section of requiredSections) {
  if (!source.includes(section)) {
    console.error(`Threat model missing section: ${section}`);
    process.exit(1);
  }
}

console.log("Threat model gate checks passed.");

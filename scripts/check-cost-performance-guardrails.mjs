import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const lighthouseConfigPath = resolve(process.cwd(), "lighthouserc.json");
if (!existsSync(lighthouseConfigPath)) {
  console.error("Missing lighthouserc.json for performance budget guardrails.");
  process.exit(1);
}

const lighthouseConfig = JSON.parse(readFileSync(lighthouseConfigPath, "utf8"));
const assertions = lighthouseConfig.ci?.assert?.assertions ?? {};
if (!assertions["categories:performance"]) {
  console.error("Missing categories:performance assertion.");
  process.exit(1);
}

if (!existsSync(resolve(process.cwd(), "docs/COST_PERFORMANCE_GUARDRAILS.md"))) {
  console.error("Missing docs/COST_PERFORMANCE_GUARDRAILS.md.");
  process.exit(1);
}

console.log("Cost/performance guardrail checks passed.");

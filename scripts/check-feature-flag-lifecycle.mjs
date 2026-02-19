import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const registrySource = readFileSync(
  resolve(process.cwd(), "src/shared/lib/platform/feature-flag-registry.ts"),
  "utf8",
);

const requiredMarkers = ["key:", "owner:", "expiresOn:"];
for (const marker of requiredMarkers) {
  if (!registrySource.includes(marker)) {
    console.error(`Feature flag registry missing marker: ${marker}`);
    process.exit(1);
  }
}

if (!readFileSync(resolve(process.cwd(), "SRS.md"), "utf8").includes("R77")) {
  console.error("SRS missing R77 entry.");
  process.exit(1);
}

console.log("Feature-flag lifecycle checks passed.");

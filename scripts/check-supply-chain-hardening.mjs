import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const lockfilePath = resolve(process.cwd(), "package-lock.json");
if (!existsSync(lockfilePath)) {
  console.error("Missing package-lock.json for lockfile enforcement.");
  process.exit(1);
}

const packageJson = JSON.parse(
  readFileSync(resolve(process.cwd(), "package.json"), "utf8"),
);

const requiredScripts = ["security:audit-deps", "security:check"];
for (const scriptName of requiredScripts) {
  if (!packageJson.scripts?.[scriptName]) {
    console.error(`Missing required supply-chain script: ${scriptName}`);
    process.exit(1);
  }
}

if (!existsSync(resolve(process.cwd(), "docs/SUPPLY_CHAIN_HARDENING.md"))) {
  console.error("Missing docs/SUPPLY_CHAIN_HARDENING.md.");
  process.exit(1);
}

console.log("Supply-chain hardening checks passed.");

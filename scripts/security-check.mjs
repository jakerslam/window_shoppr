import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve, extname } from "node:path";

const ROOT = process.cwd();
const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".md", ".yml", ".yaml", ".sql"]);
const IGNORE_DIRS = new Set([".git", "node_modules", ".next", "out"]);

const secretPatterns = [
  { label: "AWS access key", regex: /AKIA[0-9A-Z]{16}/g },
  { label: "GitHub token", regex: /ghp_[A-Za-z0-9]{36}/g },
  { label: "Slack token", regex: /xox[baprs]-[A-Za-z0-9-]{10,}/g },
  { label: "Private key block", regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { label: "Generic API key assignment", regex: /(api|secret|token|password)[\w-]*\s*[:=]\s*["'][A-Za-z0-9_\-]{20,}["']/gi },
];

const staticSecurityPatterns = [
  { label: "eval usage", regex: /\beval\(/g },
  { label: "Function constructor", regex: /new\s+Function\(/g },
  { label: "document.write usage", regex: /document\.write\(/g },
];

const findings = [];

const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    if (IGNORE_DIRS.has(entry)) {
      continue;
    }

    const fullPath = resolve(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!SCAN_EXTENSIONS.has(extname(fullPath))) {
      continue;
    }

    const content = readFileSync(fullPath, "utf8");

    for (const pattern of secretPatterns) {
      if (pattern.regex.test(content)) {
        findings.push({ file: fullPath.replace(`${ROOT}/`, ""), kind: "secret", rule: pattern.label });
      }
      pattern.regex.lastIndex = 0;
    }

    for (const pattern of staticSecurityPatterns) {
      if (pattern.regex.test(content)) {
        findings.push({ file: fullPath.replace(`${ROOT}/`, ""), kind: "static", rule: pattern.label });
      }
      pattern.regex.lastIndex = 0;
    }
  }
};

walk(ROOT);

if (findings.length > 0) {
  console.error("Security check failed. Findings:");
  for (const finding of findings) {
    console.error(`- [${finding.kind}] ${finding.rule} in ${finding.file}`);
  }
  process.exit(1);
}

console.log("Security static + secret checks passed.");

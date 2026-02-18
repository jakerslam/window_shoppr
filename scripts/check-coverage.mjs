import { spawnSync } from "node:child_process";

const MIN_LINE_COVERAGE = Number(process.env.COVERAGE_MIN_LINE ?? 95);
const MIN_BRANCH_COVERAGE = Number(process.env.COVERAGE_MIN_BRANCH ?? 90);

/**
 * Execute Node test coverage and return full stdout/stderr output.
 */
const runCoverage = () => {
  const result = spawnSync(
    process.execPath,
    [
      "--test",
      "--experimental-test-coverage",
      "tests/unit/**/*.test.mjs",
      "tests/integration/**/*.test.mjs",
    ],
    { encoding: "utf8", shell: true },
  );

  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  process.stdout.write(output);

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return output;
};

/**
 * Parse the "all files" line and branch percentages from the coverage table.
 */
const parseCoverageSummary = (output) => {
  const allFilesLine = output
    .split("\n")
    .find((line) => line.includes("all files") && line.includes("|"));

  if (!allFilesLine) {
    throw new Error("Coverage summary row for 'all files' was not found.");
  }

  const numericValues = allFilesLine
    .split("|")
    .slice(1, 4)
    .map((value) => Number.parseFloat(value.trim()))
    .filter((value) => Number.isFinite(value));

  if (numericValues.length < 2) {
    throw new Error("Could not parse line/branch coverage percentages.");
  }

  const [lineCoverage, branchCoverage] = numericValues;
  return { lineCoverage, branchCoverage };
};

const coverageOutput = runCoverage();
const { lineCoverage, branchCoverage } = parseCoverageSummary(coverageOutput);

if (lineCoverage < MIN_LINE_COVERAGE || branchCoverage < MIN_BRANCH_COVERAGE) {
  console.error(
    `Coverage gate failed. line=${lineCoverage.toFixed(2)}% (min ${MIN_LINE_COVERAGE}%), branch=${branchCoverage.toFixed(2)}% (min ${MIN_BRANCH_COVERAGE}%).`,
  );
  process.exit(1);
}

console.log(
  `Coverage gate passed. line=${lineCoverage.toFixed(2)}% (min ${MIN_LINE_COVERAGE}%), branch=${branchCoverage.toFixed(2)}% (min ${MIN_BRANCH_COVERAGE}%).`,
);

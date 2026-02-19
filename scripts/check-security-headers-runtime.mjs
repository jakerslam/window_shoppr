const targetUrl = process.env.SECURITY_HEADERS_CHECK_URL?.trim() ?? "";
const strictMode = process.env.SECURITY_HEADERS_CHECK_STRICT === "true";

const requiredHeaders = [
  "content-security-policy",
  "referrer-policy",
  "x-content-type-options",
  "x-frame-options",
  "permissions-policy",
  "cross-origin-opener-policy",
  "cross-origin-resource-policy",
];

if (!targetUrl) {
  if (strictMode) {
    console.error(
      "Missing SECURITY_HEADERS_CHECK_URL while SECURITY_HEADERS_CHECK_STRICT=true.",
    );
    process.exit(1);
  }

  console.log(
    "Skipping runtime header verification (SECURITY_HEADERS_CHECK_URL not set).",
  );
  process.exit(0);
}

let parsedUrl;
try {
  parsedUrl = new URL(targetUrl);
} catch {
  console.error("SECURITY_HEADERS_CHECK_URL must be a valid absolute URL.");
  process.exit(1);
}

const response = await fetch(parsedUrl, {
  method: "GET",
  redirect: "follow",
});

if (!response.ok) {
  console.error(
    `Runtime header check failed: ${response.status} ${response.statusText}`,
  );
  process.exit(1);
}

const missingHeaders = requiredHeaders.filter(
  (headerName) => !response.headers.get(headerName),
);

if (missingHeaders.length > 0) {
  console.error(
    `Runtime security header check failed. Missing headers: ${missingHeaders.join(", ")}`,
  );
  process.exit(1);
}

const hstsValue = response.headers.get("strict-transport-security");
if (!hstsValue) {
  console.warn(
    "Warning: strict-transport-security missing. Expected on HTTPS production hosts.",
  );
}

console.log(`Runtime security header check passed for ${parsedUrl.origin}.`);

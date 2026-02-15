import { CONTENT_SECURITY_POLICY } from "@/shared/lib/security";

/**
 * Head tags that act as a fallback on static hosts (where HTTP headers may not be configurable).
 */
export default function Head() {
  return (
    <>
      <meta httpEquiv="Content-Security-Policy" content={CONTENT_SECURITY_POLICY} />
    </>
  );
}


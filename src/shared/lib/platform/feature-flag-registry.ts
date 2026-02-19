export type FeatureFlagRecord = {
  key: string;
  owner: string;
  expiresOn: string;
  description: string;
};

export const FEATURE_FLAG_REGISTRY: FeatureFlagRecord[] = [
  {
    key: "blog_stub_nav",
    owner: "frontend",
    expiresOn: "2026-12-31",
    description: "Controls blog-nav visibility while blog rollout is staged.",
  },
  {
    key: "admin_dashboard_stub",
    owner: "platform",
    expiresOn: "2026-12-31",
    description: "Controls early admin dashboard visibility for phased rollout.",
  },
];

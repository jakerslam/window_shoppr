"use client";

const BLOG_ANALYTICS_STORAGE_KEY = "window_shoppr_blog_analytics_events";

type BlogAnalyticsEvent = {
  type: "blog_article_open" | "blog_affiliate_click";
  slug: string;
  timestamp: string;
  metadata?: Record<string, string | number | boolean>;
};

/**
 * Track blog analytics events for conversion instrumentation stubs.
 */
export const trackBlogEvent = (event: BlogAnalyticsEvent) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const raw = window.localStorage.getItem(BLOG_ANALYTICS_STORAGE_KEY) ?? "[]";
    const parsed = JSON.parse(raw) as unknown;
    const queue = Array.isArray(parsed) ? parsed : [];
    const next = [...queue, event].slice(-600);
    window.localStorage.setItem(BLOG_ANALYTICS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore analytics errors.
  }
};

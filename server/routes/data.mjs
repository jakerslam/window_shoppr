import { z } from "zod";
import { writeApiError, writeApiOk, shortHash } from "../utils.mjs";

/**
 * Parse a JSON-encoded column into a JS value with fallback.
 */
const parseJsonColumn = (raw, fallback) => {
  if (typeof raw !== "string" || !raw.trim()) {
    return fallback;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

/**
 * Convert a SQL product row into the shared Product shape expected by the web app.
 */
const mapProductRow = (row) => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  category: row.category,
  subCategory: row.sub_category || undefined,
  retailer: row.retailer || undefined,
  price: typeof row.price === "number" ? row.price : Number(row.price),
  originalPrice:
    row.original_price === null || row.original_price === undefined
      ? undefined
      : typeof row.original_price === "number"
        ? row.original_price
        : Number(row.original_price),
  rating:
    row.rating === null || row.rating === undefined
      ? undefined
      : typeof row.rating === "number"
        ? row.rating
        : Number(row.rating),
  ratingCount:
    row.rating_count === null || row.rating_count === undefined
      ? undefined
      : typeof row.rating_count === "number"
        ? row.rating_count
        : Number(row.rating_count),
  description: row.description,
  affiliateUrl: row.affiliate_url,
  publishState: row.publish_state,
  images:
    Array.isArray(row.images) && row.images.length > 0
      ? row.images
      : ["/images/product-placeholder.svg"], // Always provide at least one image to keep the catalog schema happy.
  tags: Array.isArray(row.tags) ? row.tags : undefined,
  videoUrl: row.video_url || undefined,
  dealEndsAt: row.deal_ends_at || undefined,
  saveCount:
    row.save_count === null || row.save_count === undefined
      ? undefined
      : typeof row.save_count === "number"
        ? row.save_count
        : Number(row.save_count),
  blogSlug: row.blog_slug || undefined,
  blogId: row.blog_id || undefined,
  affiliateVerification: row.affiliate_verification || undefined,
  adCreative: row.ad_creative || undefined,
  isSponsored: Boolean(row.is_sponsored),
  source: row.source || undefined,
  externalId: row.external_id || undefined,
  lastSeenAt: row.last_seen_at || undefined,
  lastPriceCheckAt: row.last_price_check_at || undefined,
});

/**
 * Handle GET /data/products.
 */
export const handleGetProducts = async ({ db, res }) => {
  const rows = db
    .prepare(
      `SELECT
        p.*,
        e.images_json,
        e.tags_json,
        e.video_url,
        e.deal_ends_at,
        e.save_count,
        e.blog_slug,
        e.blog_id,
        e.affiliate_verification_json,
        e.ad_creative_json,
        e.is_sponsored,
        e.source,
        e.external_id,
        e.last_seen_at,
        e.last_price_check_at
      FROM products p
      LEFT JOIN product_extras e ON e.product_id = p.id
      WHERE p.publish_state = 'published'
      ORDER BY p.updated_at DESC;`,
    )
    .all()
    .map((row) => ({
      ...row,
      images: parseJsonColumn(row.images_json, []),
      tags: parseJsonColumn(row.tags_json, undefined),
      affiliate_verification: parseJsonColumn(row.affiliate_verification_json, undefined),
      ad_creative: parseJsonColumn(row.ad_creative_json, undefined),
    }));

  writeApiOk(res, { products: rows.map(mapProductRow) });
};

/**
 * Handle GET /data/products/:slug.
 */
export const handleGetProductBySlug = async ({ db, res, slug }) => {
  const row = db
    .prepare(
      `SELECT
        p.*,
        e.images_json,
        e.tags_json,
        e.video_url,
        e.deal_ends_at,
        e.save_count,
        e.blog_slug,
        e.blog_id,
        e.affiliate_verification_json,
        e.ad_creative_json,
        e.is_sponsored,
        e.source,
        e.external_id,
        e.last_seen_at,
        e.last_price_check_at
      FROM products p
      LEFT JOIN product_extras e ON e.product_id = p.id
      WHERE p.slug = ? AND p.publish_state = 'published'
      LIMIT 1;`,
    )
    .get(slug);

  if (!row) {
    writeApiError(res, 404, "Product not found.");
    return;
  }

  const mapped = mapProductRow({
    ...row,
    images: parseJsonColumn(row.images_json, []),
    tags: parseJsonColumn(row.tags_json, undefined),
    affiliate_verification: parseJsonColumn(row.affiliate_verification_json, undefined),
    ad_creative: parseJsonColumn(row.ad_creative_json, undefined),
  });

  writeApiOk(res, { product: mapped });
};

/**
 * Handle POST /data/email-captures.
 */
export const handleEmailCapture = async ({ db, body, res }) => {
  const parsed = z
    .object({
      email: z.string().trim().toLowerCase().email(),
      source: z.string().trim().min(1).max(40),
      submittedAt: z.string().trim().min(8),
    })
    .safeParse(body);

  if (!parsed.success) {
    writeApiError(res, 400, "Invalid email capture payload.");
    return;
  }

  const id = `ecs_${shortHash(`${parsed.data.email}:${parsed.data.submittedAt}`)}`;
  db.prepare(
    `INSERT INTO email_captures (id, email, source, submitted_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO NOTHING;`,
  ).run(id, parsed.data.email, parsed.data.source, parsed.data.submittedAt);

  writeApiOk(res, { id });
};

/**
 * Handle POST /data/purchase-intents.
 */
export const handlePurchaseIntent = async ({ db, body, res }) => {
  const parsed = z
    .object({
      id: z.string().trim().min(4).max(120),
      productId: z.string().trim().min(1).max(120),
      productSlug: z.string().trim().min(1).max(160),
      intent: z.enum(["bought", "didnt_buy", "maybe_later"]),
      answeredAt: z.string().trim().min(8),
    })
    .safeParse(body);

  if (!parsed.success) {
    writeApiError(res, 400, "Invalid purchase intent payload.");
    return;
  }

  db.prepare(
    `INSERT INTO purchase_intents (id, product_id, product_slug, intent, answered_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       intent = excluded.intent,
       answered_at = excluded.answered_at;`,
  ).run(
    parsed.data.id,
    parsed.data.productId,
    parsed.data.productSlug,
    parsed.data.intent,
    parsed.data.answeredAt,
  );

  writeApiOk(res, { id: parsed.data.id });
};

/**
 * Handle POST /data/auth/audit.
 */
export const handleAuthAudit = async ({ db, body, res }) => {
  const parsed = z
    .object({
      entry: z.object({
        id: z.string().trim().min(4).max(140),
        at: z.string().trim().min(8),
        action: z.string().trim().min(1).max(180),
        status: z.enum(["allowed", "denied"]),
        actorRoles: z.array(z.string().trim().min(1)).default([]),
        actorEmail: z.string().trim().email().optional(),
        metadata: z.record(z.unknown()).optional(),
      }),
    })
    .safeParse(body);

  if (!parsed.success) {
    writeApiError(res, 400, "Invalid audit payload.");
    return;
  }

  const entry = parsed.data.entry;
  db.prepare(
    `INSERT INTO auth_audit_log (
      id,
      at,
      action,
      status,
      actor_roles_json,
      actor_email,
      metadata_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO NOTHING;`,
  ).run(
    entry.id,
    entry.at,
    entry.action,
    entry.status,
    JSON.stringify(entry.actorRoles ?? []),
    entry.actorEmail ?? null,
    entry.metadata ? JSON.stringify(entry.metadata) : null,
  );

  writeApiOk(res, { id: entry.id });
};

/**
 * Handle POST /data/analytics/events.
 *
 * Stores consented analytics events for attribution and dashboards (local reference server).
 */
export const handleAnalyticsEvents = async ({ db, body, res }) => {
  const parsed = z
    .object({
      events: z
        .array(
          z.object({
            id: z.string().trim().min(4).max(180).optional(),
            type: z.string().trim().min(1).max(80),
            occurredAt: z.string().trim().min(8),
            payload: z.record(z.unknown()).default({}),
          }),
        )
        .min(1),
    })
    .safeParse(body);

  if (!parsed.success) {
    writeApiError(res, 400, "Invalid analytics payload.");
    return;
  }

  const nowIso = new Date().toISOString();
  const insertEvent = db.prepare(
    `INSERT INTO analytics_events (id, type, occurred_at, received_at, payload_json)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO NOTHING;`,
  );

  db.exec("BEGIN");
  try {
    parsed.data.events.forEach((event) => {
      const id =
        event.id ??
        `ae_${shortHash(
          `${event.type}:${event.occurredAt}:${JSON.stringify(event.payload).slice(0, 180)}`,
        )}`; // Deterministic fallback id for idempotent ingestion.

      insertEvent.run(
        id,
        event.type,
        event.occurredAt,
        nowIso,
        JSON.stringify(event.payload ?? {}),
      );
    });

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  writeApiOk(res, { ok: true });
};

/**
 * Handle POST /data/social-proof/saves.
 */
export const handleSaveDelta = async ({ db, body, res }) => {
  const parsed = z
    .object({
      productId: z.string().trim().min(1).max(120),
      delta: z.number().int().min(-20).max(20),
      observedAt: z.string().trim().min(8),
    })
    .safeParse(body);

  if (!parsed.success) {
    writeApiError(res, 400, "Invalid social-proof payload.");
    return;
  }

  const delta = parsed.data.delta;
  const initial = Math.max(0, delta);

  db.prepare(
    `INSERT INTO product_extras (product_id, images_json, save_count)
     VALUES (?, '[]', ?)
     ON CONFLICT(product_id) DO UPDATE SET
       save_count = MAX(0, COALESCE(save_count, 0) + ?);`,
  ).run(parsed.data.productId, initial, delta);

  writeApiOk(res, { ok: true });
};

/**
 * Handle POST /data/submissions/link.
 */
export const handleDealSubmission = async ({ db, body, res }) => {
  const parsed = z
    .object({
      queueItem: z.object({
        id: z.string().trim().min(4).max(140),
        status: z.string().trim().min(1).max(40),
        createdAt: z.string().trim().min(8),
        updatedAt: z.string().trim().min(8),
        source: z.string().trim().min(1).max(80),
        submission: z.object({
          url: z.string().trim().url(),
          title: z.string().trim().min(1).max(200),
          category: z.string().trim().min(1).max(120),
          subCategory: z.string().trim().min(1).max(120).optional(),
          salePrice: z.number().optional(),
          listPrice: z.number().optional(),
          couponCode: z.string().trim().min(1).max(80).optional(),
        }),
      }),
    })
    .safeParse(body);

  if (!parsed.success) {
    writeApiError(res, 400, "Invalid deal submission payload.");
    return;
  }

  const item = parsed.data.queueItem;
  const sub = item.submission;
  db.prepare(
    `INSERT INTO deal_submissions (
      id,
      url,
      title,
      category,
      sub_category,
      sale_price,
      list_price,
      coupon_code,
      status,
      source,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      url = excluded.url,
      title = excluded.title,
      category = excluded.category,
      sub_category = excluded.sub_category,
      sale_price = excluded.sale_price,
      list_price = excluded.list_price,
      coupon_code = excluded.coupon_code,
      status = excluded.status,
      updated_at = excluded.updated_at;`,
  ).run(
    item.id,
    sub.url,
    sub.title,
    sub.category,
    sub.subCategory ?? null,
    typeof sub.salePrice === "number" ? sub.salePrice : null,
    typeof sub.listPrice === "number" ? sub.listPrice : null,
    sub.couponCode ?? null,
    item.status,
    item.source,
    item.createdAt,
    item.updatedAt,
  );

  writeApiOk(res, { id: item.id });
};

/**
 * Handle POST /data/submissions/affiliate-mint.
 */
export const handleAffiliateMintQueueItem = async ({ db, body, res }) => {
  const parsed = z
    .object({
      queueItem: z.object({
        id: z.string().trim().min(4).max(160),
        submissionQueueId: z.string().trim().min(4).max(160),
        status: z.string().trim().min(1).max(60),
        merchantUrl: z.string().trim().url(),
      }),
    })
    .safeParse(body);

  if (!parsed.success) {
    writeApiError(res, 400, "Invalid affiliate mint payload.");
    return;
  }

  const item = parsed.data.queueItem;
  db.prepare(
    `INSERT INTO agent_queue_events (
      id,
      action,
      idempotency_key,
      payload_json,
      status,
      created_at,
      updated_at
    ) VALUES (?, 'affiliate_mint', ?, ?, ?, ?, ?)
    ON CONFLICT(action, idempotency_key) DO UPDATE SET
      payload_json = excluded.payload_json,
      status = excluded.status,
      updated_at = excluded.updated_at;`,
  ).run(
    item.id,
    item.submissionQueueId,
    JSON.stringify(parsed.data.queueItem),
    item.status,
    new Date().toISOString(),
    new Date().toISOString(),
  );

  writeApiOk(res, { id: item.id });
};

/**
 * Handle POST /data/wishlist/sync.
 */
export const handleWishlistSync = async ({ db, body, res }) => {
  const parsed = z
    .object({
      payload: z.object({
        generatedAt: z.string().trim().min(8),
        guestId: z.string().trim().min(4),
        accountId: z.string().trim().min(1).optional(),
        wishlist: z.object({
          order: z.array(z.string().trim().min(1)).default([]),
          lists: z.record(z.array(z.string().trim().min(1))).default({}),
        }),
        pendingOperations: z
          .array(
            z.object({
              id: z.string().trim().min(4),
              type: z.string().trim().min(1),
              timestamp: z.string().trim().min(8),
              productId: z.string().trim().optional(),
              listName: z.string().trim().optional(),
            }),
          )
          .default([]),
      }),
    })
    .safeParse(body);

  if (!parsed.success) {
    writeApiError(res, 400, "Invalid wishlist sync payload.");
    return;
  }

  const payload = parsed.data.payload;
  const ownerId = payload.accountId ?? payload.guestId;
  const nowIso = new Date().toISOString();

  const upsertWishlist = db.prepare(
    `INSERT INTO wishlists (id, owner_id, name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       updated_at = excluded.updated_at;`,
  );

  const upsertWishlistItem = db.prepare(
    `INSERT INTO wishlist_items (id, wishlist_id, product_id, created_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(wishlist_id, product_id) DO NOTHING;`,
  );

  const deleteItemsForWishlist = db.prepare(
    `DELETE FROM wishlist_items WHERE wishlist_id = ?;`,
  );

  db.exec("BEGIN");
  try {
    Object.entries(payload.wishlist.lists).forEach(([listName, productIds]) => {
      const wishlistId = `wl_${shortHash(`${ownerId}:${listName}`)}`;
      upsertWishlist.run(wishlistId, ownerId, listName, nowIso, nowIso);
      deleteItemsForWishlist.run(wishlistId); // Replace list contents for deterministic sync.
      (productIds ?? []).forEach((productId) => {
        upsertWishlistItem.run(
          `wli_${shortHash(`${wishlistId}:${productId}`)}`,
          wishlistId,
          productId,
          nowIso,
        );
      });
    });
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  writeApiOk(res, {
    accountId: payload.accountId ?? undefined,
    acknowledgedOperationIds: payload.pendingOperations.map((op) => op.id),
  });
};

/**
 * Handle GET /data/blog/articles.
 */
export const handleGetBlogArticles = async ({ db, res }) => {
  const rows = db
    .prepare(
      `SELECT * FROM blog_articles
       WHERE status IN ('published', 'approved', 'review', 'draft')
       ORDER BY published_at DESC;`,
    )
    .all()
    .map((row) => ({
      ...row,
      tags: parseJsonColumn(row.tags_json, []),
      sections: parseJsonColumn(row.sections_json, []),
      affiliateLinks: parseJsonColumn(row.affiliate_links_json, []),
    }));

  const items = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    body: row.body,
    category: row.category,
    tags: row.tags,
    publishedAt: row.published_at,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    layoutVariant: row.layout_variant,
    sections: row.sections,
    affiliateLinks: row.affiliateLinks,
    status: row.status,
  }));

  writeApiOk(res, { items });
};

/**
 * Handle POST /data/blog/articles/upsert.
 */
export const handleUpsertBlogArticle = async ({ db, body, res }) => {
  const parsed = z
    .object({
      article: z.object({
        id: z.string().trim().min(3).max(140),
        slug: z.string().trim().min(1).max(200),
        title: z.string().trim().min(1).max(240),
        summary: z.string().trim().min(1).max(600),
        body: z.string().trim().min(10),
        category: z.string().trim().min(1).max(120),
        tags: z.array(z.string().trim().min(1)).default([]),
        publishedAt: z.string().trim().min(8),
        seoTitle: z.string().trim().min(1).max(240),
        seoDescription: z.string().trim().min(1).max(400),
        layoutVariant: z.string().trim().min(1).max(40),
        sections: z.array(z.unknown()).default([]),
        affiliateLinks: z.array(z.unknown()).default([]),
        status: z.string().trim().min(1).max(40),
      }),
    })
    .safeParse(body);

  if (!parsed.success) {
    writeApiError(res, 400, "Invalid blog article payload.");
    return;
  }

  const article = parsed.data.article;
  const nowIso = new Date().toISOString();

  db.prepare(
    `INSERT INTO blog_articles (
      id,
      slug,
      title,
      summary,
      body,
      category,
      tags_json,
      published_at,
      seo_title,
      seo_description,
      layout_variant,
      sections_json,
      affiliate_links_json,
      status,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      slug = excluded.slug,
      title = excluded.title,
      summary = excluded.summary,
      body = excluded.body,
      category = excluded.category,
      tags_json = excluded.tags_json,
      published_at = excluded.published_at,
      seo_title = excluded.seo_title,
      seo_description = excluded.seo_description,
      layout_variant = excluded.layout_variant,
      sections_json = excluded.sections_json,
      affiliate_links_json = excluded.affiliate_links_json,
      status = excluded.status,
      updated_at = excluded.updated_at;`,
  ).run(
    article.id,
    article.slug,
    article.title,
    article.summary,
    article.body,
    article.category,
    JSON.stringify(article.tags ?? []),
    article.publishedAt,
    article.seoTitle,
    article.seoDescription,
    article.layoutVariant,
    JSON.stringify(article.sections ?? []),
    JSON.stringify(article.affiliateLinks ?? []),
    article.status,
    nowIso,
    nowIso,
  );

  writeApiOk(res, { id: article.id });
};

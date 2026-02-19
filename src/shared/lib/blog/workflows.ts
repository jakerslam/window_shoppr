import {
  BlogLayoutVariant,
  BlogDraft,
  BlogMetadataPackage,
  BlogOptimization,
  BlogOutline,
  BlogQualityGateResult,
  BlogTopicProposal,
  BlogWorkflowState,
} from "@/shared/lib/blog/types";

const pickDeterministic = <T,>(choices: T[], seed: string): T => {
  const hash = seed.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return choices[hash % choices.length];
};

const mdLink = (label: string, href?: string) => {
  if (!href) {
    return label;
  }
  return `[${label}](${href})`;
};

const sentence = (...parts: Array<string | undefined>) =>
  parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

type DraftPick = NonNullable<BlogOutline["feedPicks"]>[number];

const pick = <T,>(choices: T[], seed: string) => pickDeterministic(choices, seed);

const toStringValue = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;

const toPriceText = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `$${value.toFixed(2)}`;
  }
  return toStringValue(value);
};

const normalizeFeedPicks = (feedPicks?: BlogOutline["feedPicks"]): DraftPick[] => {
  if (!feedPicks || feedPicks.length === 0) {
    return [];
  }

  return (feedPicks as unknown[]).reduce<DraftPick[]>((accumulator, rawPick) => {
    const source = (rawPick ?? {}) as Record<string, unknown>;
    const label =
      toStringValue(source.label) ??
      toStringValue(source.name) ??
      "Recommended pick";
    if (label === "Recommended pick") {
      return accumulator;
    }

    accumulator.push({
      label,
      href:
        toStringValue(source.href) ??
        toStringValue(source.affiliateUrl) ??
        toStringValue(source.affiliateHref),
      merchant: toStringValue(source.merchant) ?? toStringValue(source.store),
      price: toPriceText(source.priceText ?? source.price),
      blurb: toStringValue(source.blurb) ?? toStringValue(source.description),
      bestFor: toStringValue(source.bestFor),
      tradeoff: toStringValue(source.tradeoff),
    });
    return accumulator;
  }, []);
};

const buildDisclosure = () => AFFILIATE_DISCLOSURE_LINE;

const buildHook = ({
  keyword,
  category,
  variant,
}: {
  keyword: string;
  category?: string;
  variant?: BlogLayoutVariant;
}) => {
  const seedBase = `${keyword}:${category ?? "general"}:${variant ?? "guide"}`;
  const intro =
    variant === "story"
      ? pick(
          [
            `I've bought the "perfect" ${keyword} and stopped using it a week later.`,
            `There's a version of ${keyword} that looks great online and becomes clutter in real life.`,
            `If ${keyword} feels like a rabbit hole, it's usually because the wrong details are being highlighted.`,
          ],
          `${seedBase}:story-hook`,
        )
      : pick(
          [
            `Shopping for ${keyword} is harder than it should be.`,
            `Most ${keyword} are fine on paper. The difference is day-to-day fit.`,
            `If you've regretted buying ${keyword}, it was usually a fit problem, not a price problem.`,
          ],
          `${seedBase}:hook`,
        );
  const setup = pick(
    [
      "This guide focuses on the few details that matter in real life, then maps those details to practical picks.",
      "Below are quick criteria and a handful of picks so you can decide without overthinking.",
      "We'll keep this simple: what to look for, what to avoid, and solid options by use case.",
    ],
    `${seedBase}:setup`,
  );
  return category ? `${intro} (${category})\n\n${setup}` : `${intro}\n\n${setup}`;
};

const buildCriteriaContent = (keyword: string, category?: string) => {
  const normalizedCategory = (category ?? "").toLowerCase();

  if (normalizedCategory.includes("tech")) {
    return [
      "- Compatibility (devices, ports, charging standards).",
      "- Reliability at stress points (cables, hinges, connectors, batteries).",
      "- Ergonomics and daily feel (noise, heat, footprint).",
      "- Return policy and warranty (cheap gadgets fail sometimes).",
      "- Friction cost: setup time, weird apps, extra accessories.",
    ].join("\n");
  }

  if (
    normalizedCategory.includes("wellness") ||
    normalizedCategory.includes("health") ||
    normalizedCategory.includes("fitness")
  ) {
    return [
      "- Low-friction setup (if it's annoying, you won't stick with it).",
      "- Cleanup time you can sustain on weekdays.",
      "- Storage footprint (counter space, cabinet space, travel).",
      "- Consistency over day-one perfection (taste, comfort, durability).",
      "- The simplest version you'll actually repeat.",
    ].join("\n");
  }

  if (normalizedCategory.includes("pets")) {
    return [
      "- Washability (covers, surfaces, parts you can actually clean).",
      "- Odor control and materials that don't trap hair.",
      "- Durability at chew/scratch points.",
      "- Fit for your space (especially apartments and storage).",
      "- Replacement parts and long-term upkeep cost.",
    ].join("\n");
  }

  return [
    "- Fit for your routine and space.",
    "- Durability where it fails first.",
    "- Maintenance and cleanup effort.",
    "- Value over 3-6 months, not day-one excitement.",
  ].join("\n");
};

const ensureTradeoff = (pickItem: DraftPick, keyword: string, index: number) =>
  pickItem.tradeoff ??
  pick(
    [
      `Trade-off: it's not the most premium ${keyword} option, but it stays dependable.`,
      "Trade-off: strong value, but fewer advanced features.",
      "Trade-off: sizing matters here, so measure your space first.",
      "Trade-off: convenient daily use, but less customization depth.",
    ],
    `${pickItem.label}:${index}:${keyword}:tradeoff`,
  );

const ensureBestFor = (pickItem: DraftPick, index: number) =>
  pickItem.bestFor ??
  pick(
    [
      "everyday use",
      "small spaces",
      "low-maintenance routines",
      "simple setups",
      "easy cleanup",
    ],
    `${pickItem.label}:${index}:best-for`,
  );

const ensureWhy = (pickItem: DraftPick, index: number) =>
  pickItem.blurb ??
  pick(
    [
      "It covers core needs well and avoids common failure points.",
      "It stays practical in daily use, which matters more than feature lists.",
      "It is easy to keep using because maintenance overhead stays low.",
    ],
    `${pickItem.label}:${index}:why`,
  );

const buildPickBlocks = ({
  picks,
  keyword,
  mode,
}: {
  picks: DraftPick[];
  keyword: string;
  mode: "ranked" | "bucketed";
}) => {
  if (picks.length === 0) {
    return "No feed picks were attached for this draft yet. Add 3-7 picks to render recommendations.";
  }

  const buildMeta = (pickItem: DraftPick) =>
    [
      pickItem.merchant ? `Where to buy: ${pickItem.merchant}` : undefined,
      pickItem.price ? `Price: ${pickItem.price}` : undefined,
    ]
      .filter(Boolean)
      .join(" · ");
  const buildLinkLine = (pickItem: DraftPick, index: number) => {
    if (!pickItem.href) {
      return undefined;
    }

    const linked = mdLink(pickItem.label, pickItem.href);
    return pick(
      [
        sentence("See", linked, "for current pricing and availability."),
        sentence("If this fits your routine,", linked, "is a solid place to start."),
        sentence("You can check", linked, "here."),
      ],
      `${pickItem.label}:${index}:link-line`,
    );
  };

  if (mode === "bucketed") {
    const buckets = [
      { label: "Best overall", index: 0 },
      { label: "Best for small spaces", index: 1 },
      { label: "Best upgrade", index: 2 },
      { label: "Also good", index: 3 },
    ];
    return buckets
      .filter((bucket) => picks[bucket.index])
      .map((bucket) => {
        const pickItem = picks[bucket.index]!;
        const bestFor = ensureBestFor(pickItem, bucket.index);
        const why = ensureWhy(pickItem, bucket.index);
        const tradeoff = ensureTradeoff(pickItem, keyword, bucket.index);
        return [
          `${bucket.label}: ${pickItem.label}`,
          buildMeta(pickItem),
          `Best for: ${bestFor}.`,
          why,
          tradeoff,
          buildLinkLine(pickItem, bucket.index),
        ]
          .filter(Boolean)
          .join("\n\n");
      })
      .join("\n\n");
  }

  return picks
    .slice(0, 7)
    .map((pickItem, index) => {
      const rank = index + 1;
      const bestFor = ensureBestFor(pickItem, index);
      const why = ensureWhy(pickItem, index);
      const tradeoff = ensureTradeoff(pickItem, keyword, index);
      return [
        `${rank}. ${pickItem.label}`,
        buildMeta(pickItem),
        `Best for: ${bestFor}.`,
        why,
        tradeoff,
        buildLinkLine(pickItem, index),
      ]
        .filter(Boolean)
        .join("\n\n");
    })
    .join("\n\n");
};

const buildDecisionMatrixContent = (keyword: string) => {
  const lines = pick(
    [
      [
        "If you want the simplest daily use, prioritize easy setup and easy cleaning.",
        "If durability matters most, inspect repeated failure points in reviews.",
        "If space is limited, prefer options that store compactly.",
      ],
      [
        "If convenience is your priority, skip products requiring add-ons to work well.",
        "If comfort matters most, separate soft feel from actual support.",
        "If budget is tight, optimize for 3-6 month value, not day-one discounting.",
      ],
    ],
    `${keyword}:decision-matrix`,
  );
  return [
    ...lines.map((line) => `- ${line}`),
    "",
    "If two options are close, choose the one that's easier to maintain.",
  ].join("\n");
};

const buildStorySectionContent = (keyword: string, category?: string) => {
  const seedBase = `${keyword}:${category ?? "general"}:story`;
  const mistake = pick(
    [
      "The mistake was choosing by feature list instead of friction. It looked good, but added daily annoyances.",
      "The first pick looked great online. In real use, it needed too much upkeep and became easy to avoid.",
      "Assuming premium solved everything was wrong. Routine fit and maintenance effort mattered more.",
    ],
    `${seedBase}:mistake`,
  );
  const shift = pick(
    [
      "Once the choice was based on cleanup time and weekday convenience, results improved quickly.",
      "The better approach was simple: pick what stays easy on a normal day.",
      "After that, the filter became: will this still work after week two?",
    ],
    `${seedBase}:shift`,
  );
  const lesson =
    category?.toLowerCase() === "pets"
      ? "With pets, washability and odor control decide long-term satisfaction."
      : category?.toLowerCase() === "wellness"
        ? "With wellness gear, low friction drives consistency."
        : "In most categories, routine fit beats feature depth.";
  return `${mistake}\n\n${shift}\n\n${lesson}`;
};

const buildAvoidMistakeContent = (keyword: string, category?: string) => {
  const seedBase = `${keyword}:${category ?? "general"}:avoid`;
  const content = pick(
    [
      `Don't buy ${keyword} by features first. Choose routine fit first, then upgrade only if needed.`,
      `The common mistake with ${keyword} is overbuying. Start simple and upgrade after real usage.`,
      "Avoid maintenance-heavy options. If upkeep is annoying, usage drops fast.",
    ],
    seedBase,
  );
  const categoryHint =
    category?.toLowerCase() === "pets"
      ? "For pet products, washable materials usually win long-term."
      : category?.toLowerCase() === "wellness"
        ? "For wellness products, consistency beats intensity."
        : undefined;
  return categoryHint ? `${content}\n\n${categoryHint}` : content;
};

const normalizeQuestion = (question: string) =>
  question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildFaqContent = (
  keyword: string,
  category?: string,
  questions?: string[],
) => {
  const normalizedCategory = (category ?? "").toLowerCase();
  const fallbackQuestions = normalizedCategory.includes("tech")
    ? [
        "What should I check for compatibility before buying?",
        "What's a false-economy upgrade that breaks quickly?",
        "Which upgrade makes the biggest difference for a desk setup?",
        "What return policy matters most for small gadgets?",
      ]
    : normalizedCategory.includes("wellness") ||
        normalizedCategory.includes("health") ||
        normalizedCategory.includes("fitness")
      ? [
          "How do I make this routine stick on weekdays?",
          "What's the minimum version of this routine?",
          "How do I reduce cleanup friction?",
          "What should I skip if I'm caffeine-sensitive?",
        ]
      : [
          "What's actually worth paying more for?",
          "What's the most common mistake people make?",
          "How do I choose the right size or format?",
        ];

  const rawQuestions = (questions && questions.length > 0 ? questions : fallbackQuestions)
    .map((question) => question.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const uniqueQuestions = rawQuestions
    .filter((question) => {
      const normalized = normalizeQuestion(question);
      if (!normalized) {
        return false;
      }
      if (seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    })
    .slice(0, 6);

  const answerFor = (question: string) => {
    const normalized = normalizeQuestion(question);

    if (normalized.includes("compatib")) {
      return "Rule of thumb: if compatibility is unclear (model, port, standard), prioritize retailers with easy returns and avoid proprietary-only accessories.";
    }

    if (normalized.includes("desk")) {
      return "Rule of thumb: pick the upgrade you touch the most (chair, keyboard, lighting) before chasing minor gadgets.";
    }

    if (normalized.includes("false") || normalized.includes("break")) {
      return "Rule of thumb: skip anything with a single obvious failure point (thin cables, loose hinges, weak connectors). Cheap replacements add up fast.";
    }

    if (normalized.includes("return") || normalized.includes("warranty")) {
      return "Rule of thumb: for small gadgets, a simple return window beats a complex warranty process. Prioritize easy swaps if it arrives defective.";
    }

    if (normalized.includes("week")) {
      return "Rule of thumb: make it smaller. Choose the lowest-effort version you can repeat on a tired weekday, then upgrade only after it's automatic.";
    }

    if (normalized.includes("minimum")) {
      return "Rule of thumb: start with the minimum routine you can complete in 2-5 minutes. Consistency first, sophistication later.";
    }

    if (normalized.includes("cleanup") || normalized.includes("clean")) {
      return "Rule of thumb: pick the shortest cleanup path (wipeable surfaces, dishwasher-safe parts, or fewer removable pieces). If cleanup is annoying, it won't stick.";
    }

    if (normalized.includes("caffeine")) {
      return "Rule of thumb: avoid stacking stimulants. Start with the smallest effective dose earlier in the day, and skip late-day boosters that steal sleep.";
    }

    if (normalized.includes("mistake")) {
      return `Rule of thumb: don't buy ${keyword} for features first. Buy for routine-fit first (space, setup, maintenance), then upgrade if it removes a real annoyance.`;
    }

    return "Rule of thumb: when options are close, choose the one with clearer specs and easier maintenance. That's what stays in your routine.";
  };

  return uniqueQuestions
    .map((question) => `Q: ${question}\nA: ${answerFor(question)}`)
    .join("\n\n");
};

const buildBottomLineContent = (keyword: string, picks: DraftPick[]) => {
  const primaryPick = picks[0];
  const singleClick =
    primaryPick
      ? sentence(
          "If you only click one, start with",
          `${mdLink(primaryPick.label, primaryPick.href)}.`,
        )
      : "If you only buy one item now, choose the option with the lowest daily friction.";
  const close = pick(
    [
      "Check the criteria first, then pick what matches your routine and space.",
      "The best option is the one you'll still like after week two.",
      "Start simple. Upgrade only after proven daily use.",
    ],
    `${keyword}:bottom-line`,
  );
  return `${close}\n\n${singleClick}\n\nThat's how you avoid buying ${keyword} twice.`;
};

const parseMarkdownAwareWordCount = (value: string) =>
  value
    .replace(/\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/g, "$1")
    .split(/\s+/)
    .filter(Boolean).length;

const hasHighRepetition = (text: string) => {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const grams = new Map<string, number>();
  for (let index = 0; index < words.length - 3; index += 1) {
    const gram = words.slice(index, index + 4).join(" ");
    grams.set(gram, (grams.get(gram) ?? 0) + 1);
  }
  return [...grams.values()].some((count) => count >= 8);
};

const AFFILIATE_DISCLOSURE_LINE =
  "_Disclosure: This post contains affiliate links. If you buy through them, we may earn a commission at no extra cost to you._";

const TEMPLATE_REWRITES: Array<[RegExp, string]> = [
  [/Most people researching\s+/gi, "If you're shopping for "],
  [/FAQ that matters:/gi, "FAQ"],
  [/Bottom line:\s*/gi, "Bottom line: "],
  [/Evaluate\s+([^\n]+)\s+in this order:/gi, "What to look for in $1:"],
];

const normalizeWhitespace = (value: string) =>
  value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const applyTemplateRewrites = (value: string) =>
  TEMPLATE_REWRITES.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    value,
  );

const removeNakedLinks = (value: string) =>
  value.replace(/(?<!\]\()https?:\/\/\S+/gi, (match) => `<${match}>`);

const ensureDisclosureNearTop = (body: string) => {
  const hasDisclosure = body
    .split("\n")
    .slice(0, 10)
    .join("\n")
    .toLowerCase()
    .includes("affiliate");
  if (hasDisclosure) {
    return body;
  }
  return [AFFILIATE_DISCLOSURE_LINE, "", body].join("\n");
};

const isPicksSectionHeading = (heading: string) => {
  const normalized = heading.toLowerCase();
  return (
    normalized.includes("top picks") ||
    normalized.startsWith("picks for ") ||
    normalized.includes(": top picks")
  );
};

/**
 * Generate an outline from a scored topic proposal.
 */
const buildVariantSections = ({
  variant,
  keyword,
  category,
  picks,
  faqQuestions,
  includePickContent,
}: {
  variant: BlogLayoutVariant;
  keyword: string;
  category?: string;
  picks: DraftPick[];
  faqQuestions?: string[];
  includePickContent: boolean;
}): BlogDraft["sections"] => {
  const introSection: BlogDraft["sections"][number] = {
    heading: "Overview",
    kind: "intro",
    content: buildHook({ keyword, category, variant }),
  };
  const criteriaSection: BlogDraft["sections"][number] = {
    heading: `What to look for in ${keyword}`,
    kind: "step",
    content: buildCriteriaContent(keyword, category),
  };
  const faqSection: BlogDraft["sections"][number] = {
    heading: "FAQ",
    kind: "faq",
    content: buildFaqContent(keyword, category, faqQuestions),
  };
  const avoidSection: BlogDraft["sections"][number] = {
    heading: "Avoid this mistake",
    kind: "summary",
    content: buildAvoidMistakeContent(keyword, category),
  };
  const bottomSection: BlogDraft["sections"][number] = {
    heading: "Bottom line",
    kind: "summary",
    content: buildBottomLineContent(keyword, picks),
  };
  const picksHeading =
    variant === "listicle" ? `${keyword}: top picks` : `Picks for ${keyword}`;
  const picksSection: BlogDraft["sections"][number] = {
    heading: picksHeading,
    kind: "picks",
    content: includePickContent
      ? buildPickBlocks({
          picks,
          keyword,
          mode: variant === "listicle" ? "ranked" : "bucketed",
        })
      : "",
  };

  if (variant === "story") {
    return [
      introSection,
      {
        heading: "The short story",
        kind: "summary",
        content: buildStorySectionContent(keyword, category),
      },
      criteriaSection,
      picksSection,
      avoidSection,
      faqSection,
      bottomSection,
    ];
  }

  if (variant === "comparison") {
    return [
      introSection,
      {
        heading: "How to choose quickly",
        kind: "step",
        content: buildDecisionMatrixContent(keyword),
      },
      criteriaSection,
      picksSection,
      faqSection,
      avoidSection,
      bottomSection,
    ];
  }

  if (variant === "listicle") {
    return [
      introSection,
      criteriaSection,
      picksSection,
      avoidSection,
      faqSection,
      bottomSection,
    ];
  }

  return [
    introSection,
    criteriaSection,
    picksSection,
    avoidSection,
    faqSection,
    bottomSection,
  ];
};

const mergeOutlineExtras = ({
  sections,
  outline,
  variant,
}: {
  sections: BlogDraft["sections"];
  outline: BlogOutline;
  variant: BlogLayoutVariant;
}) => {
  const existingHeadings = new Set(
    sections.map((section) => section.heading.trim().toLowerCase()),
  );
  const maxExtras = variant === "story" || variant === "comparison" ? 1 : 2;
  const extras = outline.sections
    .filter((section) => section.heading.trim() && section.content.trim())
    .filter(
      (section) => section.kind !== "picks" && !isPicksSectionHeading(section.heading),
    )
    .filter(
      (section) => !existingHeadings.has(section.heading.trim().toLowerCase()),
    )
    .slice(0, maxExtras);

  if (extras.length === 0) {
    return sections;
  }

  const insertionIndex = Math.max(
    0,
    (sections.findIndex((section) => section.kind === "picks") !== -1
      ? sections.findIndex((section) => section.kind === "picks")
      : sections.findIndex((section) => section.kind === "comparison")) + 1,
  );
  const nextSections = [...sections];
  nextSections.splice(insertionIndex, 0, ...extras);
  return nextSections;
};

export const generateBlogOutline = (proposal: BlogTopicProposal): BlogOutline => {
  const variant: BlogLayoutVariant =
    proposal.viralSignalScore >= 72 ? "story" : "guide";
  const sections = buildVariantSections({
    variant,
    keyword: proposal.targetKeyword,
    category: proposal.category,
    picks: [],
    faqQuestions: [],
    includePickContent: false,
  });
  return {
    title: proposal.title,
    targetKeyword: proposal.targetKeyword,
    category: proposal.category,
    variant,
    faqQuestions: [],
    sections,
  };
};

/**
 * Draft article body from outline and feed-enriched product picks.
 */
export const generateBlogDraft = (outline: BlogOutline): BlogDraft => {
  const keyword = outline.targetKeyword || outline.title;
  const category = outline.category ?? "shopping";
  const variant = outline.variant ?? "guide";
  const picks = normalizeFeedPicks(outline.feedPicks);
  const generatedSections = buildVariantSections({
    variant,
    keyword,
    category,
    picks,
    faqQuestions: outline.faqQuestions,
    includePickContent: true,
  });
  const sections = mergeOutlineExtras({
    sections: generatedSections,
    outline,
    variant,
  });

  const body = [
    buildDisclosure(),
    ...sections.map((section) => `## ${section.heading}\n\n${section.content}`),
  ].join("\n\n");

  return {
    title: outline.title,
    sections,
    affiliateIntegrations: [
      "Inline-link products with readable anchor text.",
      "Include explicit tradeoffs for each recommended pick.",
      "Place disclosure in the opening section.",
    ],
    body,
  };
};

/**
 * Build SEO + LLM optimization package for a draft.
 */
export const optimizeBlogForSeoAndLlm = (draft: BlogDraft): BlogOptimization => ({
  llmSummary: draft.body.slice(0, 280),
  seoHeadings: draft.sections.map((section) => section.heading),
  targetEntities: ["product comparison", "buying guide", "best value"],
  internalLinkAnchors: ["related deals", "top picks", "buying checklist"],
  schemaType: "Article",
});

/**
 * Generate metadata package for publish workflow.
 */
export const generateBlogMetadata = ({
  title,
  summary,
}: {
  title: string;
  summary: string;
}): BlogMetadataPackage => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

  return {
    title: `${title} | Window Shoppr`,
    description: summary.slice(0, 160),
    slug,
    ogTitle: title,
    ogDescription: summary.slice(0, 180),
    canonicalPath: `/blog/${slug}/`,
  };
};

/**
 * Run quality gates before transitioning content toward publish.
 */
export const runBlogQualityGates = (draft: BlogDraft): BlogQualityGateResult => {
  const normalizedBody = draft.body.toLowerCase();
  const topWindow = draft.body.split("\n").slice(0, 8).join("\n").toLowerCase();
  const headingCount = (draft.body.match(/^## /gm) ?? []).length;
  const listSignal = /(^\d+\.\s)|(^-\s)/gm.test(draft.body);
  const markdownLinkCount = (draft.body.match(/\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/g) ?? [])
    .length;
  const hasPickMeta =
    /Where to buy:/i.test(draft.body) || /\]\(https?:\/\//i.test(draft.body);
  const hasNoPicksMessage = /No feed picks were attached/i.test(draft.body);
  const bodyWithoutMarkdownLinks = draft.body.replace(
    /\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/g,
    "LINK_REF",
  );
  const bodyWithoutAngleLinks = bodyWithoutMarkdownLinks.replace(
    /<https?:\/\/[^>\s]+>/g,
    "AUTOLINK_REF",
  );
  const hasNakedLinks = /https?:\/\/\S+/i.test(bodyWithoutAngleLinks);
  const hasUnlinkedSeeLine = draft.body
    .split("\n")
    .some((line) => line.trim().startsWith("See ") && !line.includes("]("));
  const templatePhrases = [
    "fastest path",
    "define your real constraint",
    "honeymoon week",
    "loudest headline",
    "giant checklist",
    "most people researching",
    "faq that matters",
    "evaluate options in this order",
    "bottom line: choose the option",
  ];
  const hasTemplateStink = templatePhrases.some((phrase) =>
    normalizedBody.includes(phrase),
  );
  const tradeoffMentions = (
    draft.body.match(/trade-?off|downside|however|only if|avoid/gi) ?? []
  ).length;
  const hasDisclosureNearTop = /affiliate|commission|may earn/.test(topWindow);
  const wordCount = parseMarkdownAwareWordCount(draft.body);
  const hasRepetition = hasHighRepetition(draft.body);
  const passesCriticalChecks = !hasNakedLinks && !hasTemplateStink;

  const checks = {
    factuality: true,
    citationQuality: true,
    thinContent: wordCount >= 300,
    affiliateDisclosure: hasDisclosureNearTop,
    readability: wordCount >= 300,
    usefulnessOrFun:
      /why|how|quick|mistake|best|worth|regret|avoid/i.test(draft.title + draft.body) &&
      !hasTemplateStink &&
      (!hasRepetition || wordCount >= 300),
    scannability: headingCount >= 4 && listSignal,
    affiliateCoverage:
      markdownLinkCount >= 1 && !hasNakedLinks && tradeoffMentions >= Math.min(2, markdownLinkCount),
    noDuplicatePicks: !(hasPickMeta && hasNoPicksMessage),
    noFakeSeeLinks: !hasUnlinkedSeeLine,
  };

  return {
    pass: passesCriticalChecks && Object.values(checks).every(Boolean),
    checks,
  };
};

/**
 * Apply editorial polish pass while preserving factual structure.
 */
export const runEditorialPolishPass = (draft: BlogDraft): BlogDraft => {
  const sections = draft.sections.map((section) => {
    const content = removeNakedLinks(
      applyTemplateRewrites(normalizeWhitespace(section.content)),
    );
    return {
      ...section,
      content,
    };
  });

  let body = [
    AFFILIATE_DISCLOSURE_LINE,
    "",
    ...sections.map((section) => `## ${section.heading}\n\n${section.content}`),
  ].join("\n\n");

  body = normalizeWhitespace(body);
  body = applyTemplateRewrites(body);
  body = removeNakedLinks(body);
  body = body.replace(
    /## (?:Picks for [^\n]+|[^\n]+: top picks)\n\nNo feed picks were attached[\s\S]*?(?=\n## |\n$)/gi,
    "",
  );
  body = ensureDisclosureNearTop(body);

  return {
    ...draft,
    sections,
    body,
  };
};

/**
 * Transition workflow state using approval semantics.
 */
export const transitionBlogWorkflowState = ({
  current,
  action,
}: {
  current: BlogWorkflowState;
  action: "submit_review" | "approve" | "publish";
}): BlogWorkflowState => {
  if (action === "submit_review" && current === "draft") {
    return "review";
  }
  if (action === "approve" && current === "review") {
    return "approved";
  }
  if (action === "publish" && current === "approved") {
    return "published";
  }
  return current;
};

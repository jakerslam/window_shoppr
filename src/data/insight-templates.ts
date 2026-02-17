export type InsightTemplate = {
  slug: string;
  pillar: string;
  title: string;
  summary: string;
  heroLine: string;
  intentKeywords: string[];
  faqs: { question: string; answer: string }[];
  prompt: string;
};

export const INSIGHT_TEMPLATES: InsightTemplate[] = [
  {
    slug: "sleep-better-rituals",
    pillar: "Restful Rituals",
    title: "Slow down for better sleep",
    summary:
      "AI-curated strategies for calming evenings, pairing sensory cues with cozy products to make bedtime feel intentional rather than frantic.",
    heroLine: "Prepare the bedroom, mind, and body for an effortless drift-off.",
    intentKeywords: ["sleep", "relax", "white noise", "blanket", "nightstand"],
    faqs: [
      {
        question: "How do I know which nightstands or blankets actually help?",
        answer:
          "Focus on breathable fabrics and soft lighting—white noise and air-purifying throw blankets support the calm states your parasympathetic system craves.",
      },
      {
        question: "Can I add guided breathing without extra equipment?",
        answer:
          "Yes. Pick a product that pairs portability (desk speaker, diffused lamp) with the timer-based features that encourage 4-7-8 breathing or similar rituals.",
      },
    ],
    prompt:
      "Given keywords around sleep rituals, highlight products that slow down ambient noise, add tactile warmth, and keep your nightly routine gentle.",
  },
  {
    slug: "cozy-work-from-home",
    pillar: "Comfortable Productivity",
    title: "Make your home office feel like a stay-cation",
    summary:
      "Treat your workday like a curated window-shop: soft lighting, ergonomic accessories, and playful textures keep meetings fresh even when the commute is zero steps away.",
    heroLine: "Blend comfort and focus so every push-notification feels manageable.",
    intentKeywords: ["desk", "home office", "fan", "lighting", "decor"],
    faqs: [
      {
        question: "Do I need to spend a lot to make my workspace cozier?",
        answer:
          "Not at all. Low-key upgrades like a quiet fan, greenery, or textured throws refresh the room without breaking the aesthetic you already love.",
      },
      {
        question: "How can I add movement so I don't feel stuck at the desk?",
        answer:
          "Look for portable accessories (mini fans, desk organizers, lightweight blankets) that you can shift around—motion keeps creativity from getting stale.",
      },
    ],
    prompt:
      "Focus on products that blend tactile comfort with professional polish for remote days that still feel elevated.",
  },
  {
    slug: "refresh-your-rituals",
    pillar: "Self-Care Rituals",
    title: "Refresh rituals that feel like a spa vacation",
    summary:
      "AI invites you to stack little luxuries (mirrors, diffusers, supplements) so the bathroom or vanity becomes a reset button, not just a prep zone.",
    heroLine: "Treat every skincare step like a soft hush of personal luxury.",
    intentKeywords: ["beauty", "skincare", "mirror", "vanity", "serum"],
    faqs: [
      {
        question: "What should I look for in a vanity mirror?",
        answer:
          "Even lighting, adjustable tilt, and a compact footprint so the mirror feels intentional without overwhelming your counter.",
      },
      {
        question: "Can I keep my routine simple but still feel pampered?",
        answer:
          "Yes—pick multitasking products (vanity mirror + lighting, hydrating matches) that elevate the atmosphere even when your steps stay minimal.",
      },
    ],
    prompt:
      "Create a small shrine of self-care featuring skincare heroes, mirrors, and ritual-ready lighting tailored to mindful routines.",
  },
];

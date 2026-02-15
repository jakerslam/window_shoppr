import preferenceQuestionsJson from "@/data/preference-questions.json";

export type TasteQuizVibeOption = {
  label: string;
  tagKey: string;
};

export type TasteQuizCopy = {
  title: string;
  subtitle: string;
  stepMetaTemplate: string;
  step1TitleTemplate: string;
  step2TitleTemplate: string;
  buttonNotNow: string;
  buttonNext: string;
  buttonBack: string;
  buttonFinish: string;
};

export type TasteQuizConfig = {
  maxCategories: number;
  maxVibes: number;
  copy: TasteQuizCopy;
  vibeOptions: TasteQuizVibeOption[];
};

export type TasteTrickleConfig = {
  title: string;
  likeLabel: string;
  dislikeLabel: string;
  likedStatus: string;
  dislikedStatus: string;
};

export type PreferenceQuestionBank = {
  tasteQuiz: TasteQuizConfig;
  tasteTrickle: TasteTrickleConfig;
};

const DEFAULT_QUESTION_BANK: PreferenceQuestionBank = {
  tasteQuiz: {
    maxCategories: 4,
    maxVibes: 5,
    copy: {
      title: "Personalize your window",
      subtitle:
        "This is saved only on this device. You can clear it anytime in settings.",
      stepMetaTemplate: "Step {step} of {total}",
      step1TitleTemplate: "Pick up to {maxCategories} categories",
      step2TitleTemplate: "Pick a few vibes (optional)",
      buttonNotNow: "Not now",
      buttonNext: "Next",
      buttonBack: "Back",
      buttonFinish: "Finish",
    },
    vibeOptions: [
      { label: "Cozy", tagKey: "cozy" },
      { label: "Self-care", tagKey: "self-care" },
      { label: "Home glow-up", tagKey: "home" },
      { label: "Fitness", tagKey: "fitness" },
      { label: "Pets", tagKey: "pets" },
      { label: "Outdoors", tagKey: "outdoors" },
      { label: "Desk setup", tagKey: "tech" },
    ],
  },
  tasteTrickle: {
    title: "Tune your feed",
    likeLabel: "More like this",
    dislikeLabel: "Less like this",
    likedStatus: "Noted: more like this",
    dislikedStatus: "Noted: less like this",
  },
};

/**
 * Check whether a value is a non-empty string.
 */
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

/**
 * Normalize a numeric max selection value to a safe integer.
 */
const normalizeMaxValue = (value: unknown, fallback: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback; // Fall back when the payload is not a number.
  }

  const rounded = Math.round(value);

  return rounded > 0 ? rounded : fallback; // Enforce a positive integer cap.
};

/**
 * Normalize a copy string to a safe fallback.
 */
const normalizeCopyString = (value: unknown, fallback: string) =>
  isNonEmptyString(value) ? value : fallback;

/**
 * Normalize a vibe options array to a safe list of selectable tags.
 */
const normalizeVibeOptions = (
  value: unknown,
  fallback: TasteQuizVibeOption[],
) => {
  if (!Array.isArray(value)) {
    return fallback; // Fall back when the payload is not an array.
  }

  const normalized = value
    .map((entry) => entry as Partial<TasteQuizVibeOption>)
    .filter(
      (entry) =>
        isNonEmptyString(entry.label) && isNonEmptyString(entry.tagKey),
    )
    .map((entry) => ({
      label: entry.label!.trim(),
      tagKey: entry.tagKey!.trim(),
    }));

  return normalized.length > 0 ? normalized : fallback; // Ensure at least one vibe exists.
};

/**
 * Question bank config that drives onboarding + trickle preference capture.
 */
export const PREFERENCE_QUESTION_BANK: PreferenceQuestionBank = (() => {
  const raw = preferenceQuestionsJson as Partial<PreferenceQuestionBank>;
  const rawQuiz = (raw.tasteQuiz ?? {}) as Partial<TasteQuizConfig>;
  const rawQuizCopy = (rawQuiz.copy ?? {}) as Partial<TasteQuizCopy>;
  const rawTrickle = (raw.tasteTrickle ?? {}) as Partial<TasteTrickleConfig>;

  return {
    tasteQuiz: {
      maxCategories: normalizeMaxValue(
        rawQuiz.maxCategories,
        DEFAULT_QUESTION_BANK.tasteQuiz.maxCategories,
      ),
      maxVibes: normalizeMaxValue(
        rawQuiz.maxVibes,
        DEFAULT_QUESTION_BANK.tasteQuiz.maxVibes,
      ),
      copy: {
        title: normalizeCopyString(
          rawQuizCopy.title,
          DEFAULT_QUESTION_BANK.tasteQuiz.copy.title,
        ),
        subtitle: normalizeCopyString(
          rawQuizCopy.subtitle,
          DEFAULT_QUESTION_BANK.tasteQuiz.copy.subtitle,
        ),
        stepMetaTemplate: normalizeCopyString(
          rawQuizCopy.stepMetaTemplate,
          DEFAULT_QUESTION_BANK.tasteQuiz.copy.stepMetaTemplate,
        ),
        step1TitleTemplate: normalizeCopyString(
          rawQuizCopy.step1TitleTemplate,
          DEFAULT_QUESTION_BANK.tasteQuiz.copy.step1TitleTemplate,
        ),
        step2TitleTemplate: normalizeCopyString(
          rawQuizCopy.step2TitleTemplate,
          DEFAULT_QUESTION_BANK.tasteQuiz.copy.step2TitleTemplate,
        ),
        buttonNotNow: normalizeCopyString(
          rawQuizCopy.buttonNotNow,
          DEFAULT_QUESTION_BANK.tasteQuiz.copy.buttonNotNow,
        ),
        buttonNext: normalizeCopyString(
          rawQuizCopy.buttonNext,
          DEFAULT_QUESTION_BANK.tasteQuiz.copy.buttonNext,
        ),
        buttonBack: normalizeCopyString(
          rawQuizCopy.buttonBack,
          DEFAULT_QUESTION_BANK.tasteQuiz.copy.buttonBack,
        ),
        buttonFinish: normalizeCopyString(
          rawQuizCopy.buttonFinish,
          DEFAULT_QUESTION_BANK.tasteQuiz.copy.buttonFinish,
        ),
      },
      vibeOptions: normalizeVibeOptions(
        rawQuiz.vibeOptions,
        DEFAULT_QUESTION_BANK.tasteQuiz.vibeOptions,
      ),
    },
    tasteTrickle: {
      title: normalizeCopyString(
        rawTrickle.title,
        DEFAULT_QUESTION_BANK.tasteTrickle.title,
      ),
      likeLabel: normalizeCopyString(
        rawTrickle.likeLabel,
        DEFAULT_QUESTION_BANK.tasteTrickle.likeLabel,
      ),
      dislikeLabel: normalizeCopyString(
        rawTrickle.dislikeLabel,
        DEFAULT_QUESTION_BANK.tasteTrickle.dislikeLabel,
      ),
      likedStatus: normalizeCopyString(
        rawTrickle.likedStatus,
        DEFAULT_QUESTION_BANK.tasteTrickle.likedStatus,
      ),
      dislikedStatus: normalizeCopyString(
        rawTrickle.dislikedStatus,
        DEFAULT_QUESTION_BANK.tasteTrickle.dislikedStatus,
      ),
    },
  };
})();


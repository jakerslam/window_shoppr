/**
 * Format a category slug into a display-ready label.
 */
export const formatCategoryLabel = (categorySource: string) => {
  if (!categorySource) {
    return ""; // Skip formatting when no category is selected.
  }

  const formatted = categorySource.replace(/-/g, " "); // Replace slug separators.

  return formatted.replace(/\b\w/g, (char) => char.toUpperCase()); // Title-case each word.
};

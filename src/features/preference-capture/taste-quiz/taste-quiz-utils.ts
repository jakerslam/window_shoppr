/**
 * Replace simple {token} values in copy templates.
 */
export const formatTemplate = (
  template: string,
  values: Record<string, string | number>,
) =>
  template.replace(/\{(\w+)\}/g, (match, token) =>
    Object.prototype.hasOwnProperty.call(values, token)
      ? String(values[token])
      : match,
  );


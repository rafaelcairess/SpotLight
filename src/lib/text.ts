/**
 * Helpers utilitários (text).
 */

export const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const includesAnyNormalized = (value: string, terms: string[]) => {
  const normalizedValue = normalizeText(value);
  return terms.some((term) => normalizedValue.includes(normalizeText(term)));
};

/**
 * Number utilities
 */

const normalizeNumberInput = (value: string) =>
  value.replace(/\s/g, '').replace(',', '.');

export const parseNumberInput = (value: string): number | null => {
  const normalized = normalizeNumberInput(value);
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const extractNumberFromText = (value: string): number | null => {
  const normalized = value.replace(',', '.');
  const match = normalized.match(/[\d.]+/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
};

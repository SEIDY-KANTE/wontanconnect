/**
 * Auth validation helpers
 */

export const MIN_PASSWORD_LENGTH = 6;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[\d\s()-]{6,}$/;

export const isValidContact = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.includes('@')) {
    return EMAIL_REGEX.test(trimmed.toLowerCase());
  }
  return PHONE_REGEX.test(trimmed);
};

export const isValidPassword = (value: string) => {
  return value.trim().length >= MIN_PASSWORD_LENGTH;
};

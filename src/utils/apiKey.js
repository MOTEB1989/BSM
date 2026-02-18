const PLACEHOLDER_PATTERNS = [
  /your[_-]?api[_-]?key/i,
  /replace[_-]?me/i,
  /example/i,
  /^sk-test/i,
  /^test[_-]?key/i
];

/**
 * Validate whether an API key value is usable for live requests.
 * Why: UI readiness badges should reflect real operability, not only non-empty strings.
 *
 * @param {unknown} rawKey
 * @returns {boolean}
 */
export const hasUsableApiKey = (rawKey) => {
  if (typeof rawKey !== "string") return false;

  const key = rawKey.trim();
  if (key.length < 16) return false;

  return !PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(key));
};


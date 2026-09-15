/**
 * A coarse, regex-based heuristic — not real named-entity recognition and
 * not a substitute for one. It reliably catches structured patterns (email
 * addresses, phone numbers) and loosely flags "possibly a proper noun"
 * (capitalized word pairs), which is the best a dependency-free heuristic
 * can do for names, schools, workplaces, and locations without conflating
 * categories it can't actually distinguish. Expect false positives (e.g.
 * "New York", any sentence-initial proper noun) and false negatives (a
 * name typed in lowercase). This exists to prompt a second look before
 * publishing, not to guarantee anonymity.
 */

export type PiiMatchKind = "email" | "phone" | "possible_proper_noun";

export interface PiiMatch {
  kind: PiiMatchKind;
  snippet: string;
}

export interface PiiCheckResult {
  hasPossibleMatch: boolean;
  matches: PiiMatch[];
}

const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

// Matches common US-style formats and loosely-punctuated international
// sequences of 7+ digits — intentionally permissive since under-matching a
// real phone number is worse here than an occasional false positive.
const PHONE_PATTERN =
  /(?:\+?\d{1,3}[-.\s]?)?(?:\(\d{2,4}\)[-.\s]?)?\d{3}[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g;

// Two or more consecutive capitalized words, not at the very start of the
// text or immediately after sentence-ending punctuation — a weak signal
// for a proper noun (name, school, employer, place) rather than a
// sentence's own capitalized first word.
const PROPER_NOUN_PAIR_PATTERN =
  /(?<![.!?]\s)(?<!^)\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g;

function collectMatches(
  text: string,
  pattern: RegExp,
  kind: PiiMatchKind,
): PiiMatch[] {
  return Array.from(text.matchAll(pattern), (match) => ({ kind, snippet: match[0] }));
}

export function checkForPossiblePii(text: string): PiiCheckResult {
  const matches = [
    ...collectMatches(text, EMAIL_PATTERN, "email"),
    ...collectMatches(text, PHONE_PATTERN, "phone"),
    ...collectMatches(text, PROPER_NOUN_PAIR_PATTERN, "possible_proper_noun"),
  ];

  return { hasPossibleMatch: matches.length > 0, matches };
}

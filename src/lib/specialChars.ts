// Block "special characters" in comments, but allow normal punctuation and emojis.
// Disallowed: < > { } [ ] \ ` $ ^ ~ | * # @ %
const FORBIDDEN_REGEX = /[<>{}\[\]\\`$^~|*#@%]/;

export function containsBlockedChars(text: string): boolean {
  return FORBIDDEN_REGEX.test(text);
}

export const BLOCKED_CHARS_HINT =
  "Special characters are not allowed: < > { } [ ] \\ ` $ ^ ~ | * # @ %";

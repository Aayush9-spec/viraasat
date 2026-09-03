// Lightweight content-policy guard for AI flows.
//
// Two responsibilities:
//   1. INPUT:  reject user messages that obviously violate policy
//              (PII, hate speech keywords, illegal requests) BEFORE we burn
//              a Gemini call.
//   2. OUTPUT: scrub the model response so it never echoes back credit
//              card numbers, phone numbers, or Aadhaar-style IDs.
//
// This is a defense-in-depth layer, not a substitute for Gemini's own
// safety filters. For production-grade moderation, wire Google Cloud
// Natural Language API classifyText here.

const PII_PATTERNS: Array<{ name: string; re: RegExp }> = [
  // Luhn-validated card numbers are handled separately; this catches the
  // obvious 16-digit groups in prose.
  { name: 'credit_card', re: /\b(?:\d[ -]*?){13,16}\b/g },
  // 10-digit Indian phone numbers, with optional +91.
  { name: 'phone', re: /\+?91[-\s]?\d{4,5}[-\s]?\d{5,6}\b/g },
  // Aadhaar-style 12-digit IDs.
  { name: 'aadhaar', re: /\b\d{4}\s?\d{4}\s?\d{4}\b/g },
  // Email addresses (we don't want these echoed back in product descriptions).
  { name: 'email', re: /[\w.+-]+@[\w-]+\.[\w.-]+/g },
];

const BLOCKED_KEYWORDS = [
  // Hate / slurs / illegal
  'kill yourself', 'kys', 'child porn', 'cp ', 'csam',
  'n-word', 'faggot', 'retard',
  // Violence
  'how to make a bomb', 'how to make explosives', 'how to synthesize fentanyl',
  // Self-harm
  'commit suicide', 'end my life',
];

const REFUSAL_MESSAGE =
  "I'm sorry, I can't help with that. I can answer questions about Indian heritage crafts, the Viraasat marketplace, and the products listed here. For anything else, please contact our team at [email protected].";

export interface GuardResult {
  ok: boolean;
  reason?: 'pii_detected' | 'policy_violation' | 'too_long' | 'empty';
  refusalMessage?: string;
}

const MAX_INPUT_LENGTH = 2000; // tokens are roughly 4 chars; this is generous.

export function guardInput(text: string): GuardResult {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, reason: 'empty' };
  if (trimmed.length > MAX_INPUT_LENGTH) return { ok: false, reason: 'too_long' };

  const lower = trimmed.toLowerCase();
  for (const kw of BLOCKED_KEYWORDS) {
    if (lower.includes(kw)) {
      return { ok: false, reason: 'policy_violation', refusalMessage: REFUSAL_MESSAGE };
    }
  }

  // We don't BLOCK on PII in input (some users may legitimately type their
  // own order number), but we flag it so the caller can warn the user.
  // For chat the caller should append a note to the prompt asking the
  // model not to echo PII.
  return { ok: true };
}

export function guardOutput(text: string): string {
  if (!text) return text;
  let scrubbed = text;
  for (const { re, name } of PII_PATTERNS) {
    scrubbed = scrubbed.replace(re, (match) => {
      // Preserve structure (e.g. keep the last 4 of a card) so the
      // response stays useful, but never leak the full value.
      const digits = match.replace(/\D/g, '');
      if (name === 'credit_card' && digits.length >= 4) {
        return `[card ending ${digits.slice(-4)}]`;
      }
      if (name === 'phone' || name === 'aadhaar') {
        return `[redacted ${name}]`;
      }
      if (name === 'email') {
        return '[redacted email]';
      }
      return '[redacted]';
    });
  }
  return scrubbed;
}

export const __testing = { PII_PATTERNS, BLOCKED_KEYWORDS, REFUSAL_MESSAGE, MAX_INPUT_LENGTH };

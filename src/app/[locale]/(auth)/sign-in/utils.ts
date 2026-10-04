import type { SignInNotice } from "./types";

const notices: readonly SignInNotice[] = [
  "signed-out",
  "session-ended",
  "password-set",
];

/** Only known notices are shown; any other value is ignored. */
export function parseSignInNotice(value: unknown): SignInNotice | null {
  return notices.find((notice) => notice === value) ?? null;
}

/** The first value of a search parameter that may repeat. */
export function firstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

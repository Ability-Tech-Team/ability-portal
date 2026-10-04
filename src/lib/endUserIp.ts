/** IPv4, IPv6, and IPv4-mapped IPv6 addresses (no zone IDs). */
const IP_ADDRESS_PATTERN = /^[0-9A-Fa-f:.]{2,45}$/;

/**
 * The client's IP address as the Portal sees it, sent to the account service
 * for its rate limits (docs/ACCOUNT-SERVICE-API.md, section 4). The Portal's
 * reverse proxy must set `X-Real-IP` or `X-Forwarded-For` from the actual
 * connection; locally, Next.js fills `X-Forwarded-For` with the socket
 * address. Anything that doesn't look like an address is left out.
 */
export function parseEndUserIp(
  realIp: string | null,
  forwardedFor: string | null,
): string | undefined {
  const candidate = realIp?.trim() || forwardedFor?.split(",")[0]?.trim();

  return candidate && IP_ADDRESS_PATTERN.test(candidate)
    ? candidate
    : undefined;
}

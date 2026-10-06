import "server-only";
import { parseBaseUrl } from "./baseUrl";

let reportedProblem = "";

/**
 * The Portal API's base URL from the server-only `PORTAL_API_URL`, e.g.
 * `http://172.20.1.141:9995`. When it is missing or invalid, the variable
 * name is logged, never its value, and null is returned: sign-in then reports
 * the service as unavailable.
 */
export function getPortalApiUrl(): string | null {
  const url = parseBaseUrl(process.env.PORTAL_API_URL);

  if (url.status === "configured") {
    return url.baseUrl;
  }

  const problem =
    url.status === "missing"
      ? "PORTAL_API_URL is not set"
      : `PORTAL_API_URL is invalid (${url.problem})`;

  if (problem !== reportedProblem) {
    reportedProblem = problem;
    console.warn(
      `Portal API is not configured: ${problem}. Sign-in reports the service as unavailable.`,
    );
  }

  return null;
}

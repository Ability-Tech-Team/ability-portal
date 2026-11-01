import { describe, expect, it } from "vitest";
import {
  accountFromAnswer,
  decodeSignInAnswer,
  encodeSignInAnswer,
  MAX_COOKIE_VALUE_LENGTH,
  parseSignInAnswer,
  productAccessFromPlatforms,
} from "./signInAnswer";

// The portal backend's sign-in answer (2026-10-29), with made-up values.
const ANSWER = {
  step: "done",
  client: {
    code: "client",
    nameEn: "Client",
    nameAr: "العميل",
    branding: {
      nameEn: "CRM",
      nameAr: "سي آر إم",
      logoUrl: "https://bucket.s3.eu-west-1.amazonaws.com/logo.jpg?X-Amz-Expires=60",
      supportEmail: "support@example.com",
      websiteUrl: "https://example.com",
      addressEn: null,
      addressAr: null,
    },
  },
  platforms: [
    { key: "crm", url: "http://localhost:3100/", apiUrl: "http://172.20.1.141:9999" },
    { key: "community-admin", url: "http://localhost:3200/", apiUrl: "http://172.20.1.141:9998" },
  ],
  mustChangePassword: false,
  session: {
    employee_id: "00000000-0000-4000-8000-000000000001",
    role_name: "Super Admin",
    role_id: "00000000-0000-4000-8000-000000000002",
    user_name: "superAdmin",
    employee_name: "Super Admin",
    department_id: null,
    company_project_id: 2,
    company_code: "MAIN",
    employee_type_id: 1,
    project_code: "MAIN",
    project_name: "Main Project",
    employee_type_name: "Master Account",
    safe_id: 1,
    safe_name: "Default Safe",
    must_change_password: 0,
    platforms: ["crm", "community-admin"],
  },
};

describe("parseSignInAnswer", () => {
  it("keeps what the products read and drops the rest", () => {
    const answer = parseSignInAnswer(ANSWER);

    expect(answer?.session.employee_name).toBe("Super Admin");
    expect(answer?.platforms?.[0].apiUrl).toBe("http://172.20.1.141:9999");
    expect(answer?.client?.branding?.logoUrl).toContain("X-Amz-Expires");
    expect(answer).not.toHaveProperty("step");
    expect(answer).not.toHaveProperty("mustChangePassword");
    expect(answer?.client?.branding).not.toHaveProperty("supportEmail");
  });

  it.each([
    ["nothing", null],
    ["a string", "done"],
    ["an answer without a session", { ...ANSWER, session: undefined }],
    ["a session with a wrong type", { ...ANSWER, session: { ...ANSWER.session, safe_id: "one" } }],
    ["a malformed platform", { ...ANSWER, platforms: [{ apiUrl: "x" }] }],
  ])("rejects %s", (_, value) => {
    expect(parseSignInAnswer(value)).toBeNull();
  });
});

describe("the session cookie value", () => {
  it("round-trips through base64url, including Arabic text", () => {
    const answer = parseSignInAnswer(ANSWER)!;
    const value = encodeSignInAnswer(answer)!;

    expect(value).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeSignInAnswer(value)).toEqual(answer);
  });

  it("is what Ability CRM's parser reads: base64url of the JSON", () => {
    const value = encodeSignInAnswer(parseSignInAnswer(ANSWER)!)!;
    const json = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));

    expect(Object.keys(json).sort()).toEqual(["client", "platforms", "session"]);
    expect(json.client.nameAr).toBe("العميل");
  });

  it("refuses an answer that doesn't fit in a cookie", () => {
    const answer = parseSignInAnswer({
      ...ANSWER,
      client: { ...ANSWER.client, branding: { logoUrl: `https://x.example/${"a".repeat(4000)}` } },
    })!;

    expect(encodeSignInAnswer(answer)).toBeNull();
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["not base64url", "not a cookie!"],
    ["not JSON", Buffer.from("{oops", "utf8").toString("base64url")],
    ["too long", "a".repeat(MAX_COOKIE_VALUE_LENGTH + 1)],
  ])("reads nothing from a %s value", (_, raw) => {
    expect(decodeSignInAnswer(raw)).toBeNull();
  });
});

describe("productAccessFromPlatforms", () => {
  it("opens only the listed products", () => {
    expect(productAccessFromPlatforms(["crm", "community-admin"])).toEqual({
      crm: "available",
      communityAdmin: "available",
    });
    expect(productAccessFromPlatforms(["crm"])).toEqual({
      crm: "available",
      communityAdmin: "not_included",
    });
  });

  it("never assumes access without the list", () => {
    expect(productAccessFromPlatforms(null)).toEqual({
      crm: "not_included",
      communityAdmin: "not_included",
    });
    expect(productAccessFromPlatforms(["communityAdmin", "CRM"])).toEqual({
      crm: "not_included",
      communityAdmin: "not_included",
    });
  });
});

describe("accountFromAnswer", () => {
  it("shows the employee's name and organization", () => {
    expect(accountFromAnswer(parseSignInAnswer(ANSWER)!)).toEqual({
      name: "Super Admin",
      organizationEn: "Client",
      organizationAr: "العميل",
    });
  });

  it("falls back to the user name", () => {
    const answer = parseSignInAnswer({
      ...ANSWER,
      client: null,
      session: { ...ANSWER.session, employee_name: "  " },
    })!;

    expect(accountFromAnswer(answer)).toEqual({
      name: "superAdmin",
      organizationEn: null,
      organizationAr: null,
    });
  });
});

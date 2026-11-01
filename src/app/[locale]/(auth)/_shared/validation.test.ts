import { describe, expect, it } from "vitest";
import { validateSignInFields } from "../sign-in/schema";
import { parseSignInNotice } from "../sign-in/utils";
import { countCharacters, toRetryMinutes, validateEmail } from "./validation";

describe("validateEmail", () => {
  it.each(["owner@client.example", "o'brien+crm@sub.example.co"])(
    "accepts %j",
    (email) => {
      expect(validateEmail(email)).toBeNull();
    },
  );

  it("requires an address", () => {
    expect(validateEmail("")).toBe("email_required");
  });

  it.each(["owner", "owner@", "@client.example", "own er@client.example", `${"a".repeat(250)}@b.co`])(
    "rejects %j",
    (email) => {
      expect(validateEmail(email)).toBe("email_invalid");
    },
  );
});

describe("validateSignInFields", () => {
  it("accepts any non-empty password as typed", () => {
    expect(
      validateSignInFields({ email: "a@b.co", password: "  short " }),
    ).toEqual({});
  });

  it("reports each missing field", () => {
    expect(validateSignInFields({ email: "", password: "" })).toEqual({
      email: "email_required",
      password: "password_required",
    });
  });

  it("rejects passwords longer than the backend allows (128)", () => {
    expect(
      validateSignInFields({ email: "a@b.co", password: "x".repeat(128) }),
    ).toEqual({});
    expect(
      validateSignInFields({ email: "a@b.co", password: "x".repeat(129) })
        .password,
    ).toBe("password_too_long");
  });

  it("counts Unicode characters, not UTF-16 units", () => {
    const keys = "🔑".repeat(128);
    expect(countCharacters(keys)).toBe(128);
    expect(validateSignInFields({ email: "a@b.co", password: keys })).toEqual({});
  });
});

describe("toRetryMinutes", () => {
  it.each([
    [null, null],
    [0, 1],
    [59, 1],
    [61, 2],
    [900, 15],
  ])("%j seconds is %j minutes", (seconds, minutes) => {
    expect(toRetryMinutes(seconds)).toBe(minutes);
  });
});

describe("parseSignInNotice", () => {
  it("accepts only known notices", () => {
    expect(parseSignInNotice("session-ended")).toBe("session-ended");
    expect(parseSignInNotice("password-set")).toBeNull();
    expect(parseSignInNotice("<b>hi</b>")).toBeNull();
    expect(parseSignInNotice(undefined)).toBeNull();
  });
});

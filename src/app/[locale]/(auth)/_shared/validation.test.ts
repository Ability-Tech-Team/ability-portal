import { describe, expect, it } from "vitest";
import { validateSignInFields } from "../sign-in/schema";
import { parseSignInNotice } from "../sign-in/utils";
import { readTokenFromHash, toPasswordFieldError } from "../set-password/utils";
import {
  countCharacters,
  toRetryMinutes,
  validateEmail,
  validateNewPassword,
} from "./validation";

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

  it("rejects passwords longer than the contract allows", () => {
    expect(
      validateSignInFields({ email: "a@b.co", password: "x".repeat(257) })
        .password,
    ).toBe("password_too_long");
  });
});

describe("validateNewPassword", () => {
  const fifteen = "correct horse b";

  it("accepts 15 characters that match", () => {
    expect(validateNewPassword(fifteen, fifteen)).toEqual({});
  });

  it("counts Unicode characters, not UTF-16 units", () => {
    const emoji = "🔑".repeat(14);
    expect(countCharacters(emoji)).toBe(14);
    expect(validateNewPassword(emoji, emoji).password).toBe(
      "password_too_short",
    );
  });

  it.each([
    ["", "", { password: "password_required", confirmPassword: "confirmation_required" }],
    ["short", "short", { password: "password_too_short" }],
    ["x".repeat(129), "x".repeat(129), { password: "password_too_long" }],
    [fifteen, `${fifteen}!`, { confirmPassword: "confirmation_mismatch" }],
  ])("checks %j / %j", (password, confirmation, expected) => {
    expect(validateNewPassword(password, confirmation)).toEqual(expected);
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
    expect(parseSignInNotice("password-set")).toBe("password-set");
    expect(parseSignInNotice("<b>hi</b>")).toBeNull();
    expect(parseSignInNotice(undefined)).toBeNull();
  });
});

describe("readTokenFromHash", () => {
  const token = "T".repeat(43);

  it("reads the token from the fragment", () => {
    expect(readTokenFromHash(`#token=${token}`)).toBe(token);
  });

  it.each(["", "#", "#token=short", `#other=${token}`])(
    "finds no token in %j",
    (hash) => {
      expect(readTokenFromHash(hash)).toBeNull();
    },
  );
});

describe("toPasswordFieldError", () => {
  it("maps each rule to a field error", () => {
    expect(toPasswordFieldError("too_short")).toBe("password_too_short");
    expect(toPasswordFieldError("too_common")).toBe("password_too_common");
    expect(toPasswordFieldError("other")).toBe("password_rejected");
  });
});

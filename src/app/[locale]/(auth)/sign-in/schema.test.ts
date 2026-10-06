import { describe, expect, it } from "vitest";
import { parseClientCode, parseProjectId } from "./schema";

describe("parseClientCode", () => {
  it.each([
    ["golf-marina", "golf-marina"],
    ["", undefined],
    ["Golf", undefined],
    ["-golf", undefined],
    ["a".repeat(31), undefined],
  ])("reads %j as %j", (value, expected) => {
    expect(parseClientCode(value)).toBe(expected);
  });
});

describe("parseProjectId", () => {
  it.each([
    ["3", 3],
    ["", undefined],
    ["0", undefined],
    ["-1", undefined],
    ["1.5", undefined],
    ["1e3", undefined],
    ["9999999999", undefined],
  ])("reads %j as %j", (value, expected) => {
    expect(parseProjectId(value)).toBe(expected);
  });
});

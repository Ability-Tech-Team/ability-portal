import { describe, expect, it } from "vitest";
import { parseProductDestination } from "./productDestinations";

describe("parseProductDestination", () => {
  it.each([undefined, "", "   "])("treats %j as missing", (value) => {
    expect(parseProductDestination(value)).toEqual({ status: "missing" });
  });

  it.each([
    ["http://localhost:3100", "http://localhost:3100"],
    ["http://localhost:3100/", "http://localhost:3100"],
    ["  https://crm.example.com  ", "https://crm.example.com"],
    ["HTTPS://CRM.Example.com", "https://crm.example.com"],
    ["https://apps.example.com/crm/", "https://apps.example.com/crm"],
    ["http://127.0.0.1:3200", "http://127.0.0.1:3200"],
    ["http://[::1]:3200", "http://[::1]:3200"],
    ["http://crm.localhost:3100", "http://crm.localhost:3100"],
    ["http://172.20.1.141:9995", "http://172.20.1.141:9995"],
    ["http://10.0.0.5/crm", "http://10.0.0.5/crm"],
    ["http://192.168.1.20:3100", "http://192.168.1.20:3100"],
  ])("accepts %j", (value, baseUrl) => {
    expect(parseProductDestination(value)).toEqual({
      status: "configured",
      baseUrl,
    });
  });

  it.each([
    ["crm.example.com", "malformed"],
    ["/crm", "malformed"],
    ["//crm.example.com", "malformed"],
    ["localhost:3100", "unsupported-protocol"],
    ["javascript:alert(1)", "unsupported-protocol"],
    ["data:text/html,hello", "unsupported-protocol"],
    ["ftp://crm.example.com", "unsupported-protocol"],
    ["http://crm.example.com", "insecure-http"],
    ["http://localhost.example.com", "insecure-http"],
    ["http://172.32.0.1", "insecure-http"],
    ["http://8.8.8.8", "insecure-http"],
    ["http://10.example.com", "insecure-http"],
    ["https://user:secret@crm.example.com", "credentials"],
    ["https://token@crm.example.com", "credentials"],
    ["https://crm.example.com/?token=abc", "query-or-fragment"],
    ["https://crm.example.com/#access_token=abc", "query-or-fragment"],
  ])("rejects %j (%s)", (value, problem) => {
    expect(parseProductDestination(value)).toEqual({
      status: "invalid",
      problem,
    });
  });
});

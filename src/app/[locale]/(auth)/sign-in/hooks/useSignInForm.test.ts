import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { completeSignIn } from "../actions";
import { signIn } from "@/src/services/portalAuth";
import { submitSignIn } from "./useSignInForm";

vi.mock("../actions", () => ({ completeSignIn: vi.fn() }));
vi.mock("@/src/services/portalAuth", () => ({ signIn: vi.fn() }));
vi.mock("@/src/lib/portalApi", () => ({
  getPortalApiUrl: () => "https://api.example.com/portal",
}));

const IDLE = { status: "idle", email: "" } as const;

function form() {
  const data = new FormData();
  data.set("email", "user@example.com");
  data.set("password", "a-password");
  data.set("locale", "en");
  data.set("returnTo", "https://crm.example.com/en");
  return data;
}

describe("submitSignIn", () => {
  beforeEach(() => {
    vi.mocked(signIn).mockResolvedValue({ ok: true, answer: { step: "done" } });
  });

  it("hands the answer, never the password, to the Portal's server", async () => {
    vi.mocked(completeSignIn).mockResolvedValue(IDLE);

    await submitSignIn(IDLE, form());

    expect(completeSignIn).toHaveBeenCalledWith({
      email: "user@example.com",
      answer: { step: "done" },
      returnTo: "https://crm.example.com/en",
      locale: "en",
    });
  });

  it("reports a refused session store as unavailable instead of throwing", async () => {
    // What the browser gets when a proxy answers the action with its own page.
    vi.mocked(completeSignIn).mockRejectedValue(
      new Error("An unexpected response was received from the server."),
    );

    await expect(submitSignIn(IDLE, form())).resolves.toEqual({
      status: "failed",
      email: "user@example.com",
      error: "unavailable",
      retryAfterMinutes: null,
    });
  });

  it("lets the redirect to the next page through", async () => {
    let redirectError: unknown;
    try {
      redirect("https://crm.example.com/en");
    } catch (error) {
      redirectError = error;
    }
    vi.mocked(completeSignIn).mockRejectedValue(redirectError);

    await expect(submitSignIn(IDLE, form())).rejects.toBe(redirectError);
  });
});

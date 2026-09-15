import { describe, expect, it } from "vitest";
import {
  requestPasswordResetSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "@/lib/validation/auth";

describe("signUpSchema", () => {
  it("accepts a valid sign-up with age confirmed", () => {
    const result = signUpSchema.safeParse({
      email: "reader@example.com",
      password: "correct-horse-battery",
      ageConfirmed: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects sign-up when age is not confirmed", () => {
    const result = signUpSchema.safeParse({
      email: "reader@example.com",
      password: "correct-horse-battery",
      ageConfirmed: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = signUpSchema.safeParse({
      email: "not-an-email",
      password: "correct-horse-battery",
      ageConfirmed: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = signUpSchema.safeParse({
      email: "reader@example.com",
      password: "short",
      ageConfirmed: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("requires a non-empty password", () => {
    const result = signInSchema.safeParse({ email: "reader@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("requestPasswordResetSchema", () => {
  it("requires a valid email", () => {
    expect(requestPasswordResetSchema.safeParse({ email: "x" }).success).toBe(false);
    expect(
      requestPasswordResetSchema.safeParse({ email: "reader@example.com" }).success,
    ).toBe(true);
  });
});

describe("updatePasswordSchema", () => {
  it("rejects mismatched passwords", () => {
    const result = updatePasswordSchema.safeParse({
      password: "correct-horse-battery",
      confirmPassword: "different-password",
    });
    expect(result.success).toBe(false);
  });

  it("accepts matching passwords", () => {
    const result = updatePasswordSchema.safeParse({
      password: "correct-horse-battery",
      confirmPassword: "correct-horse-battery",
    });
    expect(result.success).toBe(true);
  });
});

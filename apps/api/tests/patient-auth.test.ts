import { describe, expect, test } from "bun:test";
import {
  generateCode,
  generateSessionToken,
  hashCode,
  hashToken,
  normalizePhone,
  safeEqual,
} from "@api/features/patient-auth/services/tokens";

describe("patient auth tokens", () => {
  test("normalizes common phone punctuation", () => {
    expect(normalizePhone("+254 (711) 000-101")).toBe("+254711000101");
  });

  test("generates six-digit codes, including leading zeros", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generateCode()).toMatch(/^\d{6}$/);
    }
  });

  test("session tokens are opaque and hashed one way", () => {
    const token = generateSessionToken();
    expect(token.length).toBeGreaterThanOrEqual(32);
    expect(hashToken(token)).toHaveLength(64);
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(hashToken(`${token}x`));
  });

  test("codes are bound to the patient and compare in constant time", () => {
    expect(hashCode("patient-1-clinic-1", "123456")).toBe(
      hashCode("patient-1-clinic-1", "123456"),
    );
    expect(hashCode("patient-1-clinic-1", "123456")).not.toBe(
      hashCode("patient-2-clinic-1", "123456"),
    );
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
});

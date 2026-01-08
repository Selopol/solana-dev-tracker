import { describe, expect, it } from "vitest";
import { calculateReputationScore, calculateMigrationSuccessRate } from "./scoringService";

describe("Reputation Scoring", () => {
  it("calculates reputation score correctly for high-performing developer", () => {
    const score = calculateReputationScore({
      totalTokens: 20,
      migratedTokens: 15,
      bondedTokens: 12,
      failedTokens: 2,
    });

    // Migration rate: 75% (15/20) * 40 = 30
    // Launch volume: min(20/10, 1) * 20 = 20
    // Success ratio: 12/20 * 30 = 18
    // Consistency: (1 - 2/20) * 10 = 9
    // Total should be around 77
    expect(score).toBeGreaterThanOrEqual(75);
    expect(score).toBeLessThanOrEqual(80);
  });

  it("calculates reputation score correctly for low-performing developer", () => {
    const score = calculateReputationScore({
      totalTokens: 10,
      migratedTokens: 2,
      bondedTokens: 1,
      failedTokens: 7,
    });

    // Migration rate: 20% (2/10) * 40 = 8
    // Launch volume: min(10/10, 1) * 20 = 20
    // Success ratio: 1/10 * 30 = 3
    // Consistency: (1 - 7/10) * 10 = 3
    // Total should be around 34
    expect(score).toBeGreaterThanOrEqual(30);
    expect(score).toBeLessThanOrEqual(40);
  });

  it("handles developer with no tokens", () => {
    const score = calculateReputationScore({
      totalTokens: 0,
      migratedTokens: 0,
      bondedTokens: 0,
      failedTokens: 0,
    });

    // With no tokens, consistency component gives 10 points
    expect(score).toBe(10);
  });

  it("caps score at 100", () => {
    const score = calculateReputationScore({
      totalTokens: 100,
      migratedTokens: 100,
      bondedTokens: 100,
      failedTokens: 0,
    });

    expect(score).toBeLessThanOrEqual(100);
  });

  it("ensures score is non-negative", () => {
    const score = calculateReputationScore({
      totalTokens: 5,
      migratedTokens: 0,
      bondedTokens: 0,
      failedTokens: 5,
    });

    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe("Migration Success Rate", () => {
  it("calculates 100% success rate", () => {
    const rate = calculateMigrationSuccessRate(10, 10);
    expect(rate).toBe(100);
  });

  it("calculates 50% success rate", () => {
    const rate = calculateMigrationSuccessRate(10, 5);
    expect(rate).toBe(50);
  });

  it("calculates 0% success rate", () => {
    const rate = calculateMigrationSuccessRate(10, 0);
    expect(rate).toBe(0);
  });

  it("handles zero total tokens", () => {
    const rate = calculateMigrationSuccessRate(0, 0);
    expect(rate).toBe(0);
  });

  it("rounds to nearest integer", () => {
    const rate = calculateMigrationSuccessRate(3, 2);
    expect(rate).toBe(67); // 66.666... rounded to 67
  });
});

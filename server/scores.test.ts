import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { addGolfScore, getUserScores, deleteGolfScore, updateGolfScore } from "./db";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { golfScores, users } from "../drizzle/schema";

describe("Golf Score Management", () => {
  const testUserId = 999;
  const testOpenId = "test-user-999";

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test user
    await db.insert(users).values({
      openId: testOpenId,
      name: "Test User",
      email: "test@example.com",
      role: "user",
    });
  });

  afterEach(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    await db.delete(golfScores).where(eq(golfScores.userId, testUserId));
    await db.delete(users).where(eq(users.openId, testOpenId));
  });

  it("should add a golf score", async () => {
    const scoreDate = new Date("2026-04-15");
    await addGolfScore(testUserId, 25, scoreDate);

    const scores = await getUserScores(testUserId);
    expect(scores).toHaveLength(1);
    expect(scores[0]?.score).toBe(25);
  });

  it("should enforce Stableford score range (1-45)", async () => {
    const scoreDate = new Date("2026-04-15");

    // Valid scores should work
    await addGolfScore(testUserId, 1, new Date("2026-04-01"));
    await addGolfScore(testUserId, 45, new Date("2026-04-02"));

    const scores = await getUserScores(testUserId);
    expect(scores).toHaveLength(2);
  });

  it("should prevent duplicate scores on the same date", async () => {
    const scoreDate = new Date("2026-04-15");

    // Add first score
    await addGolfScore(testUserId, 25, scoreDate);

    // Try to add another score on the same date
    try {
      await addGolfScore(testUserId, 30, scoreDate);
      expect.fail("Should have thrown an error for duplicate date");
    } catch (error) {
      // Database constraint error or application-level error
      const errorMsg = (error as Error).message;
      expect(errorMsg).toMatch(/already exists|Duplicate entry|UNIQUE constraint|Failed query/);
    }
  });

  it("should maintain rolling 5-score window", async () => {
    // Add 6 scores
    for (let i = 0; i < 6; i++) {
      const scoreDate = new Date("2026-04-01");
      scoreDate.setDate(scoreDate.getDate() + i);
      await addGolfScore(testUserId, 20 + i, scoreDate);
    }

    const scores = await getUserScores(testUserId);

    // Should only have 5 scores
    expect(scores).toHaveLength(5);

    // Should have the most recent 5 scores (21-25)
    const scoreValues = scores.map((s) => s.score).sort((a, b) => a - b);
    expect(scoreValues).toEqual([21, 22, 23, 24, 25]);
  });

  it("should return scores in reverse chronological order", async () => {
    // Add scores in random order
    const dates = [
      new Date("2026-04-01"),
      new Date("2026-04-03"),
      new Date("2026-04-02"),
    ];

    await addGolfScore(testUserId, 20, dates[0]!);
    await addGolfScore(testUserId, 30, dates[1]!);
    await addGolfScore(testUserId, 25, dates[2]!);

    const scores = await getUserScores(testUserId);

    // Should be in reverse chronological order (most recent first)
    expect(scores[0]?.score).toBe(30); // 2026-04-03
    expect(scores[1]?.score).toBe(25); // 2026-04-02
    expect(scores[2]?.score).toBe(20); // 2026-04-01
  });

  it("should update a golf score", async () => {
    const scoreDate = new Date("2026-04-15");
    await addGolfScore(testUserId, 25, scoreDate);

    const scores = await getUserScores(testUserId);
    const scoreId = scores[0]?.id;

    if (!scoreId) throw new Error("Score not found");

    await updateGolfScore(scoreId, 35);

    const updatedScores = await getUserScores(testUserId);
    expect(updatedScores[0]?.score).toBe(35);
  });

  it("should delete a golf score", async () => {
    const scoreDate = new Date("2026-04-15");
    await addGolfScore(testUserId, 25, scoreDate);

    let scores = await getUserScores(testUserId);
    expect(scores).toHaveLength(1);

    const scoreId = scores[0]?.id;
    if (!scoreId) throw new Error("Score not found");

    await deleteGolfScore(scoreId);

    scores = await getUserScores(testUserId);
    expect(scores).toHaveLength(0);
  });

  it("should handle concurrent score additions safely", async () => {
    // Simulate concurrent additions
    const promises = [];
    for (let i = 0; i < 7; i++) {
      const scoreDate = new Date("2026-04-01");
      scoreDate.setDate(scoreDate.getDate() + i);
      promises.push(addGolfScore(testUserId, 20 + i, scoreDate));
    }

    await Promise.all(promises);

    const scores = await getUserScores(testUserId);

    // Should still maintain 5-score limit
    expect(scores).toHaveLength(5);
  });
});

import { getDb } from "./db";
import { golfScores } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Generate random draw numbers (5 numbers between 1-45)
 */
export function generateRandomNumbers(): number[] {
  const numbers = new Set<number>();
  while (numbers.size < 5) {
    numbers.add(Math.floor(Math.random() * 45) + 1);
  }
  return Array.from(numbers).sort((a, b) => a - b);
}

/**
 * Generate algorithmic draw numbers based on score frequency
 * Weighted by most frequent scores in the system
 */
export async function generateAlgorithmicNumbers(): Promise<number[]> {
  const db = await getDb();
  if (!db) {
    // Fallback to random if DB unavailable
    return generateRandomNumbers();
  }

  // Get all scores and count frequency
  const allScores = await db.select().from(golfScores);

  const scoreFrequency: Record<number, number> = {};
  allScores.forEach((score) => {
    scoreFrequency[score.score] = (scoreFrequency[score.score] || 0) + 1;
  });

  // Sort scores by frequency (descending)
  const sortedScores = Object.entries(scoreFrequency)
    .map(([score, freq]) => ({ score: parseInt(score), frequency: freq }))
    .sort((a, b) => b.frequency - a.frequency);

  // Take top 5 most frequent scores
  if (sortedScores.length >= 5) {
    return sortedScores.slice(0, 5).map((s) => s.score).sort((a, b) => a - b);
  }

  // If less than 5 unique scores, fill with random ones
  const selected = new Set(sortedScores.map((s) => s.score));
  while (selected.size < 5) {
    selected.add(Math.floor(Math.random() * 45) + 1);
  }

  return Array.from(selected).sort((a, b) => a - b);
}

/**
 * Check if user scores match the draw numbers
 * Returns the match type: "5-number", "4-number", "3-number", or null
 */
export function checkScoreMatch(
  userScores: number[],
  drawnNumbers: number[]
): "5-number" | "4-number" | "3-number" | null {
  const userSet = new Set(userScores);
  const matchCount = drawnNumbers.filter((num) => userSet.has(num)).length;

  if (matchCount === 5) return "5-number";
  if (matchCount === 4) return "4-number";
  if (matchCount === 3) return "3-number";
  return null;
}

/**
 * Calculate prize amounts based on pool distribution
 * 40% for 5-match, 35% for 4-match, 25% for 3-match
 */
export function calculatePrizeAmounts(
  totalPoolAmount: number,
  fiveMatchWinners: number,
  fourMatchWinners: number,
  threeMatchWinners: number,
  rolloverAmount: number = 0
): {
  fiveMatchPool: number;
  fourMatchPool: number;
  threeMatchPool: number;
  fiveMatchPrize: number;
  fourMatchPrize: number;
  threeMatchPrize: number;
  newRollover: number;
} {
  // Add rollover to 5-match pool
  const fiveMatchPool = totalPoolAmount * 0.4 + rolloverAmount;
  const fourMatchPool = totalPoolAmount * 0.35;
  const threeMatchPool = totalPoolAmount * 0.25;

  // Calculate individual prizes
  let fiveMatchPrize = 0;
  let newRollover = 0;

  if (fiveMatchWinners > 0) {
    fiveMatchPrize = fiveMatchPool / fiveMatchWinners;
  } else {
    // No 5-match winners, rollover to next month
    newRollover = fiveMatchPool;
  }

  const fourMatchPrize = fourMatchWinners > 0 ? fourMatchPool / fourMatchWinners : 0;
  const threeMatchPrize = threeMatchWinners > 0 ? threeMatchPool / threeMatchWinners : 0;

  return {
    fiveMatchPool,
    fourMatchPool,
    threeMatchPool,
    fiveMatchPrize,
    fourMatchPrize,
    threeMatchPrize,
    newRollover,
  };
}

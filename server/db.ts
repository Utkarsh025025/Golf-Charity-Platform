import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  charities,
  draws,
  golfScores,
  subscriptions,
  userCharities,
  winners,
  type InsertSubscription,
  type InsertUser,
  type InsertWinner,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db
      .insert(users)
      .values(values)
      .onDuplicateKeyUpdate({
        set: updateSet,
      });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Golf Score Queries
 */
export async function getUserScores(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(golfScores)
    .where(eq(golfScores.userId, userId))
    .orderBy(desc(golfScores.scoreDate))
    .limit(5);

  return result;
}

export async function addGolfScore(
  userId: number,
  score: number,
  scoreDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if score already exists for this date
  const existing = await db
    .select()
    .from(golfScores)
    .where(
      and(
        eq(golfScores.userId, userId),
        eq(golfScores.scoreDate, scoreDate)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error("Score already exists for this date");
  }

  // Get all scores for this user, ordered by date descending
  const allScores = await db
    .select()
    .from(golfScores)
    .where(eq(golfScores.userId, userId))
    .orderBy(desc(golfScores.scoreDate));

  // If we have 5 scores, delete the oldest one
  if (allScores.length >= 5) {
    const oldestScore = allScores[allScores.length - 1];
    if (oldestScore) {
      await db.delete(golfScores).where(eq(golfScores.id, oldestScore.id));
    }
  }

  // Add the new score
  const result = await db.insert(golfScores).values({
    userId,
    score,
    scoreDate,
  });

  return result;
}

export async function updateGolfScore(scoreId: number, score: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(golfScores).set({ score }).where(eq(golfScores.id, scoreId));
}

export async function deleteGolfScore(scoreId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(golfScores).where(eq(golfScores.id, scoreId));
}

/**
 * Subscription Queries
 */
export async function getSubscription(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function createSubscription(data: InsertSubscription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(subscriptions).values(data);
}

export async function updateSubscription(
  userId: number,
  data: Partial<InsertSubscription>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(subscriptions)
    .set(data)
    .where(eq(subscriptions.userId, userId));
}

export async function getActiveSubscribers() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.status, "active"));

  return result;
}

/**
 * Charity Queries
 */
export async function getAllCharities() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(charities)
    .orderBy(desc(charities.featured), asc(charities.name));

  return result;
}

export async function getCharityById(charityId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(charities)
    .where(eq(charities.id, charityId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getUserCharity(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(userCharities)
    .where(eq(userCharities.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function setUserCharity(
  userId: number,
  charityId: number,
  contributionPercentage: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Ensure minimum 10% contribution
  if (contributionPercentage < 10) {
    throw new Error("Minimum contribution is 10%");
  }

  // Check if user already has a charity
  const existing = await getUserCharity(userId);

  if (existing) {
    await db
      .update(userCharities)
      .set({ charityId, contributionPercentage: contributionPercentage.toString() })
      .where(eq(userCharities.userId, userId));
  } else {
    await db.insert(userCharities).values({
      userId,
      charityId,
      contributionPercentage: contributionPercentage.toString(),
    });
  }
}

/**
 * Draw Queries
 */
export async function getCurrentMonthDraw() {
  const db = await getDb();
  if (!db) return null;

  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  firstDayOfMonth.setHours(0, 0, 0, 0);

  const result = await db
    .select()
    .from(draws)
    .where(eq(draws.drawMonth, firstDayOfMonth))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function createDraw(
  drawMonth: Date,
  drawLogic: "random" | "algorithmic"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(draws).values({
    drawMonth,
    drawLogic,
    status: "pending",
  });

  return result;
}

export async function getDrawById(drawId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(draws)
    .where(eq(draws.id, drawId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Winner Queries
 */
export async function createWinner(data: InsertWinner) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(winners).values(data);
}

export async function getWinnersByDraw(drawId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(winners)
    .where(eq(winners.drawId, drawId));

  return result;
}

export async function updateWinnerVerification(
  winnerId: number,
  verificationStatus: "pending" | "approved" | "rejected"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(winners)
    .set({ verificationStatus, verifiedAt: new Date() })
    .where(eq(winners.id, winnerId));
}

export async function markWinnerAsPaid(winnerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(winners)
    .set({ paymentStatus: "paid", paidAt: new Date() })
    .where(eq(winners.id, winnerId));
}

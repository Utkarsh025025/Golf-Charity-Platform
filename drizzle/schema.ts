import {
  decimal,
  date,
  boolean,
  int,
  longtext,
  mediumint,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow with role-based access control.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Charities table - stores charity information for the platform.
 */
export const charities = mysqlTable("charities", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: longtext("description"),
  logoUrl: text("logoUrl"),
  bannerUrl: text("bannerUrl"),
  website: varchar("website", { length: 255 }),
  featured: boolean("featured").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Charity = typeof charities.$inferSelect;
export type InsertCharity = typeof charities.$inferInsert;

/**
 * Charity events table - tracks upcoming golf days and events.
 */
export const charityEvents = mysqlTable("charityEvents", {
  id: int("id").autoincrement().primaryKey(),
  charityId: int("charityId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: longtext("description"),
  eventDate: date("eventDate").notNull(),
  location: varchar("location", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CharityEvent = typeof charityEvents.$inferSelect;
export type InsertCharityEvent = typeof charityEvents.$inferInsert;

/**
 * User charities table - tracks which charity each user supports and contribution percentage.
 * Enforces one charity per user with unique constraint.
 */
export const userCharities = mysqlTable(
  "userCharities",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().unique(),
    charityId: int("charityId").notNull(),
    contributionPercentage: decimal("contributionPercentage", {
      precision: 5,
      scale: 2,
    })
      .default("10")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userUnique: uniqueIndex("userCharityUnique").on(table.userId),
  })
);

export type UserCharity = typeof userCharities.$inferSelect;
export type InsertUserCharity = typeof userCharities.$inferInsert;

/**
 * Subscriptions table - tracks user subscription status and plan details.
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }).notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }).unique(),
  planType: mysqlEnum("planType", ["monthly", "yearly"]).notNull(),
  status: mysqlEnum("status", ["active", "lapsed", "cancelled", "pending"])
    .default("pending")
    .notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelledAt: timestamp("cancelledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Golf scores table - stores Stableford format scores (1-45) with rolling 5-score limit.
 * Enforces one score per user per date with unique constraint.
 */
export const golfScores = mysqlTable(
  "golfScores",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    score: mediumint("score").notNull(), // Stableford format: 1-45
    scoreDate: date("scoreDate").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    // Ensure only one score per user per date
    userDateUnique: uniqueIndex("userDateUnique").on(table.userId, table.scoreDate),
  })
);

export type GolfScore = typeof golfScores.$inferSelect;
export type InsertGolfScore = typeof golfScores.$inferInsert;

/**
 * Draws table - stores monthly draw configuration and metadata.
 */
export const draws = mysqlTable("draws", {
  id: int("id").autoincrement().primaryKey(),
  drawMonth: date("drawMonth").notNull().unique(), // First day of the month
  drawLogic: mysqlEnum("drawLogic", ["random", "algorithmic"])
    .default("random")
    .notNull(),
  status: mysqlEnum("status", ["pending", "simulated", "published", "completed"])
    .default("pending")
    .notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Draw = typeof draws.$inferSelect;
export type InsertDraw = typeof draws.$inferInsert;

/**
 * Draw results table - stores the actual draw numbers and winners for each draw.
 */
export const drawResults = mysqlTable("drawResults", {
  id: int("id").autoincrement().primaryKey(),
  drawId: int("drawId").notNull(),
  matchType: mysqlEnum("matchType", ["5-number", "4-number", "3-number"]).notNull(),
  drawnNumbers: varchar("drawnNumbers", { length: 255 }).notNull(), // JSON array stored as string
  prizeAmount: decimal("prizeAmount", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DrawResult = typeof drawResults.$inferSelect;
export type InsertDrawResult = typeof drawResults.$inferInsert;

/**
 * Prize pools table - tracks prize pool calculations for each draw.
 */
export const prizePools = mysqlTable("prizePools", {
  id: int("id").autoincrement().primaryKey(),
  drawId: int("drawId").notNull(),
  totalSubscribers: int("totalSubscribers").notNull(),
  totalPoolAmount: decimal("totalPoolAmount", { precision: 12, scale: 2 }).notNull(),
  fiveMatchPool: decimal("fiveMatchPool", { precision: 12, scale: 2 }).notNull(),
  fourMatchPool: decimal("fourMatchPool", { precision: 12, scale: 2 }).notNull(),
  threeMatchPool: decimal("threeMatchPool", { precision: 12, scale: 2 }).notNull(),
  rolloverAmount: decimal("rolloverAmount", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PrizePool = typeof prizePools.$inferSelect;
export type InsertPrizePool = typeof prizePools.$inferInsert;

/**
 * Winners table - tracks draw winners and their verification/payment status.
 */
export const winners = mysqlTable("winners", {
  id: int("id").autoincrement().primaryKey(),
  drawId: int("drawId").notNull(),
  userId: int("userId").notNull(),
  matchType: mysqlEnum("matchType", ["5-number", "4-number", "3-number"]).notNull(),
  prizeAmount: decimal("prizeAmount", { precision: 12, scale: 2 }).notNull(),
  verificationStatus: mysqlEnum("verificationStatus", [
    "pending",
    "approved",
    "rejected",
  ])
    .default("pending")
    .notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid"])
    .default("pending")
    .notNull(),
  verifiedAt: timestamp("verifiedAt"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Winner = typeof winners.$inferSelect;
export type InsertWinner = typeof winners.$inferInsert;

/**
 * Winner proofs table - stores file information for winner verification submissions.
 */
export const winnerProofs = mysqlTable("winnerProofs", {
  id: int("id").autoincrement().primaryKey(),
  winnerId: int("winnerId").notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 255 }).notNull(), // S3 key for retrieval
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: int("fileSize").notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type WinnerProof = typeof winnerProofs.$inferSelect;
export type InsertWinnerProof = typeof winnerProofs.$inferInsert;

/**
 * Email logs table - tracks all email notifications sent to users.
 */
export const emailLogs = mysqlTable("emailLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  emailType: mysqlEnum("emailType", [
    "draw_result",
    "winner_alert",
    "subscription_renewal",
    "system_update",
  ]).notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["sent", "failed", "bounced"])
    .default("sent")
    .notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
});

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;

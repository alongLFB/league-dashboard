import { sqliteTable, text, integer, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  nickname: text("nickname").notNull(),
  email: text("email").notNull().unique(),
  googleId: text("google_id").unique(),
  googleEmail: text("google_email"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Verification Codes ───────────────────────────────────────────────────────
export const verificationCodes = sqliteTable(
  "verification_codes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull(),
    code: text("code").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [index("email_idx").on(table.email)]
);

// ─── Accounts ──────────────────────────────────────────────────────────────────
export const accounts = sqliteTable("accounts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  region: text("region").notNull(),
  alias: text("alias").notNull(),
  summonerId: text("summoner_id").notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  soloTier: text("solo_tier"),
  soloRank: text("solo_rank"),
  soloLp: integer("solo_lp"),
  soloWins: integer("solo_wins"),
  soloLosses: integer("solo_losses"),
  flexTier: text("flex_tier"),
  flexRank: text("flex_rank"),
  flexLp: integer("flex_lp"),
  flexWins: integer("flex_wins"),
  flexLosses: integer("flex_losses"),
  rankUpdatedAt: text("rank_updated_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Shared Accounts ──────────────────────────────────────────────────────────
export const sharedAccounts = sqliteTable(
  "shared_accounts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    canReshare: integer("can_reshare").notNull().default(0),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("account_user_unique_idx").on(table.accountId, table.userId),
  ]
);

// ─── TypeScript Types ──────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type VerificationCode = typeof verificationCodes.$inferSelect;
export type NewVerificationCode = typeof verificationCodes.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type SharedAccount = typeof sharedAccounts.$inferSelect;
export type NewSharedAccount = typeof sharedAccounts.$inferInsert;

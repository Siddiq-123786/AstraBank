import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  balance: integer("balance").notNull().default(1000),
  isAdmin: boolean("is_admin").notNull().default(false),
  isBanned: boolean("is_banned").notNull().default(false),
  isFounder: boolean("is_founder").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Transactions table for tracking Astra transfers
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").references(() => users.id),
  toUserId: varchar("to_user_id").references(() => users.id),
  amount: integer("amount").notNull(),
  type: text("type").notNull(), // 'send', 'receive', 'invest', 'earn', 'admin_adjust'
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Companies table for investment system
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  fundingGoal: integer("funding_goal").notNull(),
  currentFunding: integer("current_funding").notNull().default(0),
  teamEmails: text("team_emails").notNull(), // Comma-separated list of team member emails
  foundedAt: timestamp("founded_at").notNull().default(sql`now()`),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  isDeleted: boolean("is_deleted").notNull().default(false),
});

// Friendships table
export const friendships = pgTable("friendships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  friendId: varchar("friend_id").notNull().references(() => users.id),
  status: text("status").notNull().default('pending'), // 'pending', 'accepted', 'blocked'
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});


export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

// Transaction schemas
export const insertTransactionSchema = createInsertSchema(transactions).pick({
  fromUserId: true,
  toUserId: true,
  amount: true,
  type: true,
  description: true,
});

export const sendMoneySchema = z.object({
  toUserId: z.string().uuid(),
  amount: z.number().int().positive().max(100000), // Max 100,000 Astras per transaction
  description: z.string().trim().min(1, "Description is required").max(350),
});

// Company schemas
export const insertCompanySchema = createInsertSchema(companies).pick({
  name: true,
  description: true,
  category: true,
  fundingGoal: true,
  teamEmails: true,
  createdById: true,
});

export const createCompanySchema = z.object({
  name: z.string().trim().min(1, "Company name is required").max(100),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(500),
  category: z.string().min(1, "Category is required"),
  fundingGoal: z.number().int().positive().min(1000).max(1000000), // 1K to 1M Astras
  teamEmails: z.string().trim().refine(
    (emails) => {
      if (!emails) return false;
      const emailList = emails.split(',').map(email => email.trim()).filter(email => email.length > 0);
      // Must have at least 1 team member (plus creator makes 2 total)
      return emailList.length >= 1;
    },
    { message: "At least one team member email is required (2 people total including you)" }
  ).refine(
    (emails) => {
      const emailList = emails.split(',').map(email => email.trim()).filter(email => email.length > 0);
      // Validate all emails are @astranova.org format
      const emailRegex = /^[a-zA-Z0-9._%+-]+@astranova\.org$/i;
      return emailList.every(email => emailRegex.test(email));
    },
    { message: "All team member emails must be @astranova.org addresses" }
  ),
});

export const investmentSchema = z.object({
  companyId: z.string().uuid(),
  amount: z.number().int().positive().min(100).max(50000), // Min 100, Max 50K Astras per investment
});


export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type SendMoneyRequest = z.infer<typeof sendMoneySchema>;
export type CreateCompanyRequest = z.infer<typeof createCompanySchema>;
export type InvestmentRequest = z.infer<typeof investmentSchema>;

// API Transaction type with counterpart information
export interface ApiTransaction {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
  transactionType: 'sent' | 'received';
  counterpartEmail: string;
  counterpartIsAdmin: boolean;
}
export type User = typeof users.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Friendship = typeof friendships.$inferSelect;

// Referenced from blueprint:javascript_database and javascript_auth_all_persistance integrations
import { users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session, { Store } from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { balance?: number; isAdmin?: boolean }): Promise<User>;
  updateUserBalance(userId: string, newBalance: number): Promise<void>;
  banUser(userId: string): Promise<void>;
  unbanUser(userId: string): Promise<void>;
  makeAdmin(userId: string): Promise<void>;
  removeAdmin(userId: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  sessionStore: Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser & { balance?: number; isAdmin?: boolean }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        email: insertUser.email,
        password: insertUser.password,
        balance: insertUser.balance || 1000,
        isAdmin: insertUser.isAdmin || false,
        isBanned: false,
      })
      .returning();
    return user;
  }

  async updateUserBalance(userId: string, newBalance: number): Promise<void> {
    await db.update(users).set({ balance: newBalance }).where(eq(users.id, userId));
  }

  async banUser(userId: string): Promise<void> {
    await db.update(users).set({ isBanned: true }).where(eq(users.id, userId));
  }

  async unbanUser(userId: string): Promise<void> {
    await db.update(users).set({ isBanned: false }).where(eq(users.id, userId));
  }

  async makeAdmin(userId: string): Promise<void> {
    await db.update(users).set({ isAdmin: true }).where(eq(users.id, userId));
  }

  async removeAdmin(userId: string): Promise<void> {
    await db.update(users).set({ isAdmin: false }).where(eq(users.id, userId));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
}

export const storage = new DatabaseStorage();

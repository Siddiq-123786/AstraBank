// Referenced from blueprint:javascript_database and javascript_auth_all_persistance integrations
import { users, friendships, transactions, companies, type User, type InsertUser, type Friendship, type Transaction, type InsertTransaction, type Company, type InsertCompany } from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql } from "drizzle-orm";
import session, { Store } from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { balance?: number; isAdmin?: boolean }): Promise<User>;
  updateUserBalance(userId: string, newBalance: number): Promise<void>;
  adminAdjustBalance(userId: string, amount: number, description: string, adminId: string): Promise<{ success: boolean; error?: string }>;
  banUser(userId: string): Promise<void>;
  unbanUser(userId: string): Promise<void>;
  makeAdmin(userId: string): Promise<void>;
  removeAdmin(userId: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  // Friends functionality
  addFriend(userId: string, friendEmail: string): Promise<void>;
  getFriends(userId: string): Promise<(Pick<User, 'id' | 'email' | 'balance' | 'isAdmin'> & { friendshipStatus: string; requestedByCurrent: boolean })[]>;
  updateFriendshipStatus(userId: string, friendId: string, status: string): Promise<boolean>;
  getFriendRequests(userId: string): Promise<(Pick<User, 'id' | 'email' | 'balance' | 'isAdmin'> & { friendshipId: string })[]>;
  getRecommendedUsers(userId: string): Promise<Pick<User, 'id' | 'email' | 'isAdmin'>[]>;
  // Money transfer functionality
  sendMoney(fromUserId: string, toUserId: string, amount: number, description: string): Promise<{ success: boolean; error?: string }>;
  getTransactions(userId: string, limit?: number): Promise<(Transaction & { transactionType: 'sent' | 'received'; counterpartEmail: string; counterpartIsAdmin: boolean })[]>;
  // Company functionality
  createCompany(company: { name: string; description: string; category: string; fundingGoal: number; teamEmails: string; createdById: string }): Promise<Company>;
  getAllCompanies(): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  investInCompany(companyId: string, userId: string, amount: number): Promise<{ success: boolean; error?: string }>;
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
        balance: insertUser.balance || 2000,
        isAdmin: insertUser.isAdmin || false,
        isBanned: false,
      })
      .returning();
    return user;
  }

  async updateUserBalance(userId: string, newBalance: number): Promise<void> {
    await db.update(users).set({ balance: newBalance }).where(eq(users.id, userId));
  }

  async adminAdjustBalance(userId: string, amount: number, description: string, adminId: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await db.transaction(async (tx) => {
        // Get current user to verify they exist and get current balance
        const [user] = await tx
          .select({ balance: users.balance })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (!user) {
          return { success: false, error: "User not found" };
        }

        const newBalance = user.balance + amount;
        
        if (newBalance < 0) {
          return { success: false, error: "Adjustment would result in negative balance" };
        }

        // Update user balance
        await tx
          .update(users)
          .set({ balance: newBalance })
          .where(eq(users.id, userId));

        // Create transaction record
        await tx.insert(transactions).values({
          fromUserId: adminId,
          toUserId: userId,
          amount: Math.abs(amount),
          type: 'admin_adjust',
          description: `Admin adjustment: ${description}`
        });

        return { success: true };
      });
    } catch (error) {
      console.error('Admin balance adjustment failed:', error);
      return { success: false, error: "Failed to adjust balance" };
    }
  }

  async banUser(userId: string): Promise<void> {
    await db.update(users).set({ isBanned: true }).where(eq(users.id, userId));
  }

  async unbanUser(userId: string): Promise<void> {
    await db.update(users).set({ isBanned: false }).where(eq(users.id, userId));
  }

  async makeAdmin(userId: string): Promise<void> {
    await db.update(users).set({ 
      isAdmin: true,
      balance: 30000 
    }).where(eq(users.id, userId));
  }

  async removeAdmin(userId: string): Promise<void> {
    // Don't change balance for founder, but set regular balance for others
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (user?.isFounder) {
      // Founder keeps their balance when demoted from admin
      await db.update(users).set({ isAdmin: false }).where(eq(users.id, userId));
    } else {
      // Regular users get standard balance when losing admin status
      await db.update(users).set({ 
        isAdmin: false,
        balance: 2000 
      }).where(eq(users.id, userId));
    }
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Friends functionality
  async addFriend(userId: string, friendEmail: string): Promise<void> {
    const friend = await this.getUserByEmail(friendEmail);
    if (!friend) {
      throw new Error('User not found');
    }
    
    if (friend.id === userId) {
      throw new Error('Cannot add yourself as a friend');
    }

    // Check if friendship already exists
    const existingFriendship = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(eq(friendships.userId, userId), eq(friendships.friendId, friend.id)),
          and(eq(friendships.userId, friend.id), eq(friendships.friendId, userId))
        )
      );

    if (existingFriendship.length > 0) {
      throw new Error('Friendship already exists');
    }

    // Create friendship with pending status
    await db.insert(friendships).values({
      userId: userId,
      friendId: friend.id,
      status: 'pending'
    });
  }

  async getFriends(userId: string): Promise<(Pick<User, 'id' | 'email' | 'balance' | 'isAdmin'> & { friendshipStatus: string; requestedByCurrent: boolean })[]> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        balance: users.balance,
        isAdmin: users.isAdmin,
        friendshipStatus: friendships.status,
        friendshipUserId: friendships.userId,
        friendshipFriendId: friendships.friendId
      })
      .from(friendships)
      .innerJoin(
        users,
        or(
          and(eq(friendships.userId, userId), eq(users.id, friendships.friendId)),
          and(eq(friendships.friendId, userId), eq(users.id, friendships.userId))
        )
      )
      .where(
        or(
          eq(friendships.userId, userId),
          eq(friendships.friendId, userId)
        )
      );

    return result.map(row => ({
      id: row.id,
      email: row.email,
      balance: row.balance,
      isAdmin: row.isAdmin,
      friendshipStatus: row.friendshipStatus,
      requestedByCurrent: row.friendshipUserId === userId
    }));
  }

  async updateFriendshipStatus(userId: string, friendId: string, status: string): Promise<boolean> {
    // Only allow the recipient of a pending request to accept/reject it
    const result = await db
      .update(friendships)
      .set({ status })
      .where(
        and(
          eq(friendships.friendId, userId),      // Current user is the recipient
          eq(friendships.userId, friendId),      // The other user is the sender
          eq(friendships.status, 'pending')      // Request is still pending
        )
      );
    
    return (result.rowCount ?? 0) > 0;
  }

  async getFriendRequests(userId: string): Promise<(Pick<User, 'id' | 'email' | 'balance' | 'isAdmin'> & { friendshipId: string })[]> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        balance: users.balance,
        isAdmin: users.isAdmin,
        friendshipId: friendships.id
      })
      .from(friendships)
      .innerJoin(users, eq(users.id, friendships.userId))
      .where(
        and(
          eq(friendships.friendId, userId),
          eq(friendships.status, 'pending')
        )
      );

    return result;
  }

  async getRecommendedUsers(userId: string): Promise<Pick<User, 'id' | 'email' | 'isAdmin'>[]> {
    // Get all users except:
    // 1. The current user
    // 2. Users who are already friends (any status)
    const existingFriendIds = await db
      .select({ id: users.id })
      .from(friendships)
      .innerJoin(
        users,
        or(
          and(eq(friendships.userId, userId), eq(users.id, friendships.friendId)),
          and(eq(friendships.friendId, userId), eq(users.id, friendships.userId))
        )
      )
      .where(
        or(
          eq(friendships.userId, userId),
          eq(friendships.friendId, userId)
        )
      );

    const friendIds = existingFriendIds.map(f => f.id);
    
    const recommendations = await db
      .select({
        id: users.id,
        email: users.email,
        isAdmin: users.isAdmin
      })
      .from(users)
      .where(
        and(
          sql`${users.id} != ${userId}`,
          friendIds.length > 0 ? sql`${users.id} NOT IN (${sql.join(friendIds.map(id => sql`${id}`), sql`, `)})` : sql`true`,
          eq(users.isBanned, false)
        )
      )
      .orderBy(users.email)
      .limit(20);

    return recommendations;
  }

  async sendMoney(fromUserId: string, toUserId: string, amount: number, description: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Start transaction
      return await db.transaction(async (tx) => {
        // Verify recipient exists first
        const recipient = await tx
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, toUserId))
          .limit(1);

        if (recipient.length === 0) {
          return { success: false, error: "Recipient not found" };
        }

        // Use atomic conditional update for sender's balance to prevent race conditions
        const senderUpdate = await tx
          .update(users)
          .set({ balance: sql`${users.balance} - ${amount}` })
          .where(
            and(
              eq(users.id, fromUserId),
              sql`${users.balance} >= ${amount}`
            )
          );

        if ((senderUpdate.rowCount ?? 0) === 0) {
          return { success: false, error: "Insufficient balance or sender not found" };
        }

        // Update recipient's balance  
        await tx
          .update(users)
          .set({ balance: sql`${users.balance} + ${amount}` })
          .where(eq(users.id, toUserId));

        // Record a single transaction record (will be interpreted based on user perspective)
        await tx.insert(transactions).values({
          fromUserId: fromUserId,
          toUserId: toUserId,
          amount: amount,
          type: 'transfer',
          description: description,
        });

        return { success: true };
      });
    } catch (error) {
      console.error('Send money error:', error);
      return { success: false, error: "Transaction failed" };
    }
  }

  async getTransactions(userId: string, limit: number = 50): Promise<(Transaction & { transactionType: 'sent' | 'received'; counterpartEmail: string; counterpartIsAdmin: boolean })[]> {
    // Get base transactions
    const baseTransactions = await db
      .select()
      .from(transactions)
      .where(
        or(
          eq(transactions.fromUserId, userId),
          eq(transactions.toUserId, userId)
        )
      )
      .orderBy(desc(transactions.createdAt))
      .limit(limit);

    // Enhance with counterpart emails
    const result = await Promise.all(
      baseTransactions.map(async (transaction) => {
        const isFromUser = transaction.fromUserId === userId;
        const counterpartId = isFromUser ? transaction.toUserId : transaction.fromUserId;
        
        const counterpartUser = await db
          .select({ email: users.email, isAdmin: users.isAdmin })
          .from(users)
          .where(eq(users.id, counterpartId!))
          .limit(1);

        return {
          ...transaction,
          transactionType: isFromUser ? 'sent' as const : 'received' as const,
          counterpartEmail: counterpartUser[0]?.email || 'Unknown',
          counterpartIsAdmin: counterpartUser[0]?.isAdmin || false
        };
      })
    );

    return result;
  }

  // Company methods
  async createCompany(company: { name: string; description: string; category: string; fundingGoal: number; teamEmails: string; createdById: string }): Promise<Company> {
    const [newCompany] = await db
      .insert(companies)
      .values(company)
      .returning();
    return newCompany;
  }

  async getAllCompanies(): Promise<Company[]> {
    const allCompanies = await db
      .select()
      .from(companies)
      .orderBy(desc(companies.foundedAt));
    return allCompanies;
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id));
    return company || undefined;
  }

  async investInCompany(companyId: string, userId: string, amount: number): Promise<{ success: boolean; error?: string }> {
    try {
      await db.transaction(async (tx) => {
        // Get company details first
        const [company] = await tx.select().from(companies).where(eq(companies.id, companyId));
        if (!company) {
          throw new Error("Company not found");
        }

        // Atomic balance deduction with concurrency protection
        const investorUpdate = await tx
          .update(users)
          .set({ balance: sql`${users.balance} - ${amount}` })
          .where(and(eq(users.id, userId), sql`${users.balance} >= ${amount}`))
          .returning({ balance: users.balance });
        
        if (investorUpdate.length === 0) {
          throw new Error("Insufficient balance");
        }

        // Atomic company funding update with overfunding protection  
        const companyUpdate = await tx
          .update(companies)
          .set({ currentFunding: sql`${companies.currentFunding} + ${amount}` })
          .where(and(
            eq(companies.id, companyId),
            sql`${companies.fundingGoal} - ${companies.currentFunding} >= ${amount}`
          ))
          .returning({ currentFunding: companies.currentFunding });
          
        if (companyUpdate.length === 0) {
          const remainingFunding = company.fundingGoal - company.currentFunding;
          throw new Error(`Cannot invest ${amount} Astras. Only ${remainingFunding} Astras remaining to reach funding goal.`);
        }

        // CRITICAL: Credit the company creator with the investment funds
        const creatorUpdate = await tx
          .update(users)
          .set({ balance: sql`${users.balance} + ${amount}` })
          .where(eq(users.id, company.createdById))
          .returning({ balance: users.balance });
          
        if (creatorUpdate.length === 0) {
          throw new Error("Company creator not found");
        }

        // Record investment transaction
        await tx
          .insert(transactions)
          .values({
            fromUserId: userId,
            toUserId: company.createdById,
            amount,
            type: 'invest',
            description: `Investment in ${company.name}`,
          });
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Investment failed" };
    }
  }

}

export const storage = new DatabaseStorage();

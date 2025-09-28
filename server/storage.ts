// Referenced from blueprint:javascript_database and javascript_auth_all_persistance integrations
import { users, friendships, transactions, type User, type InsertUser, type Friendship, type Transaction, type InsertTransaction } from "@shared/schema";
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
  banUser(userId: string): Promise<void>;
  unbanUser(userId: string): Promise<void>;
  makeAdmin(userId: string): Promise<void>;
  removeAdmin(userId: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  // Friends functionality
  addFriend(userId: string, friendEmail: string): Promise<void>;
  getFriends(userId: string): Promise<(Pick<User, 'id' | 'email' | 'balance'> & { friendshipStatus: string; requestedByCurrent: boolean })[]>;
  updateFriendshipStatus(userId: string, friendId: string, status: string): Promise<boolean>;
  getFriendRequests(userId: string): Promise<(Pick<User, 'id' | 'email' | 'balance'> & { friendshipId: string })[]>;
  // Money transfer functionality
  sendMoney(fromUserId: string, toUserId: string, amount: number, description: string): Promise<{ success: boolean; error?: string }>;
  getTransactions(userId: string, limit?: number): Promise<(Transaction & { transactionType: 'sent' | 'received' })[]>;
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

  async getFriends(userId: string): Promise<(Pick<User, 'id' | 'email' | 'balance'> & { friendshipStatus: string; requestedByCurrent: boolean })[]> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        balance: users.balance,
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

  async getFriendRequests(userId: string): Promise<(Pick<User, 'id' | 'email' | 'balance'> & { friendshipId: string })[]> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        balance: users.balance,
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

  async getTransactions(userId: string, limit: number = 50): Promise<(Transaction & { transactionType: 'sent' | 'received' })[]> {
    const result = await db
      .select({
        id: transactions.id,
        fromUserId: transactions.fromUserId,
        toUserId: transactions.toUserId,
        amount: transactions.amount,
        type: transactions.type,
        description: transactions.description,
        createdAt: transactions.createdAt,
        // Add computed field for user perspective
        transactionType: sql<'sent' | 'received'>`
          CASE 
            WHEN ${transactions.fromUserId} = ${userId} THEN 'sent'
            ELSE 'received'
          END
        `.as('transactionType')
      })
      .from(transactions)
      .where(
        or(
          eq(transactions.fromUserId, userId),
          eq(transactions.toUserId, userId)
        )
      )
      .orderBy(desc(transactions.createdAt))
      .limit(limit);

    return result;
  }
}

export const storage = new DatabaseStorage();

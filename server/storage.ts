// Referenced from blueprint:javascript_database and javascript_auth_all_persistance integrations
import { users, friendships, transactions, companies, companyEquityAllocations, companyInvestments, companyEarnings, companyPayouts, type User, type InsertUser, type Friendship, type Transaction, type InsertTransaction, type Company, type InsertCompany, type CompanyEquityAllocation, type CompanyInvestment, type CompanyEarnings, type CompanyPayout } from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql } from "drizzle-orm";
import session, { Store } from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

// Custom error class for validation errors
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

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
  getUserProfile(userId: string, currentUserId: string): Promise<any>;
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
  createCompany(company: { name: string; description: string; category: string; fundingGoal: number; teamEmails: string; createdById: string; investorPoolBps: number; equityAllocations: Array<{ email: string; basisPoints: number }> }): Promise<Company>;
  getAllCompanies(): Promise<(Company & { creatorEmail: string })[]>;
  getCompany(id: string): Promise<Company | undefined>;
  deleteCompany(id: string): Promise<{ success: boolean; refundedInvestors: number; totalRefunded: number; error?: string }>;
  investInCompany(companyId: string, userId: string, amount: number): Promise<{ success: boolean; error?: string; basisPointsReceived?: number }>;
  distributeEarnings(companyId: string, grossAmount: number, distributedById: string): Promise<{ success: boolean; error?: string; adminShare?: number; investorPayouts?: number }>;
  getCompanyEquity(companyId: string): Promise<(CompanyEquityAllocation & { userEmail: string })[]>;
  getUserEquity(userId: string): Promise<(CompanyEquityAllocation & { companyName: string })[]>;
  getCompanyPayouts(companyId: string): Promise<(CompanyPayout & { userEmail: string | null; earningsDate: Date })[]>;
  getUserPayouts(userId: string): Promise<(CompanyPayout & { companyName: string; earningsDate: Date })[]>;
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

  async getUserProfile(userId: string, currentUserId: string): Promise<any> {
    // Get basic user info
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user || user.isBanned) {
      return null;
    }

    // Get friendship status between current user and profile user
    let friendshipStatus = null;
    let requestedByCurrent = false;
    if (userId !== currentUserId) {
      const friendship = await db
        .select()
        .from(friendships)
        .where(
          or(
            and(eq(friendships.userId, currentUserId), eq(friendships.friendId, userId)),
            and(eq(friendships.userId, userId), eq(friendships.friendId, currentUserId))
          )
        );
      
      if (friendship.length > 0) {
        friendshipStatus = friendship[0].status;
        requestedByCurrent = friendship[0].userId === currentUserId;
      }
    }

    // Get their friends (accepted only)
    const acceptedFriends = await db
      .select({
        id: users.id,
        email: users.email,
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
        and(
          eq(friendships.status, 'accepted'),
          or(eq(friendships.userId, userId), eq(friendships.friendId, userId))
        )
      );

    // Get their pending friend requests (sent by them)
    const pendingRequests = await db
      .select({
        id: users.id,
        email: users.email,
      })
      .from(friendships)
      .innerJoin(users, eq(users.id, friendships.friendId))
      .where(
        and(
          eq(friendships.userId, userId),
          eq(friendships.status, 'pending')
        )
      );

    // Get recent transactions involving this user (limit 10)
    const recentTransactions = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        type: transactions.type,
        description: transactions.description,
        createdAt: transactions.createdAt,
        fromUserId: transactions.fromUserId,
        toUserId: transactions.toUserId,
      })
      .from(transactions)
      .where(
        or(
          eq(transactions.fromUserId, userId),
          eq(transactions.toUserId, userId)
        )
      )
      .orderBy(desc(transactions.createdAt))
      .limit(10);

    // Get companies they've invested in
    const investments = await db
      .select({
        companyId: companyEquityAllocations.companyId,
        companyName: companies.name,
        basisPoints: companyEquityAllocations.basisPoints,
      })
      .from(companyEquityAllocations)
      .innerJoin(companies, eq(companies.id, companyEquityAllocations.companyId))
      .where(
        and(
          eq(companyEquityAllocations.userId, userId),
          eq(companies.isDeleted, false)
        )
      );

    // Get companies they've created
    const createdCompanies = await db
      .select({
        id: companies.id,
        name: companies.name,
        category: companies.category,
        currentFunding: companies.currentFunding,
        fundingGoal: companies.fundingGoal,
      })
      .from(companies)
      .where(
        and(
          eq(companies.createdById, userId),
          eq(companies.isDeleted, false)
        )
      );

    return {
      id: user.id,
      email: user.email,
      balance: user.balance,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      friendshipStatus,
      requestedByCurrent,
      friends: acceptedFriends,
      pendingRequests,
      recentTransactions,
      investments,
      createdCompanies,
    };
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
        isBanned: users.isBanned,
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

    // Filter out banned users from the results
    return result
      .filter(row => !row.isBanned)
      .map(row => ({
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
          eq(friendships.status, 'pending'),
          eq(users.isBanned, false)
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
  async createCompany(company: { name: string; description: string; category: string; fundingGoal: number; teamEmails: string; createdById: string; investorPoolBps: number; equityAllocations: Array<{ email: string; basisPoints: number }> }): Promise<Company> {
    return await db.transaction(async (tx) => {
      // Get all active admins to allocate 1.5% each
      const admins = await tx.select().from(users).where(and(eq(users.isAdmin, true), eq(users.isBanned, false)));
      const adminBpsPerAdmin = 150; // 1.5% per admin
      const totalAdminBps = adminBpsPerAdmin * admins.length;

      // Validate total equity doesn't exceed 100% (with ±1 bps tolerance for rounding)
      const totalFounderBps = company.equityAllocations.reduce((sum, alloc) => sum + alloc.basisPoints, 0);
      if (totalFounderBps + company.investorPoolBps + totalAdminBps > 10001) {
        throw new ValidationError("Total equity (founder allocations + investor pool + admin allocations) cannot exceed 100%");
      }

      // Create the company
      const [newCompany] = await tx
        .insert(companies)
        .values({
          name: company.name,
          description: company.description,
          category: company.category,
          fundingGoal: company.fundingGoal,
          teamEmails: company.teamEmails,
          createdById: company.createdById,
          investorPoolBps: company.investorPoolBps,
          allocatedInvestorBps: 0,
          treasuryBalance: 0,
        })
        .returning();

      // Allocate 1.5% equity to each admin automatically
      for (const admin of admins) {
        await tx.insert(companyEquityAllocations).values({
          companyId: newCompany.id,
          userId: admin.id,
          basisPoints: adminBpsPerAdmin,
          canReceivePayouts: true,
        });
      }

      // Create equity allocations for founders/team members
      for (const allocation of company.equityAllocations) {
        // Find user by email
        const [user] = await tx
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, allocation.email))
          .limit(1);

        if (user) {
          await tx.insert(companyEquityAllocations).values({
            companyId: newCompany.id,
            userId: user.id,
            basisPoints: allocation.basisPoints,
            canReceivePayouts: true,
          });
        }
      }

      return newCompany;
    });
  }

  async getAllCompanies(): Promise<(Company & { creatorEmail: string })[]> {
    const allCompanies = await db
      .select({
        id: companies.id,
        name: companies.name,
        description: companies.description,
        category: companies.category,
        fundingGoal: companies.fundingGoal,
        currentFunding: companies.currentFunding,
        teamEmails: companies.teamEmails,
        foundedAt: companies.foundedAt,
        createdById: companies.createdById,
        isDeleted: companies.isDeleted,
        investorPoolBps: companies.investorPoolBps,
        allocatedInvestorBps: companies.allocatedInvestorBps,
        treasuryBalance: companies.treasuryBalance,
        creatorEmail: users.email,
      })
      .from(companies)
      .innerJoin(users, eq(companies.createdById, users.id))
      .where(eq(companies.isDeleted, false))
      .orderBy(desc(companies.foundedAt));
    return allCompanies;
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db
      .select()
      .from(companies)
      .where(and(eq(companies.id, id), eq(companies.isDeleted, false)));
    return company || undefined;
  }

  async deleteCompany(id: string): Promise<{ success: boolean; refundedInvestors: number; totalRefunded: number; error?: string }> {
    try {
      return await db.transaction(async (tx) => {
        // Get the company first
        const [company] = await tx
          .select()
          .from(companies)
          .where(eq(companies.id, id));

        if (!company) {
          return { success: false, refundedInvestors: 0, totalRefunded: 0, error: "Company not found" };
        }

        // Find all investment transactions for this company
        const investments = await tx
          .select()
          .from(transactions)
          .where(and(
            eq(transactions.companyId, id),
            eq(transactions.type, 'invest')
          ));

        let totalRefunded = 0;
        let totalRefundedToOthers = 0;
        const investorRefunds = new Map<string, number>();

        // Group investments by investor
        for (const investment of investments) {
          const currentAmount = investorRefunds.get(investment.fromUserId!) || 0;
          investorRefunds.set(investment.fromUserId!, currentAmount + investment.amount);
        }

        // Refund each investor
        for (const [investorId, amount] of Array.from(investorRefunds.entries())) {
          // Add funds back to investor
          await tx
            .update(users)
            .set({ balance: sql`${users.balance} + ${amount}` })
            .where(eq(users.id, investorId));

          // Create refund transaction record
          await tx
            .insert(transactions)
            .values({
              fromUserId: company.createdById,
              toUserId: investorId,
              amount: amount,
              type: 'refund',
              description: `Refund for deleted company: ${company.name}`,
              companyId: id,
            });

          totalRefunded += amount;
          
          // Track refunds to other investors (not the creator themselves)
          if (investorId !== company.createdById) {
            totalRefundedToOthers += amount;
          }
        }

        // Deduct only the amount refunded to OTHER investors from creator's balance
        // (If creator invested in their own company, they already got their refund above)
        if (totalRefundedToOthers > 0) {
          await tx
            .update(users)
            .set({ balance: sql`${users.balance} - ${totalRefundedToOthers}` })
            .where(eq(users.id, company.createdById));
        }

        // Mark company as deleted
        await tx
          .update(companies)
          .set({ isDeleted: true })
          .where(eq(companies.id, id));

        return {
          success: true,
          refundedInvestors: investorRefunds.size,
          totalRefunded: totalRefunded,
        };
      });
    } catch (error: any) {
      console.error('Delete company error:', error);
      return {
        success: false,
        refundedInvestors: 0,
        totalRefunded: 0,
        error: error.message || "Failed to delete company"
      };
    }
  }

  async investInCompany(companyId: string, userId: string, amount: number): Promise<{ success: boolean; error?: string; basisPointsReceived?: number }> {
    try {
      return await db.transaction(async (tx) => {
        // Get company details first
        const [company] = await tx.select().from(companies).where(and(eq(companies.id, companyId), eq(companies.isDeleted, false)));
        if (!company) {
          return { success: false, error: "Company not found" };
        }

        // Calculate equity allocation proportionally based on investment
        const remainingPool = company.investorPoolBps - company.allocatedInvestorBps;
        const investmentProportion = amount / company.fundingGoal;
        const basisPointsToAllocate = Math.floor(company.investorPoolBps * investmentProportion);

        if (basisPointsToAllocate > remainingPool) {
          return { success: false, error: "Insufficient investor pool remaining" };
        }

        // Atomic balance deduction with concurrency protection
        const investorUpdate = await tx
          .update(users)
          .set({ balance: sql`${users.balance} - ${amount}` })
          .where(and(eq(users.id, userId), sql`${users.balance} >= ${amount}`))
          .returning({ balance: users.balance });
        
        if (investorUpdate.length === 0) {
          return { success: false, error: "Insufficient balance" };
        }

        // Atomic company funding update with overfunding protection  
        const companyUpdate = await tx
          .update(companies)
          .set({ 
            currentFunding: sql`${companies.currentFunding} + ${amount}`,
            allocatedInvestorBps: sql`${companies.allocatedInvestorBps} + ${basisPointsToAllocate}`,
            treasuryBalance: sql`${companies.treasuryBalance} + ${amount}`,
          })
          .where(and(
            eq(companies.id, companyId),
            sql`${companies.fundingGoal} - ${companies.currentFunding} >= ${amount}`
          ))
          .returning({ currentFunding: companies.currentFunding });
          
        if (companyUpdate.length === 0) {
          const remainingFunding = company.fundingGoal - company.currentFunding;
          return { success: false, error: `Cannot invest ${amount} Astras. Only ${remainingFunding} Astras remaining to reach funding goal.` };
        }

        // Check if investor already has equity in this company
        const [existingEquity] = await tx
          .select()
          .from(companyEquityAllocations)
          .where(and(
            eq(companyEquityAllocations.companyId, companyId),
            eq(companyEquityAllocations.userId, userId)
          ))
          .limit(1);

        if (existingEquity) {
          // Update existing equity
          await tx
            .update(companyEquityAllocations)
            .set({ basisPoints: sql`${companyEquityAllocations.basisPoints} + ${basisPointsToAllocate}` })
            .where(eq(companyEquityAllocations.id, existingEquity.id));
        } else {
          // Create new equity allocation
          await tx.insert(companyEquityAllocations).values({
            companyId: companyId,
            userId: userId,
            basisPoints: basisPointsToAllocate,
            canReceivePayouts: true,
          });
        }

        // Record investment in audit trail
        await tx.insert(companyInvestments).values({
          companyId: companyId,
          userId: userId,
          amount: amount,
          basisPointsReceived: basisPointsToAllocate,
        });

        // Record investment transaction
        await tx
          .insert(transactions)
          .values({
            fromUserId: userId,
            toUserId: company.createdById,
            amount,
            type: 'invest',
            description: `Investment in ${company.name} (${(basisPointsToAllocate / 100).toFixed(2)}% equity)`,
            companyId: companyId,
          });

        return { success: true, basisPointsReceived: basisPointsToAllocate };
      });
    } catch (error: any) {
      return { success: false, error: error.message || "Investment failed" };
    }
  }

  async distributeEarnings(companyId: string, grossAmount: number, distributedById: string): Promise<{ success: boolean; error?: string; adminShare?: number; investorPayouts?: number }> {
    try {
      return await db.transaction(async (tx) => {
        // Get company
        const [company] = await tx.select().from(companies).where(and(eq(companies.id, companyId), eq(companies.isDeleted, false)));
        if (!company) {
          return { success: false, error: "Company not found" };
        }

        // Check if company has enough balance
        if (company.treasuryBalance < grossAmount) {
          return { 
            success: false, 
            error: `Insufficient company treasury. Available: ${company.treasuryBalance.toLocaleString()} Astras, Required: ${grossAmount.toLocaleString()} Astras. The company needs more investments before distributing earnings.` 
          };
        }

        // Get all active admins
        const admins = await tx.select().from(users).where(and(eq(users.isAdmin, true), eq(users.isBanned, false)));
        
        // Calculate admin share (1.5% per admin)
        const adminSharePerAdmin = Math.floor(grossAmount * 0.015);
        const adminShare = adminSharePerAdmin * admins.length;
        const distributableAmount = grossAmount - adminShare;

        // Create earnings record
        const [earningsRecord] = await tx.insert(companyEarnings).values({
          companyId: companyId,
          grossAmount: grossAmount,
          adminShare: adminShare,
          distributableAmount: distributableAmount,
          distributedById: distributedById,
        }).returning();

        // Distribute admin share
        for (const admin of admins) {
          await tx.update(users).set({ balance: sql`${users.balance} + ${adminSharePerAdmin}` }).where(eq(users.id, admin.id));
          
          await tx.insert(companyPayouts).values({
            earningsId: earningsRecord.id,
            companyId: companyId,
            userId: admin.id,
            amount: adminSharePerAdmin,
            payoutType: 'admin',
          });

          await tx.insert(transactions).values({
            fromUserId: company.createdById,
            toUserId: admin.id,
            amount: adminSharePerAdmin,
            type: 'earn',
            description: `Admin share from ${company.name} earnings`,
            companyId: companyId,
          });
        }

        // Get all equity holders
        const equityHolders = await tx.select().from(companyEquityAllocations).where(eq(companyEquityAllocations.companyId, companyId));
        const totalBps = equityHolders.reduce((sum, holder) => sum + holder.basisPoints, 0);

        // Distribute to equity holders
        for (const holder of equityHolders) {
          const payoutAmount = Math.floor((holder.basisPoints / totalBps) * distributableAmount);
          
          if (holder.canReceivePayouts) {
            // Get user to check if banned
            const [user] = await tx.select().from(users).where(eq(users.id, holder.userId));
            
            if (user && !user.isBanned) {
              await tx.update(users).set({ balance: sql`${users.balance} + ${payoutAmount}` }).where(eq(users.id, holder.userId));
              
              await tx.insert(companyPayouts).values({
                earningsId: earningsRecord.id,
                companyId: companyId,
                userId: holder.userId,
                amount: payoutAmount,
                payoutType: 'investor',
              });

              await tx.insert(transactions).values({
                fromUserId: company.createdById,
                toUserId: holder.userId,
                amount: payoutAmount,
                type: 'earn',
                description: `${(holder.basisPoints / 100).toFixed(2)}% share of ${company.name} earnings`,
                companyId: companyId,
              });
            } else {
              // Withheld - user is banned
              await tx.insert(companyPayouts).values({
                earningsId: earningsRecord.id,
                companyId: companyId,
                userId: null,
                amount: payoutAmount,
                payoutType: 'withheld',
              });
            }
          } else {
            // Withheld - canReceivePayouts is false
            await tx.insert(companyPayouts).values({
              earningsId: earningsRecord.id,
              companyId: companyId,
              userId: null,
              amount: payoutAmount,
              payoutType: 'withheld',
            });
          }
        }

        // Deduct from company treasury and track total distributed
        await tx.update(companies).set({ 
          treasuryBalance: sql`${companies.treasuryBalance} - ${grossAmount}`,
          totalEarningsDistributed: sql`${companies.totalEarningsDistributed} + ${grossAmount}`
        }).where(eq(companies.id, companyId));

        return { success: true, adminShare: adminShare, investorPayouts: distributableAmount };
      });
    } catch (error: any) {
      console.error('Distribute earnings error:', error);
      return { success: false, error: error.message || "Failed to distribute earnings" };
    }
  }

  async getCompanyEquity(companyId: string): Promise<(CompanyEquityAllocation & { userEmail: string })[]> {
    const equity = await db
      .select({
        id: companyEquityAllocations.id,
        companyId: companyEquityAllocations.companyId,
        userId: companyEquityAllocations.userId,
        basisPoints: companyEquityAllocations.basisPoints,
        canReceivePayouts: companyEquityAllocations.canReceivePayouts,
        createdAt: companyEquityAllocations.createdAt,
        userEmail: users.email,
      })
      .from(companyEquityAllocations)
      .innerJoin(users, eq(companyEquityAllocations.userId, users.id))
      .where(eq(companyEquityAllocations.companyId, companyId))
      .orderBy(desc(companyEquityAllocations.basisPoints));
    
    return equity;
  }

  async getUserEquity(userId: string): Promise<(CompanyEquityAllocation & { companyName: string })[]> {
    const equity = await db
      .select({
        id: companyEquityAllocations.id,
        companyId: companyEquityAllocations.companyId,
        userId: companyEquityAllocations.userId,
        basisPoints: companyEquityAllocations.basisPoints,
        canReceivePayouts: companyEquityAllocations.canReceivePayouts,
        createdAt: companyEquityAllocations.createdAt,
        companyName: companies.name,
      })
      .from(companyEquityAllocations)
      .innerJoin(companies, eq(companyEquityAllocations.companyId, companies.id))
      .where(and(
        eq(companyEquityAllocations.userId, userId),
        eq(companies.isDeleted, false)
      ))
      .orderBy(desc(companyEquityAllocations.basisPoints));
    
    return equity;
  }

  async getCompanyPayouts(companyId: string): Promise<(CompanyPayout & { userEmail: string | null; earningsDate: Date })[]> {
    const payouts = await db
      .select({
        id: companyPayouts.id,
        earningsId: companyPayouts.earningsId,
        companyId: companyPayouts.companyId,
        userId: companyPayouts.userId,
        amount: companyPayouts.amount,
        payoutType: companyPayouts.payoutType,
        createdAt: companyPayouts.createdAt,
        userEmail: users.email,
        earningsDate: companyEarnings.createdAt,
      })
      .from(companyPayouts)
      .leftJoin(users, eq(companyPayouts.userId, users.id))
      .innerJoin(companyEarnings, eq(companyPayouts.earningsId, companyEarnings.id))
      .where(eq(companyPayouts.companyId, companyId))
      .orderBy(desc(companyPayouts.createdAt));
    
    return payouts;
  }

  async getUserPayouts(userId: string): Promise<(CompanyPayout & { companyName: string; earningsDate: Date })[]> {
    const payouts = await db
      .select({
        id: companyPayouts.id,
        earningsId: companyPayouts.earningsId,
        companyId: companyPayouts.companyId,
        userId: companyPayouts.userId,
        amount: companyPayouts.amount,
        payoutType: companyPayouts.payoutType,
        createdAt: companyPayouts.createdAt,
        companyName: companies.name,
        earningsDate: companyEarnings.createdAt,
      })
      .from(companyPayouts)
      .innerJoin(companies, eq(companyPayouts.companyId, companies.id))
      .innerJoin(companyEarnings, eq(companyPayouts.earningsId, companyEarnings.id))
      .where(and(
        eq(companyPayouts.userId, userId),
        eq(companies.isDeleted, false)
      ))
      .orderBy(desc(companyPayouts.createdAt));
    
    return payouts;
  }

}

export const storage = new DatabaseStorage();

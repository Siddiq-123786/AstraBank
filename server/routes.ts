// Referenced from blueprint:javascript_auth_all_persistance integration
import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage, ValidationError } from "./storage";
import { sendMoneySchema, createCompanySchema, investmentSchema, distributeEarningsSchema, type SendMoneyRequest, type Transaction, type CreateCompanyRequest, type InvestmentRequest, type DistributeEarningsRequest } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Admin routes - protected by isAdmin middleware
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users/:id/balance", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, description } = req.body;
      const adminId = req.user?.id;
      
      if (!adminId) {
        return res.status(401).json({ error: "Admin not authenticated" });
      }
      
      if (typeof amount !== 'number' || !description || typeof description !== 'string') {
        return res.status(400).json({ error: "Amount (number) and description (string) are required" });
      }
      
      const result = await storage.adminAdjustBalance(id, amount, description, adminId);
      
      if (result.success) {
        res.json({ success: true });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to update balance" });
    }
  });

  app.post("/api/admin/users/:id/ban", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.banUser(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to ban user" });
    }
  });

  app.post("/api/admin/users/:id/unban", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.unbanUser(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to unban user" });
    }
  });

  app.post("/api/admin/users/:id/make-admin", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.makeAdmin(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to make admin" });
    }
  });

  app.post("/api/admin/users/:id/remove-admin", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.removeAdmin(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove admin" });
    }
  });

  // User directory - accessible to all authenticated users
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Filter out banned users from public view
      const publicUsers = users
        .filter(user => !user.isBanned)
        .map(user => ({
          id: user.id,
          email: user.email,
          balance: user.balance,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt
        }));
      res.json(publicUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Get detailed user profile
  app.get("/api/users/:id/profile", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const profile = await storage.getUserProfile(id, req.user!.id);
      if (!profile) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  // Friends routes - protected by authentication
  app.post("/api/friends/add", requireAuth, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      await storage.addFriend(req.user!.id, email);
      res.json({ success: true, message: "Friend request sent" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/friends", requireAuth, async (req, res) => {
    try {
      const friends = await storage.getFriends(req.user!.id);
      res.json(friends);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch friends" });
    }
  });

  app.get("/api/friends/requests", requireAuth, async (req, res) => {
    try {
      const requests = await storage.getFriendRequests(req.user!.id);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch friend requests" });
    }
  });

  app.post("/api/friends/:friendId/accept", requireAuth, async (req, res) => {
    try {
      const { friendId } = req.params;
      const updated = await storage.updateFriendshipStatus(req.user!.id, friendId, 'accepted');
      
      if (!updated) {
        return res.status(404).json({ error: "Friend request not found or already processed" });
      }
      
      res.json({ success: true, message: "Friend request accepted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to accept friend request" });
    }
  });

  app.post("/api/friends/:friendId/reject", requireAuth, async (req, res) => {
    try {
      const { friendId } = req.params;
      const updated = await storage.updateFriendshipStatus(req.user!.id, friendId, 'blocked');
      
      if (!updated) {
        return res.status(404).json({ error: "Friend request not found or already processed" });
      }
      
      res.json({ success: true, message: "Friend request rejected" });
    } catch (error) {
      res.status(500).json({ error: "Failed to reject friend request" });
    }
  });

  app.get("/api/friends/recommended", requireAuth, async (req, res) => {
    try {
      const recommendations = await storage.getRecommendedUsers(req.user!.id);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recommended users" });
    }
  });

  // Money transfer routes
  app.post("/api/send-money", requireAuth, async (req, res) => {
    try {
      const validation = sendMoneySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid request data", details: validation.error.errors });
      }

      const { toUserId, amount, description } = validation.data;
      
      // Verify friendship exists and is accepted
      const friends = await storage.getFriends(req.user!.id);
      const isFriend = friends.some(friend => 
        friend.id === toUserId && friend.friendshipStatus === 'accepted'
      );

      if (!isFriend) {
        return res.status(403).json({ error: "Can only send money to accepted friends" });
      }

      const result = await storage.sendMoney(req.user!.id, toUserId, amount, description);
      
      if (result.success) {
        res.json({ success: true, message: "Money sent successfully" });
      } else {
        res.status(400).json({ error: result.error || "Failed to send money" });
      }
    } catch (error) {
      console.error('Send money route error:', error);
      res.status(500).json({ error: "Failed to send money" });
    }
  });

  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await storage.getTransactions(req.user!.id, limit);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Company routes - protected by authentication
  app.post("/api/companies", requireAuth, async (req, res) => {
    try {
      const validatedData = createCompanySchema.parse(req.body);
      
      // Additional validation: ensure teammates are distinct from creator
      const teamEmailsList = validatedData.teamEmails.split(',').map(email => email.trim().toLowerCase()).filter(email => email.length > 0);
      const uniqueTeamEmails = Array.from(new Set(teamEmailsList)).filter(email => email !== req.user!.email.toLowerCase());
      
      if (uniqueTeamEmails.length < 1) {
        return res.status(400).json({ error: "At least one teammate other than you is required" });
      }
      
      const company = await storage.createCompany({
        ...validatedData,
        createdById: req.user!.id,
      });
      res.json(company);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: "Invalid company data", details: error.errors });
      } else if (error instanceof ValidationError) {
        // Handle validation errors from storage layer
        res.status(400).json({ error: error.message });
      } else {
        console.error('Create company error:', error);
        res.status(500).json({ error: "Failed to create company" });
      }
    }
  });

  app.get("/api/companies", requireAuth, async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  app.get("/api/companies/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const company = await storage.getCompany(id);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch company" });
    }
  });

  app.post("/api/companies/:id/invest", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { amount } = req.body;
      
      // Validate amount
      if (!amount || typeof amount !== 'number' || amount < 100 || amount > 50000) {
        return res.status(400).json({ error: "Investment amount must be between 100 and 50,000 Astras" });
      }
      
      const result = await storage.investInCompany(id, req.user!.id, amount);
      
      if (result.success) {
        const equityPercent = result.basisPointsReceived ? (result.basisPointsReceived / 100).toFixed(2) : '0.00';
        res.json({ 
          success: true, 
          message: `Investment successful! You received ${equityPercent}% equity.`,
          basisPointsReceived: result.basisPointsReceived 
        });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error: any) {
      res.status(500).json({ error: "Failed to process investment" });
    }
  });

  // Company earnings distribution - admin only
  app.post("/api/companies/:id/distribute-earnings", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = distributeEarningsSchema.parse(req.body);
      
      const result = await storage.distributeEarnings(id, validatedData.grossAmount, req.user!.id);
      
      if (result.success) {
        res.json({ 
          success: true, 
          message: "Earnings distributed successfully",
          adminShare: result.adminShare,
          investorPayouts: result.investorPayouts
        });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: "Invalid earnings data", details: error.errors });
      } else {
        console.error('Distribute earnings error:', error);
        res.status(500).json({ error: "Failed to distribute earnings" });
      }
    }
  });

  // Get company equity holders
  app.get("/api/companies/:id/equity", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const equity = await storage.getCompanyEquity(id);
      res.json(equity);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch company equity" });
    }
  });

  // Get company payouts history
  app.get("/api/companies/:id/payouts", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const payouts = await storage.getCompanyPayouts(id);
      res.json(payouts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch company payouts" });
    }
  });

  // Get user's equity across all companies
  app.get("/api/users/:id/equity", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      // Users can only view their own equity unless they're admin
      if (id !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ error: "Access denied" });
      }
      const equity = await storage.getUserEquity(id);
      res.json(equity);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user equity" });
    }
  });

  // Get user's payout history across all companies
  app.get("/api/users/:id/payouts", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      // Users can only view their own payouts unless they're admin
      if (id !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ error: "Access denied" });
      }
      const payouts = await storage.getUserPayouts(id);
      res.json(payouts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user payouts" });
    }
  });

  app.delete("/api/companies/:id", requireAuth, async (req, res) => {
    try {
      // Check if user is admin
      if (!req.user!.isAdmin) {
        return res.status(403).json({ error: "Only admins can delete companies" });
      }

      const { id } = req.params;
      const result = await storage.deleteCompany(id);
      
      if (result.success) {
        res.json({ 
          success: true, 
          message: "Company deleted successfully",
          refundedInvestors: result.refundedInvestors,
          totalRefunded: result.totalRefunded
        });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete company" });
    }
  });


  const httpServer = createServer(app);

  return httpServer;
}

// Middleware to require admin access
function requireAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// Middleware to require authentication
function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

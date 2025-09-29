// Referenced from blueprint:javascript_auth_all_persistance integration
import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { sendMoneySchema, createCompanySchema, investmentSchema, type SendMoneyRequest, type Transaction, type CreateCompanyRequest, type InvestmentRequest } from "@shared/schema";

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
      // Return user info including admin status for transparency
      const publicUsers = users.map(user => ({
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
      } else {
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
        res.json({ success: true, message: "Investment successful!" });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error: any) {
      res.status(500).json({ error: "Failed to process investment" });
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

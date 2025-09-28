// Referenced from blueprint:javascript_auth_all_persistance integration
import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { sendMoneySchema, type SendMoneyRequest, type Transaction } from "@shared/schema";

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
      const { balance } = req.body;
      await storage.updateUserBalance(id, balance);
      res.json({ success: true });
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

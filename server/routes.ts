// Referenced from blueprint:javascript_auth_all_persistance integration
import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";

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

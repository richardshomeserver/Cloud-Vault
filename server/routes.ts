
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fileStorage } from "./file_storage";
import { api, errorSchemas } from "@shared/routes";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { pool } from "./db";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs/promises";

const PgSession = pgSession(session);

// Multer setup for temporary upload handling
const upload = multer({
  dest: path.join(process.cwd(), "storage", "uploads", "temp"),
  limits: { fileSize: 1024 * 1024 * 500 }, // 500MB limit for MVP
});

function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Session Middleware
  app.use(
    session({
      store: new PgSession({
        pool: pool,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "repl_secret_key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: app.get("env") === "production",
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Passport Configuration
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // === AUTH API ===
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      
      const existing = await storage.getUserByUsername(input.username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      const user = await storage.createUser({
        ...input,
        password: hashedPassword,
      });

      req.login(user, (err) => {
        if (err) throw err;
        res.status(201).json({ id: user.id, username: user.username });
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    const user = req.user as any;
    res.json({ id: user.id, username: user.username });
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ message: "Logged out" });
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = req.user as any;
    res.json({ id: user.id, username: user.username, displayName: user.displayName });
  });

  // === ITEMS API ===
  
  // List Items
  app.get(api.items.list.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const parentId = req.query.parentId ? (req.query.parentId === 'root' ? null : parseInt(req.query.parentId as string)) : null;
    const category = req.query.category as string || 'all';
    const search = req.query.search as string;

    const items = await storage.getItems(userId, parentId, category, search);
    res.json(items);
  });

  // Create Folder
  app.post(api.items.createFolder.path, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const input = api.items.createFolder.input.parse(req.body);
      
      const folder = await storage.createItem({
        userId,
        parentId: input.parentId,
        name: input.name,
        type: 'folder',
        isEncrypted: false,
      });

      res.status(201).json(folder);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Server Error" });
    }
  });

  // Upload File
  app.post(api.items.upload.path, isAuthenticated, upload.single('file'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const userId = (req.user as any).id;
    const parentId = req.body.parentId ? parseInt(req.body.parentId) : null;
    
    try {
      // 1. Move file from temp to permanent storage
      // Use a stream to allow 'fileStorage' to handle the final write logic (and potential encryption later)
      const tempPath = req.file.path;
      const fileStream = await fs.readFile(tempPath); // Read to buffer/stream
      // For large files, createReadStream is better, but readFile is OK for now since we are already on disk
      
      const storageName = await fileStorage.saveFile(
        require('fs').createReadStream(tempPath), 
        req.file.originalname
      );

      // 2. Create DB Record
      const item = await storage.createItem({
        userId,
        parentId,
        name: req.file.originalname,
        type: 'file',
        storagePath: storageName,
        mimeType: req.file.mimetype,
        size: req.file.size,
        extension: path.extname(req.file.originalname).slice(1),
        isEncrypted: false, // Default off for now
      });

      // 3. Cleanup temp
      await fs.unlink(tempPath);

      res.status(201).json(item);
    } catch (err) {
      console.error(err);
      // Cleanup temp on error
      try { await fs.unlink(req.file.path); } catch {}
      res.status(500).json({ message: "Upload failed" });
    }
  });

  // Breadcrumb
  app.get(api.items.breadcrumb.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const breadcrumb = await storage.getBreadcrumb(parseInt(req.params.id), userId);
    res.json(breadcrumb);
  });

  // Update Item
  app.patch(api.items.update.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const updates = req.body; // Validate with Zod if strictness needed, but schema is partial
    
    const updated = await storage.updateItem(parseInt(req.params.id), userId, updates);
    if (!updated) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json(updated);
  });

  // Delete Item (Permanent)
  app.delete(api.items.delete.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const id = parseInt(req.params.id);
    
    const item = await storage.getItem(id);
    if (!item || item.userId !== userId) {
      return res.status(404).json({ message: "Item not found" });
    }

    // If file, delete from disk
    if (item.type === 'file' && item.storagePath) {
      await fileStorage.deleteFile(item.storagePath);
    }

    // TODO: Recursive delete for folders?
    // For MVP, we might leave orphans or handle recursion.
    // Let's just delete the item.
    await storage.deleteItem(id, userId);
    
    res.status(204).send();
  });

  // Download Item
  app.get('/api/items/:id/download', isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const item = await storage.getItem(parseInt(req.params.id));
    
    if (!item || item.userId !== userId || item.type !== 'file' || !item.storagePath) {
      return res.status(404).json({ message: "File not found" });
    }

    const filePath = fileStorage.getFilePath(item.storagePath);
    res.download(filePath, item.name);
  });

  // Seed Data function
  async function seed() {
    const existing = await storage.getUserByUsername("demo@example.com");
    if (!existing) {
      const hashedPassword = await bcrypt.hash("password", 10);
      const user = await storage.createUser({
        username: "demo@example.com",
        password: hashedPassword,
        displayName: "Demo User"
      });
      
      // Create some folders
      const docs = await storage.createItem({ userId: user.id, type: 'folder', name: 'Documents', parentId: null });
      const photos = await storage.createItem({ userId: user.id, type: 'folder', name: 'Photos', parentId: null });
      
      // We can't easily seed files without physical files, but we can seed metadata if we wanted.
    }
  }

  // Run seed
  seed().catch(console.error);

  return httpServer;
}

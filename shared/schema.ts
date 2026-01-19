
import { pgTable, text, serial, integer, boolean, timestamp, uuid, bigint, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === USERS ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // Email
  password: text("password").notNull(), // Hashed
  displayName: text("display_name"),
  storageQuota: bigint("storage_quota", { mode: "number" }).default(10737418240), // 10GB default
  createdAt: timestamp("created_at").defaultNow(),
});

// === ITEMS (Files & Folders) ===
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  parentId: integer("parent_id"), // Null for root
  type: text("type", { enum: ["file", "folder"] }).notNull(),
  name: text("name").notNull(),
  
  // File specific
  storagePath: text("storage_path"), // Random filename on disk
  mimeType: text("mime_type"),
  size: bigint("size", { mode: "number" }).default(0),
  extension: text("extension"),
  
  // Encryption (AES-256-GCM)
  isEncrypted: boolean("is_encrypted").default(false),
  encryptionIv: text("encryption_iv"),
  encryptionAuthTag: text("encryption_auth_tag"),
  
  // Metadata
  isStarred: boolean("is_starred").default(false),
  isTrashed: boolean("is_trashed").default(false),
  thumbnailPath: text("thumbnail_path"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
});

// === JOBS (Background tasks) ===
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'thumbnail', 'cleanup', 'encryption'
  payload: jsonb("payload").notNull(),
  status: text("status", { enum: ["pending", "processing", "completed", "failed"] }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCHEMAS ===
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
});

export const insertItemSchema = createInsertSchema(items).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true, 
  lastAccessedAt: true 
});

// === TYPES ===
export type User = typeof users.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Job = typeof jobs.$inferSelect;

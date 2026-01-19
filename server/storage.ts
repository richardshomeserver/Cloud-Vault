
import { db } from "./db";
import { users, items, jobs, type User, type InsertUser, type Item, type Job } from "@shared/schema";
import { eq, and, desc, isNull, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Items (Files/Folders)
  getItem(id: number): Promise<Item | undefined>;
  getItems(userId: number, parentId: number | null, category?: string, search?: string): Promise<Item[]>;
  createItem(item: any): Promise<Item>; // Typed specifically in implementation
  updateItem(id: number, userId: number, updates: Partial<Item>): Promise<Item | undefined>;
  deleteItem(id: number, userId: number): Promise<void>; // Hard delete
  getBreadcrumb(id: number, userId: number): Promise<{id: number, name: string}[]>;
  
  // Storage Stats
  getStorageUsage(userId: number): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getItem(id: number): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item;
  }

  async getItems(userId: number, parentId: number | null, category: string = 'all', search?: string): Promise<Item[]> {
    let query = db.select().from(items).where(eq(items.userId, userId));

    if (search) {
      return await db.select().from(items).where(
        and(
          eq(items.userId, userId),
          eq(items.isTrashed, false),
          sql`name ILIKE ${`%${search}%`}`
        )
      ).orderBy(desc(items.type), desc(items.createdAt));
    }

    if (category === 'recent') {
      return await db.select().from(items)
        .where(and(eq(items.userId, userId), eq(items.isTrashed, false), eq(items.type, 'file')))
        .orderBy(desc(items.lastAccessedAt))
        .limit(20);
    }

    if (category === 'starred') {
      return await db.select().from(items)
        .where(and(eq(items.userId, userId), eq(items.isStarred, true), eq(items.isTrashed, false)))
        .orderBy(desc(items.createdAt));
    }

    if (category === 'trash') {
      return await db.select().from(items)
        .where(and(eq(items.userId, userId), eq(items.isTrashed, true)))
        .orderBy(desc(items.createdAt));
    }

    // Default: Browse by folder
    // Handle root (parentId is null) vs specific folder
    if (parentId === null) {
      return await db.select().from(items)
        .where(and(eq(items.userId, userId), isNull(items.parentId), eq(items.isTrashed, false)))
        .orderBy(desc(items.type), desc(items.createdAt)); // Folders first
    } else {
      return await db.select().from(items)
        .where(and(eq(items.userId, userId), eq(items.parentId, parentId), eq(items.isTrashed, false)))
        .orderBy(desc(items.type), desc(items.createdAt));
    }
  }

  async createItem(item: any): Promise<Item> {
    const [newItem] = await db.insert(items).values(item).returning();
    return newItem;
  }

  async updateItem(id: number, userId: number, updates: Partial<Item>): Promise<Item | undefined> {
    const [updated] = await db.update(items)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(items.id, id), eq(items.userId, userId)))
      .returning();
    return updated;
  }

  async deleteItem(id: number, userId: number): Promise<void> {
    await db.delete(items).where(and(eq(items.id, id), eq(items.userId, userId)));
  }

  async getBreadcrumb(id: number, userId: number): Promise<{id: number, name: string}[]> {
    const breadcrumb: {id: number, name: string}[] = [];
    let currentId: number | null = id;

    while (currentId) {
      const item = await this.getItem(currentId);
      if (!item || item.userId !== userId) break;
      
      breadcrumb.unshift({ id: item.id, name: item.name });
      currentId = item.parentId;
    }
    
    return breadcrumb;
  }

  async getStorageUsage(userId: number): Promise<number> {
    const result = await db.select({
      totalSize: sql<number>`sum(size)`
    }).from(items).where(eq(items.userId, userId));
    
    return result[0]?.totalSize || 0;
  }
}

export const storage = new DatabaseStorage();


import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { pipeline } from "stream/promises";
import { createReadStream, createWriteStream } from "fs";

const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");

export class FileStorage {
  constructor() {
    this.ensureDir(UPLOAD_DIR);
  }

  private async ensureDir(dir: string) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  // Generate a random filename for storage to prevent collisions and guessing
  generateStorageName(extension: string = ""): string {
    const randomId = crypto.randomBytes(16).toString("hex");
    return `${randomId}${extension}`;
  }

  async saveFile(fileStream: NodeJS.ReadableStream, filename: string): Promise<string> {
    const storageName = this.generateStorageName(path.extname(filename));
    const filePath = path.join(UPLOAD_DIR, storageName);
    
    const writeStream = createWriteStream(filePath);
    await pipeline(fileStream, writeStream);
    
    return storageName;
  }

  async deleteFile(storagePath: string): Promise<void> {
    const filePath = path.join(UPLOAD_DIR, storagePath);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      // Ignore if file already missing
      console.error(`Failed to delete file ${storagePath}:`, err);
    }
  }

  getFilePath(storagePath: string): string {
    return path.join(UPLOAD_DIR, storagePath);
  }

  async getFileSize(storagePath: string): Promise<number> {
    const stat = await fs.stat(path.join(UPLOAD_DIR, storagePath));
    return stat.size;
  }
}

export const fileStorage = new FileStorage();

import fs from "fs";
import path from "path";
import type { Request } from "express";

export interface StorageFile {
  originalName: string;
  fileName: string;
  filePath: string;
  size: number;
  mimeType: string;
}

export interface StorageService {
  uploadFile(buffer: Buffer, originalName: string): Promise<StorageFile>;
  deleteFile(filePath: string): Promise<void>;
  getFileUrl(filePath: string): string;
  fileExists(filePath: string): Promise<boolean>;
}

// ─── Local Storage Service ──────────────────────────────────────────────────────
export class LocalStorageService implements StorageService {
  private uploadDir: string;

  constructor(uploadDir: string = "uploads") {
    this.uploadDir = uploadDir;
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  }

  async uploadFile(buffer: Buffer, originalName: string): Promise<StorageFile> {
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${Date.now()}-${safeName}`;
    const filePath = path.join(this.uploadDir, fileName);

    fs.writeFileSync(filePath, buffer);

    return {
      originalName,
      fileName,
      filePath: `uploads/${fileName}`,
      size: buffer.length,
      mimeType: originalName.split(".").pop() || "unknown",
    };
  }

  async deleteFile(filePath: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, path.basename(filePath));
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  getFileUrl(filePath: string): string {
    return `/${filePath}`;
  }

  async fileExists(filePath: string): Promise<boolean> {
    const fullPath = path.join(this.uploadDir, path.basename(filePath));
    return fs.existsSync(fullPath);
  }
}

// ─── Vercel Blob Storage Service ────────────────────────────────────────────────
export class VercelBlobStorageService implements StorageService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  async uploadFile(buffer: Buffer, originalName: string): Promise<StorageFile> {
    try {
      // @ts-expect-error - @vercel/blob is optional dependency
      const { put } = await import("@vercel/blob");
      const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileName = `${Date.now()}-${safeName}`;

      const blob = await put(`uploads/${fileName}`, buffer, {
        access: "public",
        token: this.token,
      });

      return {
        originalName,
        fileName,
        filePath: blob.pathname || `uploads/${fileName}`,
        size: buffer.length,
        mimeType: originalName.split(".").pop() || "unknown",
      };
    } catch (error) {
      throw new Error(`Vercel Blob upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      // @ts-expect-error - @vercel/blob is optional dependency
      const { del } = await import("@vercel/blob");
      await del(`https://blob.vercelusercontent.com${filePath}`, {
        token: this.token,
      });
    } catch (error) {
      console.error(`Failed to delete file from Vercel Blob: ${error}`);
    }
  }

  getFileUrl(filePath: string): string {
    if (filePath.startsWith("http")) return filePath;
    return `https://blob.vercelusercontent.com${filePath}`;
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      const response = await fetch(this.getFileUrl(filePath), { method: "HEAD" });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// ─── AWS S3 Storage Service ─────────────────────────────────────────────────────
export class S3StorageService implements StorageService {
  private s3Client: any;
  private bucket: string;

  constructor(bucket: string) {
    this.bucket = bucket;
    // AWS S3 client initialization can be added here
  }

  async uploadFile(buffer: Buffer, originalName: string): Promise<StorageFile> {
    throw new Error("S3 storage not fully implemented yet. Use Vercel Blob or Local storage.");
  }

  async deleteFile(filePath: string): Promise<void> {
    throw new Error("S3 storage not fully implemented yet.");
  }

  getFileUrl(filePath: string): string {
    return filePath;
  }

  async fileExists(filePath: string): Promise<boolean> {
    return false;
  }
}

// ─── Factory to create appropriate storage service ─────────────────────────────
export function createStorageService(): StorageService {
  if (process.env.USE_VERCEL_BLOB === "true" && process.env.BLOB_READ_WRITE_TOKEN) {
    return new VercelBlobStorageService(process.env.BLOB_READ_WRITE_TOKEN);
  }

  if (process.env.USE_AWS_S3 === "true" && process.env.AWS_S3_BUCKET) {
    return new S3StorageService(process.env.AWS_S3_BUCKET);
  }

  return new LocalStorageService("uploads");
}

export const storageService = createStorageService();

import fs from 'fs';
import path from 'path';
import os from 'os';

const BASE_TEMP_DIR = path.join(os.tmpdir(), 'reelwide');
export const INPUTS_DIR = path.join(BASE_TEMP_DIR, 'inputs');
export const OUTPUTS_DIR = path.join(BASE_TEMP_DIR, 'outputs');

// Ensure directories exist
export function initStorage(): void {
  try {
    fs.mkdirSync(INPUTS_DIR, { recursive: true });
    fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create storage directories:', err);
  }

  // Periodic cleanup of temporary files older than 30 minutes
  setInterval(() => {
    cleanupExpiredFiles();
  }, 10 * 60 * 1000); // Check every 10 minutes
}

// Expire files after 30 minutes
const EXPIRATION_MS = 30 * 60 * 1000;

export function cleanupExpiredFiles(): void {
  const now = Date.now();
  [INPUTS_DIR, OUTPUTS_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) return;
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > EXPIRATION_MS) {
          try {
            fs.unlinkSync(filePath);
            console.log(`[Storage] Deleted expired file: ${file}`);
          } catch (e) {
            console.error(`[Storage] Error deleting ${file}:`, e);
          }
        }
      }
    } catch (err) {
      console.error('[Storage] Error reading dir during cleanup:', err);
    }
  });
}

export function deleteFileSafely(filePath?: string): void {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn(`[Storage] Could not delete file: ${filePath}`, err);
  }
}

export const MAX_FILE_SIZE_MB = 1024; // 1 GB maximum file size
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // 1 GB in bytes
export const MAX_DURATION_SECONDS = 1800; // 30 minutes max video length

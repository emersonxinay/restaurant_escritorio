import fs from 'fs/promises';
import path from 'path';

// Define path for backups in the project root
const BACKUP_DIR = path.join(process.cwd(), 'backups');

/**
 * Ensures the backup directory exists.
 */
const ensureDir = async () => {
  try {
    await fs.access(BACKUP_DIR);
  } catch {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  }
};

/**
 * Asynchronously saves JSON data to a file.
 * Doesn't throw errors to avoid disrupting the main flow.
 */
export const saveBackup = async (filename: string, data: any): Promise<void> => {
  try {
    await ensureDir();
    const filePath = path.join(BACKUP_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Failed to save backup to ${filename}:`, error);
  }
};

/**
 * Loads JSON data from a backup file.
 * Throws an error if the file doesn't exist.
 */
export const loadBackup = async (filename: string): Promise<any> => {
  try {
    const filePath = path.join(BACKUP_DIR, filename);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Backup file ${filename} not found or corrupted`);
  }
};

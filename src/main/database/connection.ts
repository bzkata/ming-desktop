import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { Logger } from '../utils/Logger';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) throw new Error('Database not initialized. Call initializeDatabase() first.');
  return db;
}

export function initializeDatabase(): Database.Database {
  const dbPath = path.join(app.getPath('userData'), 'ming-desktop.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  Logger.info(`Database initialized at ${dbPath}`);
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    Logger.info('Database closed');
  }
}

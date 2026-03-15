import BetterSqlite3 from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFilename = process.env.NODE_ENV === 'development' ? 'dev.db' : 'prod.db';
const dbDir = process.env.RENDER_DISK_PATH || __dirname;
const dbPath = path.join(dbDir, dbFilename);
let db: BetterSqlite3.Database;
try {
  db = new BetterSqlite3(dbPath, { verbose: console.log, fileMustExist: false });
} catch (error) {
  console.error('Error initializing database:', error);
  process.exit(1);
}

export default db;
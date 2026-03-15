import BetterSqlite3 from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.NODE_ENV === 'development' ? 'dev.db' : 'prod.db';
let db: BetterSqlite3.Database;
try {
  db = new BetterSqlite3(path.join(__dirname, dbPath), { verbose: console.log, fileMustExist: false });
} catch (error) {
  console.error('Error initializing database:', error);
  process.exit(1);
}

export default db;
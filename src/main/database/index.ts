import { app } from "electron";
import Database from 'better-sqlite3';
import { join } from 'path';
import { setupSchema } from './migrations';


const dbPath = join(app.getPath('userData'), 'database.db');

const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

setupSchema(db);

export default db;

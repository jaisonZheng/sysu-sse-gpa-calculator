const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'data', 'gpa.db');
console.log('DB Path:', dbPath);

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
console.log('Database created');

db.exec(`CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_code TEXT NOT NULL UNIQUE,
  course_name TEXT NOT NULL,
  credits REAL NOT NULL,
  category TEXT NOT NULL,
  grade_year INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS user_grades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  course_code TEXT NOT NULL DEFAULT '',
  course_name TEXT NOT NULL,
  credits REAL NOT NULL,
  score REAL NOT NULL,
  gpa REAL NOT NULL,
  category TEXT NOT NULL,
  academic_year INTEGER NOT NULL,
  semester INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS gpa_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  netid TEXT,
  year1_public_gpa REAL NOT NULL DEFAULT 0,
  year1_major_gpa REAL NOT NULL DEFAULT 0,
  year2_major_gpa REAL NOT NULL DEFAULT 0,
  year3_major_gpa REAL NOT NULL DEFAULT 0,
  final_gpa REAL NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);

console.log('Tables created');
console.log('Tables:', db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all());

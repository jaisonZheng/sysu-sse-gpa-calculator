import Database, { type Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Calculate database path relative to project root
// In production (dist), __dirname is dist/database, so go up 2 levels to backend, then 1 more to project root
// We want the data directory at the project root level (gpa-calculator/data)
const projectRoot = path.resolve(__dirname, '..', '..', '..');
const dbPath = process.env.DB_PATH || path.join(projectRoot, 'data', 'gpa.db');
console.log('Database path:', dbPath);

// Ensure directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db: DatabaseType = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Initialize tables
export function initDatabase() {
  // Courses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_code TEXT NOT NULL UNIQUE,
      course_name TEXT NOT NULL,
      credits REAL NOT NULL,
      category TEXT NOT NULL,
      grade_year INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User grades table (temporary storage)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_grades (
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
    )
  `);

  // GPA results table
  db.exec(`
    CREATE TABLE IF NOT EXISTS gpa_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      netid TEXT,
      year1_public_gpa REAL NOT NULL,
      year1_major_gpa REAL NOT NULL,
      year2_major_gpa REAL NOT NULL,
      year3_major_gpa REAL NOT NULL,
      final_gpa REAL NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Database initialized');
}

// Course operations
export function getAllCourses() {
  return db.prepare('SELECT * FROM courses ORDER BY grade_year, course_code').all();
}

export function getCoursesByGradeYear(gradeYear: number) {
  return db.prepare('SELECT * FROM courses WHERE grade_year = ? ORDER BY course_code').all(gradeYear);
}

export function getCourseByCode(courseCode: string) {
  return db.prepare('SELECT * FROM courses WHERE course_code = ?').get(courseCode);
}

export function insertCourse(course: {
  courseCode: string;
  courseName: string;
  credits: number;
  category: string;
  gradeYear: number;
}) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO courses (course_code, course_name, credits, category, grade_year)
    VALUES (?, ?, ?, ?, ?)
  `);
  return stmt.run(course.courseCode, course.courseName, course.credits, course.category, course.gradeYear);
}

// User grades operations
export function insertUserGrade(grade: {
  sessionId: string;
  courseCode: string;
  courseName: string;
  credits: number;
  score: number;
  gpa: number;
  category: string;
  academicYear: number;
  semester: number;
}) {
  const stmt = db.prepare(`
    INSERT INTO user_grades (session_id, course_code, course_name, credits, score, gpa, category, academic_year, semester)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    grade.sessionId,
    grade.courseCode,
    grade.courseName,
    grade.credits,
    grade.score,
    grade.gpa,
    grade.category,
    grade.academicYear,
    grade.semester
  );
}

export function getUserGradesBySession(sessionId: string) {
  return db.prepare('SELECT * FROM user_grades WHERE session_id = ? ORDER BY academic_year, semester').all(sessionId);
}

export function deleteUserGradesBySession(sessionId: string) {
  return db.prepare('DELETE FROM user_grades WHERE session_id = ?').run(sessionId);
}

// GPA results operations
export function insertGpaResult(result: {
  sessionId: string;
  netid?: string;
  year1PublicGpa: number;
  year1MajorGpa: number;
  year2MajorGpa: number;
  year3MajorGpa: number;
  finalGpa: number;
}) {
  const stmt = db.prepare(`
    INSERT INTO gpa_results (session_id, netid, year1_public_gpa, year1_major_gpa, year2_major_gpa, year3_major_gpa, final_gpa)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    result.sessionId,
    result.netid || null,
    result.year1PublicGpa,
    result.year1MajorGpa,
    result.year2MajorGpa,
    result.year3MajorGpa,
    result.finalGpa
  );
}

export function getGpaResultBySession(sessionId: string) {
  return db.prepare('SELECT * FROM gpa_results WHERE session_id = ? ORDER BY created_at DESC LIMIT 1').get(sessionId);
}

// Get all saved results by netid (for permanent storage)
export function getGpaResultsByNetid(netid: string) {
  return db.prepare('SELECT * FROM gpa_results WHERE netid = ? ORDER BY created_at DESC').all(netid);
}

// Get all user grades by netid (join with gpa_results to find netid)
export function getUserGradesByNetid(netid: string) {
  return db.prepare(`
    SELECT ug.* FROM user_grades ug
    INNER JOIN gpa_results gr ON ug.session_id = gr.session_id
    WHERE gr.netid = ?
    ORDER BY ug.academic_year, ug.semester
  `).all(netid);
}

// Cleanup old data - only delete data without netid (manual entries)
export function cleanupOldData(hours: number = 24) {
  // Only delete user_grades that are associated with sessions that don't have a netid
  const stmt = db.prepare(`
    DELETE FROM user_grades WHERE session_id IN (
      SELECT session_id FROM gpa_results
      WHERE netid IS NULL AND created_at < datetime('now', '-${hours} hours')
    )
  `);
  stmt.run();

  // Delete gpa_results without netid that are older than specified hours
  const stmt2 = db.prepare(`
    DELETE FROM gpa_results WHERE netid IS NULL AND created_at < datetime('now', '-${hours} hours')
  `);
  stmt2.run();
}

export default db;

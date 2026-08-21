import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "aitts.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('STUDENT','ADMIN')) DEFAULT 'STUDENT',
  theme TEXT NOT NULL DEFAULT 'system',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT 'General',
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  total_marks REAL NOT NULL DEFAULT 0,
  access_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK(status IN ('DRAFT','PUBLISHED','ACTIVE','CLOSED')) DEFAULT 'DRAFT',
  start_time TEXT,
  end_time TEXT,
  allow_reattempt INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 1,
  show_answer_key INTEGER NOT NULL DEFAULT 0,
  negative_marking_default REAL NOT NULL DEFAULT 0,
  created_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK(question_type IN ('SCQ','MCQ')),
  marks REAL NOT NULL DEFAULT 1,
  negative_marks REAL NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL,
  FOREIGN KEY(test_id) REFERENCES tests(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL,
  option_text TEXT NOT NULL,
  option_order INTEGER NOT NULL,
  FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS correct_answers (
  question_id INTEGER NOT NULL,
  option_id INTEGER NOT NULL,
  PRIMARY KEY(question_id, option_id),
  FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY(option_id) REFERENCES options(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  test_id INTEGER NOT NULL,
  attempt_number INTEGER NOT NULL,
  started_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  submitted_at TEXT,
  score REAL,
  percentage REAL,
  correct_count INTEGER,
  incorrect_count INTEGER,
  unanswered_count INTEGER,
  time_taken_seconds INTEGER,
  UNIQUE(student_id, test_id, attempt_number),
  FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(test_id) REFERENCES tests(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS student_answers (
  attempt_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  option_id INTEGER NOT NULL,
  PRIMARY KEY(attempt_id, question_id, option_id),
  FOREIGN KEY(attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
  FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY(option_id) REFERENCES options(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_attempt_student_test ON attempts(student_id, test_id);
CREATE INDEX IF NOT EXISTS idx_questions_test ON questions(test_id, sort_order);
`);

function seed() {
  const count = db.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number };
  if (count.count > 0) return;

  const adminHash = bcrypt.hashSync("AITTS-Admin-2026!", 12);
  const studentHash = bcrypt.hashSync("AITTS-Student-2026!", 12);
  const insertUser = db.prepare("INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)");
  const admin = insertUser.run("AITTS Host", "admin@aitts.local", adminHash, "ADMIN");
  insertUser.run("Demo Student", "student@aitts.local", studentHash, "STUDENT");

  const test = db.prepare(`INSERT INTO tests(title,description,subject,duration_minutes,total_marks,access_code,status,start_time,end_time,allow_reattempt,max_attempts,show_answer_key,created_by)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    "AITTS Physics Demo", "A sample test to verify the complete exam flow.", "Physics", 30, 10,
    "AITTS-DEMO-01", "PUBLISHED", null, null, 1, 3, 1, admin.lastInsertRowid
  );

  const q = db.prepare(`INSERT INTO questions(test_id,question_text,question_type,marks,negative_marks,sort_order) VALUES(?,?,?,?,?,?)`);
  const opt = db.prepare(`INSERT INTO options(question_id,option_text,option_order) VALUES(?,?,?)`);
  const ans = db.prepare(`INSERT INTO correct_answers(question_id,option_id) VALUES(?,?)`);

  const seedQuestions = [
    { text: "Which of the following is a vector quantity?", type: "SCQ", correct: [2], opts: ["Mass", "Velocity", "Temperature", "Time"] },
    { text: "Which of the following are vector quantities?", type: "MCQ", correct: [1,2,4], opts: ["Velocity", "Force", "Mass", "Acceleration"] },
    { text: "The SI unit of work is:", type: "SCQ", correct: [3], opts: ["Watt", "Newton", "Joule", "Pascal"] },
    { text: "Which quantities have dimensions of length?", type: "MCQ", correct: [1,3], opts: ["Wavelength", "Velocity", "Distance", "Momentum"] },
    { text: "A body moving at constant velocity has:", type: "SCQ", correct: [1], opts: ["Zero acceleration", "Increasing acceleration", "Variable mass", "Infinite force"] }
  ];
  for (let i = 0; i < seedQuestions.length; i++) {
    const s = seedQuestions[i];
    const qr = q.run(test.lastInsertRowid, s.text, s.type, 2, 0.5, i + 1);
    const optionIds: number[] = [];
    s.opts.forEach((text, idx) => {
      const or = opt.run(qr.lastInsertRowid, text, idx + 1);
      optionIds.push(Number(or.lastInsertRowid));
    });
    s.correct.forEach(n => ans.run(qr.lastInsertRowid, optionIds[n - 1]));
  }
}

seed();
export default db;

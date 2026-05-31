import { open } from '@op-engineering/op-sqlite';

let db: any = null;

function getDB() {
  if (!db) {
    db = open({ name: 'attendance.db' });
  }
  return db;
}

export function initDB() {
  const d = getDB();
  d.execute(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      face_vector TEXT NOT NULL
    )
  `);
  d.execute(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      face_vector TEXT NOT NULL,
      liveness_passed INTEGER NOT NULL,
      synced INTEGER DEFAULT 0
    )
  `);
}

export function saveEnrollment(employeeId: string, name: string, faceVector: number[]) {
  getDB().executeSync(
    `INSERT OR REPLACE INTO enrollments (employee_id, name, face_vector) VALUES (?, ?, ?)`,
    [employeeId, name, JSON.stringify(faceVector)]
  );
}

export function getEnrollments() {
  const result = getDB().executeSync(`SELECT * FROM enrollments`);
  console.log('[DB] getUnsynced result:', JSON.stringify(result));
  return Array.isArray(result.rows) ? result.rows : [];
}

export function saveAttendance(employeeId: string, faceVector: number[], livenessPassed: boolean) {
  getDB().executeSync(
    `INSERT INTO attendance (employee_id, timestamp, face_vector, liveness_passed, synced)
     VALUES (?, ?, ?, ?, 0)`,
    [employeeId, new Date().toISOString(), JSON.stringify(faceVector), livenessPassed ? 1 : 0]
  );
}

export function getUnsynced() {
  const result = getDB().executeSync(`SELECT * FROM attendance WHERE synced = 0`);
  console.log('[DB] getUnsynced result:', JSON.stringify(result));
  return Array.isArray(result.rows) ? result.rows : [];
}

export function markSynced(id: number) {
  getDB().executeSync(`UPDATE attendance SET synced = 1 WHERE id = ?`, [id]);
}

export function purgeSynced() {
  getDB().executeSync(`DELETE FROM attendance WHERE synced = 1`);
}

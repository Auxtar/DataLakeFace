import { open } from '@op-engineering/op-sqlite';

const db = open({ name: 'attendance.db' });

export function initDB() {
  db.execute(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      face_vector TEXT NOT NULL
    )
  `);
  db.execute(`
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
  db.execute(
    `INSERT OR REPLACE INTO enrollments (employee_id, name, face_vector) VALUES (?, ?, ?)`,
    [employeeId, name, JSON.stringify(faceVector)]
  );
}

export function getEnrollments() {
  const result = db.execute(`SELECT * FROM enrollments`);
  return result.rows?._array ?? [];
}

export function saveAttendance(employeeId: string, faceVector: number[], livenessPassed: boolean) {
  db.execute(
    `INSERT INTO attendance (employee_id, timestamp, face_vector, liveness_passed, synced)
     VALUES (?, ?, ?, ?, 0)`,
    [employeeId, new Date().toISOString(), JSON.stringify(faceVector), livenessPassed ? 1 : 0]
  );
}

export function getUnsynced() {
  const result = db.execute(`SELECT * FROM attendance WHERE synced = 0`);
  return result.rows?._array ?? [];
}

export function markSynced(id: number) {
  db.execute(`UPDATE attendance SET synced = 1 WHERE id = ?`, [id]);
}

export function purgeSynced() {
  db.execute(`DELETE FROM attendance WHERE synced = 1`);
}

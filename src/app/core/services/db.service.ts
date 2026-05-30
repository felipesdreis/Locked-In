import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

const DB_NAME = 'lockedin';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    frequency_type TEXT NOT NULL,
    frequency_days TEXT NOT NULL,
    reminder_time TEXT,
    created_at TEXT NOT NULL,
    archived_at TEXT,
    badge_7_days INTEGER DEFAULT 0,
    badge_30_days INTEGER DEFAULT 0,
    badge_100_days INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS completions (
    id TEXT PRIMARY KEY,
    habit_id TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    UNIQUE(habit_id, completed_at),
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
  );
`;

// Migrations to apply to existing databases that predate the SCHEMA columns.
const MIGRATIONS = [
  `ALTER TABLE habits ADD COLUMN badge_7_days INTEGER DEFAULT 0`,
  `ALTER TABLE habits ADD COLUMN badge_30_days INTEGER DEFAULT 0`,
  `ALTER TABLE habits ADD COLUMN badge_100_days INTEGER DEFAULT 0`,
];

@Injectable({ providedIn: 'root' })
export class DbService {
  private sqlite = new SQLiteConnection(CapacitorSQLite);
  private db!: SQLiteDBConnection;

  async initialize(): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      await customElements.whenDefined('jeep-sqlite');
      await this.sqlite.initWebStore();
    }
    this.db = await this.sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
    await this.db.open();
    await this.db.execute(SCHEMA);
    await this.runMigrations();
  }

  private async runMigrations(): Promise<void> {
    for (const sql of MIGRATIONS) {
      try {
        await this.db.run(sql, []);
        if (Capacitor.getPlatform() === 'web') {
          await this.sqlite.saveToStore(DB_NAME);
        }
      } catch {
        // Column already exists — safe to ignore duplicate column error
      }
    }
  }

  async query<T = unknown>(sql: string, values: unknown[] = []): Promise<T[]> {
    const result = await this.db.query(sql, values);
    return (result.values ?? []) as T[];
  }

  async run(sql: string, values: unknown[] = []): Promise<void> {
    await this.db.run(sql, values);
    if (Capacitor.getPlatform() === 'web') {
      await this.sqlite.saveToStore(DB_NAME);
    }
  }

  async runTransaction(statements: { sql: string; values?: unknown[] }[]): Promise<void> {
    await this.db.executeSet(statements.map(s => ({ statement: s.sql, values: s.values ?? [] })));
    if (Capacitor.getPlatform() === 'web') {
      await this.sqlite.saveToStore(DB_NAME);
    }
  }

  async exportAsJSON(): Promise<Blob> {
    const habits = await this.query<Record<string, string>>('SELECT * FROM habits ORDER BY created_at ASC');
    const completions = await this.query<Record<string, string>>('SELECT * FROM completions ORDER BY completed_at ASC');

    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      habits: habits.map(h => ({
        id: h['id'],
        name: h['name'],
        icon: h['icon'],
        color: h['color'],
        frequencyType: h['frequency_type'],
        frequencyDays: JSON.parse(h['frequency_days'] ?? '[]'),
        reminderTime: h['reminder_time'] ?? null,
        createdAt: h['created_at'],
        archivedAt: h['archived_at'] ?? null,
        badge7Days: h['badge_7_days'] === '1',
        badge30Days: h['badge_30_days'] === '1',
        badge100Days: h['badge_100_days'] === '1',
      })),
      completions: completions.map(c => ({
        id: c['id'],
        habitId: c['habit_id'],
        completedAt: c['completed_at'],
      })),
    };

    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  }
}

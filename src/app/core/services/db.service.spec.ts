import { TestBed } from '@angular/core/testing';
import { DbService } from './db.service';

// Capacitor plugins are not available in jsdom — stub the entire module.
const mockDbConnection = {
  open: jasmine.createSpy('open').and.resolveTo(undefined),
  execute: jasmine.createSpy('execute').and.resolveTo(undefined),
  query: jasmine.createSpy('query').and.resolveTo({ values: [] }),
  run: jasmine.createSpy('run').and.resolveTo(undefined),
};

const mockSqliteConnection = {
  initWebStore: jasmine.createSpy('initWebStore').and.resolveTo(undefined),
  createConnection: jasmine.createSpy('createConnection').and.resolveTo(mockDbConnection),
  saveToStore: jasmine.createSpy('saveToStore').and.resolveTo(undefined),
};

// Patch the constructor before the service is instantiated
jasmine.createSpy('SQLiteConnection');

describe('DbService', () => {
  let service: DbService;

  beforeEach(() => {
    // Reset call counts between tests
    mockDbConnection.open.calls.reset();
    mockDbConnection.execute.calls.reset();
    mockDbConnection.query.calls.reset();
    mockDbConnection.run.calls.reset();
    mockSqliteConnection.initWebStore.calls.reset();
    mockSqliteConnection.createConnection.calls.reset();
    mockSqliteConnection.saveToStore.calls.reset();

    // Stub customElements.whenDefined so initialize() does not block waiting for jeep-sqlite
    spyOn(customElements, 'whenDefined').and.resolveTo(undefined as unknown as CustomElementConstructor);

    TestBed.configureTestingModule({ providers: [DbService] });
    service = TestBed.inject(DbService);

    // Inject the mock connection directly (bypasses Capacitor native bridge)
    (service as unknown as { sqlite: unknown; db: unknown }).sqlite = mockSqliteConnection;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initialize()', () => {
    it('calls initWebStore on web platform', async () => {
      await service.initialize();
      expect(mockSqliteConnection.initWebStore).toHaveBeenCalledTimes(1);
    });

    it('creates and opens database connection', async () => {
      await service.initialize();
      expect(mockSqliteConnection.createConnection).toHaveBeenCalled();
      expect(mockDbConnection.open).toHaveBeenCalled();
    });

    it('executes schema on initialization', async () => {
      await service.initialize();
      expect(mockDbConnection.execute).toHaveBeenCalledTimes(1);
      const [schema] = mockDbConnection.execute.calls.first().args as [string];
      expect(schema).toContain('CREATE TABLE IF NOT EXISTS habits');
      expect(schema).toContain('CREATE TABLE IF NOT EXISTS completions');
    });
  });

  describe('query()', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('returns typed results from the database', async () => {
      const fakeRows = [{ id: '1', name: 'Run' }];
      mockDbConnection.query.and.resolveTo({ values: fakeRows });

      const result = await service.query<{ id: string; name: string }>('SELECT * FROM habits');

      expect(result).toEqual(fakeRows);
    });

    it('returns empty array when result has no values', async () => {
      mockDbConnection.query.and.resolveTo({ values: undefined });

      const result = await service.query('SELECT * FROM habits');

      expect(result).toEqual([]);
    });

    it('forwards bind parameters to the driver', async () => {
      mockDbConnection.query.and.resolveTo({ values: [] });

      await service.query('SELECT * FROM habits WHERE id=?', ['abc']);

      expect(mockDbConnection.query).toHaveBeenCalledWith('SELECT * FROM habits WHERE id=?', ['abc']);
    });
  });

  describe('run()', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('executes SQL without returning rows', async () => {
      await service.run('INSERT INTO habits (id) VALUES (?)', ['123']);

      expect(mockDbConnection.run).toHaveBeenCalledWith(
        'INSERT INTO habits (id) VALUES (?)',
        ['123'],
      );
    });

    it('executes SQL with no parameters', async () => {
      await service.run('DELETE FROM completions');

      expect(mockDbConnection.run).toHaveBeenCalledWith('DELETE FROM completions', []);
    });
  });

  describe('exportAsJSON()', () => {
    const fakeHabit = {
      id: 'h1', name: 'Run', icon: '🏃', color: '#ff0000',
      frequency_type: 'daily', frequency_days: '[]',
      reminder_time: null, created_at: '2026-01-01T00:00:00.000Z',
      archived_at: null,
      badge_7_days: '0', badge_30_days: '0', badge_100_days: '0',
    };
    const fakeCompletion = { id: 'c1', habit_id: 'h1', completed_at: '2026-01-01' };

    beforeEach(async () => {
      await service.initialize();
    });

    it('returns a valid JSON Blob with habits and completions', async () => {
      mockDbConnection.query.and.callFake(async (sql: string) => {
        if (sql.includes('FROM habits')) return { values: [fakeHabit] };
        if (sql.includes('FROM completions')) return { values: [fakeCompletion] };
        return { values: [] };
      });

      const blob = await service.exportAsJSON();
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');

      const text = await blob.text();
      const parsed = JSON.parse(text);
      expect(parsed['version']).toBe('1.0');
      expect(parsed['exportedAt']).toBeTruthy();
      expect(parsed['habits'].length).toBe(1);
      expect(parsed['habits'][0]['id']).toBe('h1');
      expect(parsed['completions'].length).toBe(1);
      expect(parsed['completions'][0]['habitId']).toBe('h1');
    });

    it('returns empty arrays when no data exists', async () => {
      mockDbConnection.query.and.resolveTo({ values: [] });

      const blob = await service.exportAsJSON();
      const text = await blob.text();
      const parsed = JSON.parse(text);

      expect(parsed['habits']).toEqual([]);
      expect(parsed['completions']).toEqual([]);
    });

    it('includes archived habits in the export', async () => {
      const archivedHabit = { ...fakeHabit, id: 'h2', archived_at: '2026-03-01T00:00:00.000Z' };
      mockDbConnection.query.and.callFake(async (sql: string) => {
        if (sql.includes('FROM habits')) return { values: [fakeHabit, archivedHabit] };
        return { values: [] };
      });

      const blob = await service.exportAsJSON();
      const text = await blob.text();
      const parsed = JSON.parse(text);

      expect(parsed['habits'].length).toBe(2);
      expect(parsed['habits'][1]['archivedAt']).toBe('2026-03-01T00:00:00.000Z');
    });
  });
});

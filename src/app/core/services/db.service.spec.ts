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
});

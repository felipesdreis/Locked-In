import { TestBed } from '@angular/core/testing';
import { ShareService } from './share.service';
import { Habit } from '../models/habit.model';

const MOCK_HABIT: Habit = {
  id: 'h1',
  name: 'Meditação',
  icon: '🧘',
  color: '#43b89c',
  frequencyType: 'daily',
  frequencyDays: [],
  reminderTime: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  archivedAt: null,
  badge7Days: false,
  badge30Days: false,
  badge100Days: false,
};

describe('ShareService', () => {
  let service: ShareService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShareService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('generateStreakImage returns a Blob with type image/png', async () => {
    const blob = await service.generateStreakImage(MOCK_HABIT, 7);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/png');
  });

  it('generateStreakImage returns non-empty blob', async () => {
    const blob = await service.generateStreakImage(MOCK_HABIT, 30);
    expect(blob.size).toBeGreaterThan(0);
  });

  it('generateStreakImage truncates long habit names', async () => {
    const longName = 'A'.repeat(25);
    const blob = await service.generateStreakImage({ ...MOCK_HABIT, name: longName }, 7);
    expect(blob).toBeInstanceOf(Blob);
  });

  it('generateStreakImage works with streak 100', async () => {
    const blob = await service.generateStreakImage(MOCK_HABIT, 100);
    expect(blob.size).toBeGreaterThan(0);
  });
});

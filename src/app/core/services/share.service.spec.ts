import { TestBed } from '@angular/core/testing';
import { ShareService } from './share.service';
import { HabitWithStreak } from '../models/habit.model';

const MOCK_HABIT: HabitWithStreak = {
  id: 'h1',
  name: 'Meditação',
  icon: 'meditate',
  color: '#43b89c',
  frequencyType: 'daily',
  frequencyDays: [],
  reminderTime: null,
  createdAt: '2024-01-01',
  archivedAt: null,
  badge7Days: false,
  badge30Days: false,
  badge100Days: false,
  currentStreak: 7,
  longestStreak: 12,
  completedToday: true,
  totalCompletions: 27,
};

const MOCK_DAYS = Array.from({ length: 7 }, (_, i) => ({
  label: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][i],
  completed: i % 2 === 0,
}));

describe('ShareService', () => {
  let service: ShareService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShareService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('generateShareImage returns a Blob with type image/png', async () => {
    const blob = await service.generateShareImage(MOCK_HABIT, 92, MOCK_DAYS);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/png');
  });

  it('generateShareImage returns non-empty blob', async () => {
    const blob = await service.generateShareImage(MOCK_HABIT, 80, MOCK_DAYS);
    expect(blob.size).toBeGreaterThan(0);
  });

  it('generateShareImage handles 100% consistency', async () => {
    const blob = await service.generateShareImage(MOCK_HABIT, 100, MOCK_DAYS);
    expect(blob).toBeInstanceOf(Blob);
  });

  it('generateShareImage handles long habit name', async () => {
    const habit = { ...MOCK_HABIT, name: 'A'.repeat(30) };
    const blob = await service.generateShareImage(habit, 70, MOCK_DAYS);
    expect(blob).toBeInstanceOf(Blob);
  });
});

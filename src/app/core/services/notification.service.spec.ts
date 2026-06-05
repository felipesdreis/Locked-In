import { TestBed } from '@angular/core/testing';
import { NotificationService, LOCAL_NOTIFICATIONS } from './notification.service';

function buildPluginMock() {
  return {
    // checkPermissions is called first; default to 'prompt' so tests flow through to requestPermissions
    checkPermissions: jasmine.createSpy('checkPermissions').and.resolveTo({ display: 'prompt' }),
    requestPermissions: jasmine.createSpy('requestPermissions').and.resolveTo({ display: 'granted' }),
    schedule: jasmine.createSpy('schedule').and.resolveTo(undefined),
    cancel: jasmine.createSpy('cancel').and.resolveTo(undefined),
    createChannel: jasmine.createSpy('createChannel').and.resolveTo(undefined),
  };
}

describe('NotificationService', () => {
  let service: NotificationService;
  let plugin: ReturnType<typeof buildPluginMock>;

  beforeEach(() => {
    plugin = buildPluginMock();
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: LOCAL_NOTIFICATIONS, useValue: plugin },
      ],
    });
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── UUID → int32 (djb2-based hash) ────────────────────────────────────────

  describe('numeric id derivation', () => {
    it('produces a positive integer id for a given UUID', async () => {
      await service.schedule({ id: '550e8400-e29b-41d4-a716-446655440000', name: 'Test', reminderTime: '09:00', frequencyType: 'daily', frequencyDays: [] });

      const notifId: number = plugin.schedule.calls.first().args[0].notifications[0].id;
      expect(Number.isInteger(notifId)).toBeTrue();
      expect(notifId).toBeGreaterThanOrEqual(0);
    });

    it('produces the same id for the same UUID on every call', async () => {
      const uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
      await service.schedule({ id: uuid, name: 'Stable', reminderTime: '10:00', frequencyType: 'daily', frequencyDays: [] });
      const firstId: number = plugin.schedule.calls.first().args[0].notifications[0].id;

      plugin.schedule.calls.reset();
      await service.schedule({ id: uuid, name: 'Stable', reminderTime: '10:00', frequencyType: 'daily', frequencyDays: [] });
      const secondId: number = plugin.schedule.calls.first().args[0].notifications[0].id;

      expect(firstId).toBe(secondId);
    });

    it('produces different ids for different UUIDs', async () => {
      await service.schedule({ id: '11111111-0000-0000-0000-000000000000', name: 'A', reminderTime: '06:00', frequencyType: 'daily', frequencyDays: [] });
      const id1: number = plugin.schedule.calls.mostRecent().args[0].notifications[0].id;

      await service.schedule({ id: '22222222-0000-0000-0000-000000000000', name: 'B', reminderTime: '06:00', frequencyType: 'daily', frequencyDays: [] });
      const id2: number = plugin.schedule.calls.mostRecent().args[0].notifications[0].id;

      expect(id1).not.toBe(id2);
    });

    it('cancel uses the same id derivation as schedule', async () => {
      const uuid = '99999999-0000-0000-0000-000000000000';
      await service.schedule({ id: uuid, name: 'Match', reminderTime: '07:30', frequencyType: 'daily', frequencyDays: [] });
      const scheduledId: number = plugin.schedule.calls.first().args[0].notifications[0].id;

      await service.cancel(uuid);
      const cancelledId: number = plugin.cancel.calls.first().args[0].notifications[0].id;

      expect(scheduledId).toBe(cancelledId);
    });
  });

  // ── schedule() ─────────────────────────────────────────────────────────────

  describe('schedule()', () => {
    it('schedules a notification with the correct hour and minute', async () => {
      await service.schedule({ id: 'abc-123', name: 'Drink water', reminderTime: '14:30', frequencyType: 'daily', frequencyDays: [] });

      expect(plugin.schedule).toHaveBeenCalledTimes(1);
      const { hour, minute } = plugin.schedule.calls.first().args[0].notifications[0].schedule.on;
      expect(hour).toBe(14);
      expect(minute).toBe(30);
    });

    it('uses the habit name in the notification body', async () => {
      await service.schedule({ id: 'xyz', name: 'Meditate', reminderTime: '06:00', frequencyType: 'daily', frequencyDays: [] });

      const body: string = plugin.schedule.calls.first().args[0].notifications[0].body;
      expect(body).toContain('Meditate');
    });

    it('targets the reminders channel', async () => {
      await service.schedule({ id: 'ch-test', name: 'Run', reminderTime: '07:00', frequencyType: 'daily', frequencyDays: [] });

      const channelId: string = plugin.schedule.calls.first().args[0].notifications[0].channelId;
      expect(channelId).toBe('reminders');
    });
  });

  // ── cancel() ───────────────────────────────────────────────────────────────

  describe('cancel()', () => {
    it('calls the plugin cancel method with one notification entry', async () => {
      await service.cancel('habit-id-001');

      expect(plugin.cancel).toHaveBeenCalledTimes(1);
      const notifications: Array<{ id: number }> = plugin.cancel.calls.first().args[0].notifications;
      expect(notifications.length).toBe(8);
      expect(typeof notifications[0].id).toBe('number');
    });
  });

  // ── requestPermission() ────────────────────────────────────────────────────

  describe('requestPermission()', () => {
    it('returns true when checkPermissions reports granted (no dialog shown)', async () => {
      plugin.checkPermissions.and.resolveTo({ display: 'granted' });
      const result = await service.requestPermission();
      expect(result).toBeTrue();
      expect(plugin.requestPermissions).not.toHaveBeenCalled();
    });

    it('returns false immediately when checkPermissions reports denied (no dialog shown)', async () => {
      plugin.checkPermissions.and.resolveTo({ display: 'denied' });
      const result = await service.requestPermission();
      expect(result).toBeFalse();
      expect(plugin.requestPermissions).not.toHaveBeenCalled();
    });

    it('shows the system dialog when checkPermissions reports prompt', async () => {
      plugin.checkPermissions.and.resolveTo({ display: 'prompt' });
      plugin.requestPermissions.and.resolveTo({ display: 'granted' });
      const result = await service.requestPermission();
      expect(result).toBeTrue();
      expect(plugin.requestPermissions).toHaveBeenCalledTimes(1);
    });

    it('returns false when the user denies the prompt', async () => {
      plugin.checkPermissions.and.resolveTo({ display: 'prompt' });
      plugin.requestPermissions.and.resolveTo({ display: 'denied' });
      const result = await service.requestPermission();
      expect(result).toBeFalse();
    });
  });

  // ── createChannel() ────────────────────────────────────────────────────────

  describe('createChannel()', () => {
    it('creates a channel with id "reminders"', async () => {
      await service.createChannel();

      expect(plugin.createChannel).toHaveBeenCalledTimes(1);
      const channelArg: { id: string } = plugin.createChannel.calls.first().args[0];
      expect(channelArg.id).toBe('reminders');
    });
  });
});

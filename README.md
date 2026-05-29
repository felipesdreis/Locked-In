# Locked In

Android habit-tracker inspired by [Streaks](https://streaksapp.com). Build consecutive-day streaks, view analytics, and receive local reminders — all without an account or internet connection.

**Stack:** Ionic 7 · Angular 17 (standalone) · Capacitor 7 · SQLite (local-only)  
**Version:** 1.1.0

---

## Features

- Create habits with custom icon, color, and name (up to 50 characters)
- Frequency types: daily, weekdays, weekends, specific days (custom), or N times per week
- Automatic streak calculation for all frequency types
- Local notifications with configurable reminder time per habit
- 30-day calendar view per period, navigable backwards through full history
- Analytics: today's rate, weekly rate, top streaks, per-day bar chart, 30-day heatmap
- Archive and restore habits (history preserved)
- Dark mode — auto-detected from system preference, persists across sessions
- 100% local — no account, no cloud sync, no telemetry

---

## Getting Started

### Prerequisites

- Node v20.16.0 (exact — Angular 17 + Capacitor 7 do not support v21+)
- Android Studio (for Android builds)
- JDK 21 + Android SDK (for command-line APK builds on Windows)

### Dev server (browser)

```bash
npm install
npm start
# → http://localhost:4200
```

### Run tests

```bash
npm run test:single
# with coverage:
npm run test:single -- --code-coverage
```

### Build for Android

**Option A — Android Studio (recommended):**

```bash
npm run build:android   # builds web assets and syncs to Android
npm run android         # opens Android Studio
# → run on device/emulator from Android Studio
```

**Option B — Command-line APK (Windows, requires JDK 21 + Android SDK at `C:\Android`):**

```bat
build-apk.bat
# → APK at android\app\build\outputs\apk\debug\app-debug.apk
```

---

## Project Structure

```
src/app/
  core/
    models/       # Habit, Completion, HabitWithStreak types
    services/     # DbService, HabitService, StreakService, NotificationService
    utils/        # date helpers (toDateString, parseDateString, ISO week utils)
  features/
    home/             # Habit list + toggle completions
    habit-form/       # Create/edit habit (shared route via :id param)
    habit-detail/     # 30-day calendar + streak stats
    analytics/        # Aggregate dashboard
    archived-habits/  # Archive management
  shared/
    components/
      habit-card/     # Habit list item with streak, weekly progress, toggle
```

---

## Android Target

- **Min SDK:** API 26 (Android 8.0)
- **Target SDK:** API 34
- **Required permissions:** `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`

---

## Docs

- [Roadmap](roadmap.md)
- [Store Listing](store-listing.md)
- [Privacy Policy](privacy-policy.md)
- [Changelog](CHANGELOG.md)

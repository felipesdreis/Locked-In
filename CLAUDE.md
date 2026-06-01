# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Locked In** — Android habit-tracker app inspired by Streaks (streaksapp.com). Users create habits, mark completions, build consecutive-day streaks, and view analytics. Data is local-only (SQLite on device). No backend, no auth.

Stack: **Ionic 7 + Angular 17 (standalone components) + Capacitor 7 + SQLite**.

## Commands

```bash
# Dev server (browser, hot-reload)
npm start

# Build web assets
npm run build

# Build + sync to Android
npm run build:android

# Open in Android Studio
npm run android

# Sync web assets to native (after build)
npm run cap:sync

# Run all tests (non-interactive)
npm run test:single

# Run a specific spec file
npx ng test --include='src/app/core/services/streak.service.spec.ts' --no-watch

# Lint
npm run lint

# Build APK release (Windows) — run build-apk.bat, then open Android Studio to sign/install
build-apk.bat
```

> **Android workflow**: `npm run build:android` then `npm run android` to open Android Studio, then run on device/emulator from there. You cannot run the Android app directly from the CLI.

## Architecture

### Folder structure

```
src/app/
  core/
    models/          # habit.model.ts — Habit, Completion, HabitWithStreak, WeeklyProgress types
    services/        # db, habit, streak, notification, share services
    utils/           # date.util.ts — toDateString, subtractDays, getLast, parseDateString
  features/
    home/            # Main list page — reads habitsWithStreak signal, toggles completions
    habit-form/      # Create/edit page — shared via route param :id
    habit-detail/    # Calendar view + streak stats for a single habit
    analytics/       # Aggregate stats — today rate, top streaks
    archived-habits/ # List of archived habits — restore or delete permanently
    onboarding/      # Tutorial component shown on first launch
    settings/        # Export JSON backup; app version info
  shared/
    components/
      habit-card/              # Ion list item — icon, name, streak count, completion toggle
      screen-header/           # Page header with back button and title
      topbar/                  # App-level top bar
      wordmark/                # SVG logo lockup
      icon/                    # Wrapped Ionicon with design-system sizing
      streak/                  # Streak count badge
      pill/                    # Tag/label chip
      ring/                    # Circular progress ring
      court-line/              # Decorative SVG divider
      court-mark/              # Basketball court mark accent
      hoop/                    # Hoop icon illustration
      badge-celebration-modal/ # Full-screen milestone celebration overlay
      share-preview-modal/     # Preview card before native share sheet
```

### Data flow

`DbService` wraps `@capacitor-community/sqlite` and exposes typed `query<T>()`, `run()`, and `runTransaction()` (bulk `executeSet`) methods. On web, both `run()` and `runTransaction()` call `saveToStore()` automatically to persist changes. `HabitService` owns two Angular **signals**: `_habits` and `_completions`. `habitsWithStreak` is a `computed()` that joins them via `StreakService.calculate()`. Pages inject `HabitService` and read signals directly — no RxJS observables.

Every mutation (create, update, archive, toggleToday) calls `db.run()` then re-calls `load()` to refresh both signals. This keeps the signals as the single source of truth.

### Streak logic

`StreakService.calculate()` walks backwards day-by-day up to 730 days. It skips non-scheduled days (based on `Habit.frequencyType`). A missed scheduled day resets the in-progress streak, but today is skipped in the break check (so users who haven't completed yet don't see 0). The `x_per_week` frequency type treats every day as a scheduled day at the streak level — per-week validation is not yet implemented.

### Notifications

`NotificationService` uses `@capacitor/local-notifications`. UUIDs are converted to stable 32-bit ints (djb2 hash) to satisfy the integer ID requirement of the plugin. Each habit has at most one notification scheduled, keyed by habit ID. Recreating a notification requires cancelling the old one first (handled by `HabitService.update()`).

### Ionic / Angular integration

All components are **standalone**. `provideIonicAngular({ mode: 'md' })` forces Material Design mode (appropriate for Android). Ion components are imported individually per-component from `@ionic/angular/standalone` — never use `IonicModule`. Ionicons must be registered with `addIcons()` inside the component constructor before use.

### SQLite on device vs browser

`DbService.initialize()` awaits `customElements.whenDefined('jeep-sqlite')` before calling `this.sqlite.initWebStore()` on the `web` platform — the `<jeep-sqlite>` element must be present in `index.html` for this to resolve. On Android, it skips this and opens the native SQLite file directly. `initialize()` must be awaited before any service method is called — the intended call site is `APP_INITIALIZER` or `main.ts`.

### Android Home Screen Widget

Two native widgets live in `android/app/src/main/java/com/lockedin/app/`:
- `LockedInWidget.java` — 2×2 compact widget
- `LockedInWidget4x2.java` — 4×2 "Shot Clock / Placar do Jogo" widget (basketball theme)

Widgets read habit data from `SharedPreferences` written by the app on every completion toggle. They use `RemoteViews` for rendering.

**RemoteViews gotchas (cause `InflateException` on device):**
- `android:alpha` is not supported — bake opacity into the color value instead.
- Plain `<View>` elements fail on older APIs — use `<TextView>` with empty text as a divider.

## Key constraints

- **Node v20.16.0** — Angular 21 and Capacitor 8 CLI require newer Node. Stay on Angular 17 and Capacitor 7.
- **Capacitor 7 + @capacitor-community/sqlite 7** — keep these in sync; v8 of the sqlite plugin requires Capacitor 8.
- The Stencil `empty-glob` warning during build is harmless — it comes from Ionic internals.
- Angular templates do not support arrow functions (`=>`) in interpolation. Move computed values to `computed()` signals or component methods.

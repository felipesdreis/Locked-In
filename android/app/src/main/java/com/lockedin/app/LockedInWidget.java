package com.lockedin.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.widget.RemoteViews;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Android home-screen widget showing how many habits are pending today.
 * Reads directly from the Capacitor SQLite file created by the app.
 */
public class LockedInWidget extends AppWidgetProvider {

    public static final String ACTION_UPDATE = "com.lockedin.app.WIDGET_UPDATE";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int widgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, widgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_UPDATE.equals(intent.getAction())) {
            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            int[] ids = manager.getAppWidgetIds(
                new android.content.ComponentName(context, LockedInWidget.class)
            );
            onUpdate(context, manager, ids);
        }
    }

    private void updateWidget(Context context, AppWidgetManager manager, int widgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_layout);

        // Tap on widget opens the app
        Intent launchIntent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context, 0, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(android.R.id.content, pendingIntent);

        WidgetData data = queryHabitData(context);
        applyData(views, data);

        manager.updateAppWidget(widgetId, views);
    }

    private void applyData(RemoteViews views, WidgetData data) {
        if (data.total == 0) {
            views.setTextViewText(R.id.widget_count, "🔒");
            views.setTextViewText(R.id.widget_label, "Comece a criar hábitos");
        } else if (data.pending == 0) {
            views.setTextViewText(R.id.widget_count, "✓");
            views.setTextViewText(R.id.widget_label, "Todos completos hoje!");
        } else {
            views.setTextViewText(R.id.widget_count, String.valueOf(data.pending));
            views.setTextViewText(R.id.widget_label, data.pending == 1 ? "hábito hoje" : "hábitos hoje");
        }
    }

    private WidgetData queryHabitData(Context context) {
        WidgetData data = new WidgetData();

        // Capacitor SQLite stores the DB in the app's databases directory
        File dbFile = new File(context.getDatabasePath("lockedinSQLite.db").getPath());
        if (!dbFile.exists()) {
            // Try alternative name used by capacitor-community/sqlite
            dbFile = new File(context.getDatabasePath("lockedin").getPath());
        }
        if (!dbFile.exists()) return data;

        SQLiteDatabase db = null;
        try {
            db = SQLiteDatabase.openDatabase(dbFile.getPath(), null, SQLiteDatabase.OPEN_READONLY);

            String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());

            // Count all active (non-archived) habits scheduled for today
            // For simplicity we count all daily-like habits; widget is a motivational nudge
            Cursor totalCursor = db.rawQuery(
                "SELECT COUNT(*) FROM habits WHERE archived_at IS NULL", null
            );
            if (totalCursor.moveToFirst()) {
                data.total = totalCursor.getInt(0);
            }
            totalCursor.close();

            // Count completions today
            Cursor doneCursor = db.rawQuery(
                "SELECT COUNT(*) FROM completions WHERE completed_at = ?", new String[]{today}
            );
            if (doneCursor.moveToFirst()) {
                data.completed = doneCursor.getInt(0);
            }
            doneCursor.close();

            data.pending = Math.max(data.total - data.completed, 0);
        } catch (Exception e) {
            // DB not yet initialized or locked — show default state
        } finally {
            if (db != null) db.close();
        }
        return data;
    }

    private static class WidgetData {
        int total = 0;
        int completed = 0;
        int pending = 0;
    }
}

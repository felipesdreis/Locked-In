package com.lockedin.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.view.View;
import android.widget.RemoteViews;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * 2×2 "Shot Clock" widget — shows pending habit count or GAME OVER checkmark.
 * Reads directly from the Capacitor SQLite file.
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
            int[] ids = manager.getAppWidgetIds(new ComponentName(context, LockedInWidget.class));
            onUpdate(context, manager, ids);
        }
    }

    static void updateWidget(Context context, AppWidgetManager manager, int widgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_layout);

        Intent launchIntent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context, 0, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

        WidgetData data = queryWidgetData(context);
        applyShotClock(views, data);

        manager.updateAppWidget(widgetId, views);
    }

    static void applyShotClock(RemoteViews views, WidgetData data) {
        boolean gameOver = data.total > 0 && data.pending == 0;
        int progress = data.total > 0 ? (int) ((data.total - data.pending) * 100f / data.total) : 0;

        views.setInt(R.id.widget_root, "setBackgroundResource",
            gameOver ? R.drawable.widget_background_gameover : R.drawable.widget_background);

        views.setImageViewResource(R.id.widget_hoop,
            gameOver ? R.drawable.widget_ring_orange : R.drawable.widget_ring);

        if (gameOver) {
            views.setViewVisibility(R.id.widget_pending_count, View.GONE);
            views.setViewVisibility(R.id.widget_check, View.VISIBLE);
            views.setTextViewText(R.id.widget_label, "GAME OVER.\nCLEAN SHEET.");
            views.setTextColor(R.id.widget_label, 0xFFD84315);
        } else {
            views.setViewVisibility(R.id.widget_pending_count, View.VISIBLE);
            views.setViewVisibility(R.id.widget_check, View.GONE);
            String countText = data.total == 0
                ? "--"
                : String.format(Locale.US, "%02d", data.pending);
            views.setTextViewText(R.id.widget_pending_count, countText);
            views.setTextViewText(R.id.widget_label, data.total == 0 ? "SEM HÁBITOS" : "PENDENTES");
            views.setTextColor(R.id.widget_label, 0xEBF5F5F5);
        }

        views.setProgressBar(R.id.widget_progress, 100, gameOver ? 100 : progress, false);
    }

    static WidgetData queryWidgetData(Context context) {
        WidgetData data = new WidgetData();

        File dbFile = resolveDbFile(context);
        if (dbFile == null) return data;

        SQLiteDatabase db = null;
        try {
            db = SQLiteDatabase.openDatabase(dbFile.getPath(), null, SQLiteDatabase.OPEN_READONLY);
            String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());

            Cursor totalCursor = db.rawQuery(
                "SELECT COUNT(*) FROM habits WHERE archived_at IS NULL", null);
            if (totalCursor.moveToFirst()) data.total = totalCursor.getInt(0);
            totalCursor.close();

            Cursor doneCursor = db.rawQuery(
                "SELECT COUNT(*) FROM completions WHERE completed_at = ?", new String[]{today});
            if (doneCursor.moveToFirst()) data.completed = doneCursor.getInt(0);
            doneCursor.close();

            // Names of pending habits (up to 3) for the 4×2 widget
            Cursor namesCursor = db.rawQuery(
                "SELECT name FROM habits WHERE archived_at IS NULL" +
                " AND id NOT IN (SELECT habit_id FROM completions WHERE completed_at = ?)" +
                " LIMIT 3",
                new String[]{today});
            int idx = 0;
            while (namesCursor.moveToNext() && idx < 3) {
                data.pendingNames[idx++] = namesCursor.getString(0);
            }
            namesCursor.close();

            data.pending = Math.max(data.total - data.completed, 0);
        } catch (Exception ignored) {
        } finally {
            if (db != null) db.close();
        }
        return data;
    }

    static File resolveDbFile(Context context) {
        File f = context.getDatabasePath("lockedinSQLite.db");
        if (f.exists()) return f;
        f = context.getDatabasePath("lockedin");
        return f.exists() ? f : null;
    }

    static class WidgetData {
        int total = 0;
        int completed = 0;
        int pending = 0;
        String[] pendingNames = new String[3];
    }
}

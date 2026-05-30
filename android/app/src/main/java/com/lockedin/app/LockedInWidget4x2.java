package com.lockedin.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.view.View;
import android.widget.RemoteViews;

import java.util.Locale;

/**
 * 4×2 "Placar do Jogo" widget — shows pending count left + habit names right.
 * Reads from the same Capacitor SQLite file via LockedInWidget helpers.
 */
public class LockedInWidget4x2 extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int widgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, widgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (LockedInWidget.ACTION_UPDATE.equals(intent.getAction())) {
            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            int[] ids = manager.getAppWidgetIds(new ComponentName(context, LockedInWidget4x2.class));
            onUpdate(context, manager, ids);
        }
    }

    private void updateWidget(Context context, AppWidgetManager manager, int widgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_layout_4x2);

        Intent launchIntent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context, 2, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_4x2_root, pendingIntent);

        LockedInWidget.WidgetData data = LockedInWidget.queryWidgetData(context);
        applyGameScore(views, data);

        manager.updateAppWidget(widgetId, views);
    }

    private void applyGameScore(RemoteViews views, LockedInWidget.WidgetData data) {
        boolean gameOver = data.total > 0 && data.pending == 0;
        int progress = data.total > 0 ? (int) ((data.total - data.pending) * 100f / data.total) : 0;

        views.setInt(R.id.widget_4x2_root, "setBackgroundResource",
            gameOver ? R.drawable.widget_background_gameover : R.drawable.widget_background);

        // Left side: count or check
        if (gameOver) {
            views.setViewVisibility(R.id.widget_4x2_count, View.GONE);
            views.setViewVisibility(R.id.widget_4x2_check, View.VISIBLE);
            views.setTextViewText(R.id.widget_4x2_label_left, "CLEAN SHEET");
            views.setTextColor(R.id.widget_4x2_label_left, 0xFFD84315);
        } else {
            views.setViewVisibility(R.id.widget_4x2_count, View.VISIBLE);
            views.setViewVisibility(R.id.widget_4x2_check, View.GONE);
            String countText = data.total == 0
                ? "--"
                : String.format(Locale.US, "%02d", data.pending);
            views.setTextViewText(R.id.widget_4x2_count, countText);
            views.setTextViewText(R.id.widget_4x2_label_left,
                data.total == 0 ? "SEM HÁBITOS" : "REMANESCENTES");
            views.setTextColor(R.id.widget_4x2_label_left, 0xEBF5F5F5);
        }

        // Right side: habit names or game over message
        int[] rowIds = {
            R.id.widget_4x2_habit_row1,
            R.id.widget_4x2_habit_row2,
            R.id.widget_4x2_habit_row3
        };
        int[] nameIds = {
            R.id.widget_4x2_habit1,
            R.id.widget_4x2_habit2,
            R.id.widget_4x2_habit3
        };

        if (gameOver) {
            for (int rowId : rowIds) views.setViewVisibility(rowId, View.GONE);
            views.setViewVisibility(R.id.widget_4x2_gameover_text, View.VISIBLE);
        } else {
            views.setViewVisibility(R.id.widget_4x2_gameover_text, View.GONE);
            for (int i = 0; i < 3; i++) {
                String name = data.pendingNames[i];
                if (name != null) {
                    views.setViewVisibility(rowIds[i], View.VISIBLE);
                    views.setTextViewText(nameIds[i], name);
                } else {
                    views.setViewVisibility(rowIds[i], View.GONE);
                }
            }
        }

        views.setProgressBar(R.id.widget_4x2_progress, 100, gameOver ? 100 : progress, false);
    }
}

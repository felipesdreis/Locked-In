package br.fdrapps.lockedin;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.util.DisplayMetrics;
import android.util.Log;
import android.util.TypedValue;
import android.view.View;
import android.widget.RemoteViews;

import java.util.Locale;

/**
 * 4×2 "Placar do Jogo" widget — contagem à esquerda + lista de hábitos à direita.
 * Dados compartilhados com LockedInWidget via queryWidgetData().
 */
public class LockedInWidget4x2 extends AppWidgetProvider {

    private static final String TAG = "LockedInWidget4x2";

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

        // BUG-006: widgetId como requestCode garante unicidade por instância
        Intent launchIntent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context, widgetId, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_4x2_root, pendingIntent);

        LockedInWidget.WidgetData data = LockedInWidget.queryWidgetData(context);
        applyGameScore(context, views, data);

        manager.updateAppWidget(widgetId, views);
    }

    /** Returns a scale factor normalized to 360dp width (typical phone). Clamped 0.85–1.4. */
    private float calcScale(Context context) {
        DisplayMetrics dm = context.getResources().getDisplayMetrics();
        float widthDp = dm.widthPixels / dm.density;
        return Math.max(0.85f, Math.min(1.4f, widthDp / 360f));
    }

    private void applyTextSizes(RemoteViews views, float scale) {
        views.setTextViewTextSize(R.id.widget_4x2_wordmark,  TypedValue.COMPLEX_UNIT_SP, Math.round(10 * scale));
        views.setTextViewTextSize(R.id.widget_4x2_count,     TypedValue.COMPLEX_UNIT_SP, Math.round(52 * scale));
        views.setTextViewTextSize(R.id.widget_4x2_label_left, TypedValue.COMPLEX_UNIT_SP, Math.round(9 * scale));
        views.setTextViewTextSize(R.id.widget_4x2_habit1,    TypedValue.COMPLEX_UNIT_SP, Math.round(12 * scale));
        views.setTextViewTextSize(R.id.widget_4x2_habit2,    TypedValue.COMPLEX_UNIT_SP, Math.round(12 * scale));
        views.setTextViewTextSize(R.id.widget_4x2_habit3,    TypedValue.COMPLEX_UNIT_SP, Math.round(12 * scale));
        views.setTextViewTextSize(R.id.widget_4x2_gameover_text, TypedValue.COMPLEX_UNIT_SP, Math.round(12 * scale));
    }

    private void applyGameScore(Context context, RemoteViews views, LockedInWidget.WidgetData data) {
        applyTextSizes(views, calcScale(context));
        boolean gameOver = data.total > 0 && data.pending == 0;
        boolean noHabits = data.total == 0;
        int progress = data.total > 0
            ? (int) ((data.total - data.pending) * 100f / data.total)
            : 0;

        Log.d(TAG, "applyGameScore: total=" + data.total + " pending=" + data.pending
            + " gameOver=" + gameOver);

        // BUG-001: checkmark criado como Bitmap, não VectorDrawable
        Bitmap checkBmp = LockedInWidget.createCheckBitmap(context, 44);
        views.setImageViewBitmap(R.id.widget_4x2_check, checkBmp);

        views.setInt(R.id.widget_4x2_root, "setBackgroundResource",
            gameOver ? R.drawable.widget_background_gameover : R.drawable.widget_background);

        // ── Lado esquerdo ────────────────────────────────────────────────────
        if (gameOver) {
            views.setViewVisibility(R.id.widget_4x2_count, View.GONE);
            views.setViewVisibility(R.id.widget_4x2_check, View.VISIBLE);
            views.setTextViewText(R.id.widget_4x2_label_left, "CLEAN SHEET");
            views.setTextColor(R.id.widget_4x2_label_left, 0xFFD84315);
        } else {
            views.setViewVisibility(R.id.widget_4x2_count, View.VISIBLE);
            views.setViewVisibility(R.id.widget_4x2_check, View.GONE);
            String countText = noHabits
                ? "--"
                : String.format(Locale.US, "%02d", data.pending);
            views.setTextViewText(R.id.widget_4x2_count, countText);
            views.setTextViewText(R.id.widget_4x2_label_left,
                noHabits ? "SEM HÁBITOS" : "REMANESCENTES");
            views.setTextColor(R.id.widget_4x2_label_left, 0xEBF5F5F5);
        }

        // ── Lado direito ─────────────────────────────────────────────────────
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

        // BUG-008: tratar os três estados distintos no lado direito
        if (gameOver) {
            for (int rowId : rowIds) views.setViewVisibility(rowId, View.GONE);
            views.setViewVisibility(R.id.widget_4x2_gameover_text, View.VISIBLE);
            views.setTextViewText(R.id.widget_4x2_gameover_text, "Nada na fila.\nDia vencido.");
        } else if (noHabits) {
            for (int rowId : rowIds) views.setViewVisibility(rowId, View.GONE);
            views.setViewVisibility(R.id.widget_4x2_gameover_text, View.VISIBLE);
            views.setTextViewText(R.id.widget_4x2_gameover_text, "Nenhum hábito\nconfigurado.");
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

package com.lockedin.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.util.Log;
import android.view.View;
import android.widget.RemoteViews;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/**
 * 2×2 "Shot Clock" widget — mostra hábitos pendentes ou GAME OVER.
 * Lê diretamente do SQLite criado pelo Capacitor.
 */
public class LockedInWidget extends AppWidgetProvider {

    static final String TAG = "LockedInWidget";
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

        // BUG-006: usar widgetId como requestCode para unicidade por instância
        Intent launchIntent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context, widgetId, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

        WidgetData data = queryWidgetData(context);
        applyShotClock(context, views, data);

        manager.updateAppWidget(widgetId, views);
    }

    static void applyShotClock(Context context, RemoteViews views, WidgetData data) {
        boolean gameOver = data.total > 0 && data.pending == 0;
        int progress = data.total > 0
            ? (int) ((data.total - data.pending) * 100f / data.total)
            : 0;

        // BUG-001: checkmark criado via Canvas (Bitmap) em vez de VectorDrawable
        Bitmap checkBmp = createCheckBitmap(context, 60);
        views.setImageViewBitmap(R.id.widget_check, checkBmp);

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

    // BUG-001: desenha o checkmark em um Bitmap — funciona em todas as versões de API
    static Bitmap createCheckBitmap(Context context, int sizeDp) {
        float density = context.getResources().getDisplayMetrics().density;
        int sizePx = Math.max(1, Math.round(sizeDp * density));
        Bitmap bmp = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bmp);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setColor(0xFFD84315);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(sizePx * 0.09f);
        paint.setStrokeCap(Paint.Cap.ROUND);
        paint.setStrokeJoin(Paint.Join.ROUND);
        // Pontos do design: M 20,54 L 42,76 L 82,26 no viewport 100×100
        float s = sizePx / 100f;
        Path path = new Path();
        path.moveTo(20 * s, 54 * s);
        path.lineTo(42 * s, 76 * s);
        path.lineTo(82 * s, 26 * s);
        canvas.drawPath(path, paint);
        return bmp;
    }

    static WidgetData queryWidgetData(Context context) {
        WidgetData data = new WidgetData();

        File dbFile = resolveDbFile(context);
        if (dbFile == null) {
            Log.w(TAG, "queryWidgetData: banco não encontrado em " +
                context.getDatabasePath("x").getParent());
            return data;
        }

        Log.d(TAG, "queryWidgetData: abrindo " + dbFile.getPath());
        SQLiteDatabase db = null;
        try {
            db = SQLiteDatabase.openDatabase(dbFile.getPath(), null, SQLiteDatabase.OPEN_READONLY);
            String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());

            // Dia da semana atual: Calendar retorna 1=Dom..7=Sab → convertemos para 0=Dom..6=Sab
            int dow = Calendar.getInstance().get(Calendar.DAY_OF_WEEK) - 1;

            // IDs completados hoje
            Set<String> completedIds = new HashSet<>();
            try (Cursor c = db.rawQuery(
                    "SELECT habit_id FROM completions WHERE completed_at = ?",
                    new String[]{today})) {
                while (c.moveToNext()) completedIds.add(c.getString(0));
            }

            // Hábitos ativos com dados de frequência — filtra por dia em Java
            int pendingIdx = 0;
            try (Cursor c = db.rawQuery(
                    "SELECT id, name, frequency_type, frequency_days" +
                    " FROM habits WHERE archived_at IS NULL", null)) {
                while (c.moveToNext()) {
                    String id       = c.getString(0);
                    String name     = c.getString(1);
                    String freqType = c.isNull(2) ? null : c.getString(2);
                    String freqDays = c.isNull(3) ? null : c.getString(3);

                    if (!isScheduledForDow(freqType, freqDays, dow)) continue;

                    data.total++;
                    if (completedIds.contains(id)) {
                        data.completed++;
                    } else if (pendingIdx < 3) {
                        data.pendingNames[pendingIdx++] = name;
                    }
                }
            }

            data.pending = Math.max(data.total - data.completed, 0);
            Log.d(TAG, "dow=" + dow + " total=" + data.total + " completed=" + data.completed +
                " pending=" + data.pending);

        } catch (Exception e) {
            // BUG-003: logar exceções em vez de engolir silenciosamente
            Log.e(TAG, "queryWidgetData falhou", e);
        } finally {
            if (db != null) db.close();
        }
        return data;
    }

    static boolean isScheduledForDow(String freqType, String freqDaysJson, int dow) {
        if (freqType == null) return true;
        switch (freqType) {
            case "daily":      return true;
            case "x_per_week": return true;
            case "weekdays":   return dow >= 1 && dow <= 5;
            case "weekends":   return dow == 0 || dow == 6;
            case "custom": {
                if (freqDaysJson == null) return false;
                String token = String.valueOf(dow);
                String clean = freqDaysJson.replaceAll("\\s", "");
                return clean.equals("[" + token + "]")
                    || clean.startsWith("[" + token + ",")
                    || clean.endsWith("," + token + "]")
                    || clean.contains("," + token + ",");
            }
            default: return true;
        }
    }

    // BUG-004: tenta múltiplos caminhos e faz scan do diretório de bancos
    static File resolveDbFile(Context context) {
        String[] candidates = {
            "lockedinSQLite.db",
            "lockedinSQLite",
            "lockedin.db",
            "lockedin"
        };
        for (String name : candidates) {
            File f = context.getDatabasePath(name);
            if (f.exists()) return f;
        }
        // Scan do diretório: encontra qualquer arquivo que contenha "lockedin"
        File dbDir = context.getDatabasePath("x").getParentFile();
        if (dbDir != null && dbDir.isDirectory()) {
            File[] files = dbDir.listFiles();
            if (files != null) {
                for (File f : files) {
                    String name = f.getName().toLowerCase(Locale.US);
                    if (name.contains("lockedin") && name.endsWith(".db")) {
                        Log.d(TAG, "resolveDbFile: encontrado via scan → " + f.getName());
                        return f;
                    }
                }
            }
        }
        return null;
    }

    static class WidgetData {
        int total = 0;
        int completed = 0;
        int pending = 0;
        String[] pendingNames = new String[3];
    }
}

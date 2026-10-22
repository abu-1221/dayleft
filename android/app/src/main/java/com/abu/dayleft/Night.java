package com.abu.dayleft;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

/** 9:30 PM daily summary, built on the phone from local data. */
public class Night extends BroadcastReceiver {
    static final int HOUR = 21, MIN = 30;

    static PendingIntent pi(Context c) {
        Intent i = new Intent(c, Night.class);
        return PendingIntent.getBroadcast(c, 7, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static void schedule(Context c) {
        Calendar t = Calendar.getInstance();
        t.set(Calendar.HOUR_OF_DAY, HOUR);
        t.set(Calendar.MINUTE, MIN);
        t.set(Calendar.SECOND, 0);
        t.set(Calendar.MILLISECOND, 0);
        if (t.getTimeInMillis() <= System.currentTimeMillis()) t.add(Calendar.DAY_OF_YEAR, 1);
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        // Inexact (no special permission); Android may shift it by a few minutes.
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, t.getTimeInMillis(), pi(c));
    }

    static String money(long n) {
        return "\u20b9" + java.text.NumberFormat.getInstance(new Locale("en", "IN")).format(Math.abs(n));
    }

    static long pendingToday(Context c, String today) {
        long s = 0;
        try {
            JSONArray arr = new JSONArray(DayLeftPlugin.prefs(c).getString("pending", "[]"));
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.getJSONObject(i);
                if (today.equals(o.optString("d"))) s += o.optLong("a");
            }
        } catch (Exception ignored) {
        }
        return s;
    }

    static String tomorrowBills(Context c) {
        try {
            Calendar t = Calendar.getInstance();
            t.add(Calendar.DAY_OF_YEAR, 1);
            int dom = t.get(Calendar.DAY_OF_MONTH), last = t.getActualMaximum(Calendar.DAY_OF_MONTH);
            JSONArray arr = new JSONArray(DayLeftPlugin.prefs(c).getString("bills", "[]"));
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.getJSONObject(i);
                int d = Math.min(o.optInt("d"), last);
                if (d == dom) sb.append(sb.length() == 0 ? " Due tomorrow: " : ", ").append(o.optString("n")).append(" ").append(money(o.optLong("a")));
            }
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }

    @Override
    public void onReceive(Context c, Intent in) {
        String act = in == null ? null : in.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(act) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(act)) { schedule(c); return; }
        android.content.SharedPreferences p = DayLeftPlugin.prefs(c);
        long daily = p.getInt("daily", 0);
        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        long spent = today.equals(p.getString("date", "")) ? p.getInt("spent", 0) : 0;
        spent += pendingToday(c, today);
        schedule(c);
        if (daily <= 0) return;
        long left = daily - spent;
        String title = left >= 0 ? "Left today: " + money(left) : "Over budget by " + money(left);
        String bills = tomorrowBills(c);
        String body = "Spent " + money(spent) + " of " + money(daily) + ". Open DayLeft to add the rest." + bills;
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26) nm.createNotificationChannel(new NotificationChannel("night", "Night summary", NotificationManager.IMPORTANCE_DEFAULT));
        PendingIntent open = PendingIntent.getActivity(c, 8, new Intent(c, MainActivity.class), PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        nm.notify(930, new NotificationCompat.Builder(c, "night").setSmallIcon(android.R.drawable.ic_menu_agenda)
            .setContentTitle(title).setContentText(body).setContentIntent(open).setAutoCancel(true).build());
    }
}

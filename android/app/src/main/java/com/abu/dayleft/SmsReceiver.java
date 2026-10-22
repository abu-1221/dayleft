package com.abu.dayleft;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.provider.Telephony;
import android.telephony.SmsMessage;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

public class SmsReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent i) {
        if (!Telephony.Sms.Intents.SMS_RECEIVED_ACTION.equals(i.getAction())) return;
        SmsMessage[] ms = Telephony.Sms.Intents.getMessagesFromIntent(i);
        if (ms == null) return;
        StringBuilder sb = new StringBuilder();
        for (SmsMessage m : ms) sb.append(m.getMessageBody());
        String[] r = SmsParse.parse(sb.toString());
        if (r == null) return;
        try {
            android.content.SharedPreferences p = DayLeftPlugin.prefs(c);
            JSONArray arr = new JSONArray(p.getString("pending", "[]"));
            JSONObject o = new JSONObject();
            Date now = new Date();
            o.put("a", Long.parseLong(r[0]));
            o.put("n", r[1].isEmpty() ? "UPI debit" : r[1]);
            o.put("d", new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(now));
            o.put("t", new SimpleDateFormat("HH:mm", Locale.US).format(now));
            arr.put(o);
            p.edit().putString("pending", arr.toString()).apply();
        } catch (Exception ignored) {
        }
    }
}

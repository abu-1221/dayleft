package com.abu.dayleft;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "DayLeft", permissions = {
    @Permission(alias = "sms", strings = {Manifest.permission.RECEIVE_SMS}),
    @Permission(alias = "notifications", strings = {"android.permission.POST_NOTIFICATIONS"})
})
public class DayLeftPlugin extends Plugin {
    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences("dayleft", Context.MODE_PRIVATE);
    }

    @PluginMethod
    public void setSummary(PluginCall call) {
        prefs(getContext()).edit()
            .putInt("daily", call.getInt("daily", 0))
            .putInt("spent", call.getInt("spent", 0))
            .putString("date", call.getString("date", ""))
            .apply();
        Night.schedule(getContext());
        call.resolve();
    }

    @PluginMethod
    public void getPending(PluginCall call) {
        SharedPreferences p = prefs(getContext());
        JSObject out = new JSObject();
        try {
            JSONArray arr = new JSONArray(p.getString("pending", "[]"));
            out.put("items", new JSArray(arr.toString()));
        } catch (Exception e) {
            out.put("items", new JSArray());
        }
        p.edit().putString("pending", "[]").apply();
        call.resolve(out);
    }

    private String state(String alias) {
        if (Build.VERSION.SDK_INT < 33 && alias.equals("notifications")) return "granted";
        return getPermissionState(alias).toString().toLowerCase();
    }

    @PluginMethod
    public void checkPerms(PluginCall call) {
        JSObject o = new JSObject();
        o.put("sms", state("sms"));
        o.put("notifications", state("notifications"));
        call.resolve(o);
    }

    @PluginMethod
    public void requestPerms(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33) {
            requestPermissionForAliases(new String[]{"sms", "notifications"}, call, "permsDone");
        } else {
            requestPermissionForAlias("sms", call, "permsDone");
        }
    }

    @com.getcapacitor.annotation.PermissionCallback
    private void permsDone(PluginCall call) {
        checkPerms(call);
    }
}

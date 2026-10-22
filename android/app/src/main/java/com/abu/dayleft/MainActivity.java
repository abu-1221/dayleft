package com.abu.dayleft;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DayLeftPlugin.class);
        super.onCreate(savedInstanceState);
        Night.schedule(this);
        capture(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        capture(intent);
    }

    /** Text shared from the Messages app (Share > DayLeft). Stored on the phone until the app reads it. */
    private void capture(Intent i) {
        if (i != null && Intent.ACTION_SEND.equals(i.getAction()) && "text/plain".equals(i.getType())) {
            String t = i.getStringExtra(Intent.EXTRA_TEXT);
            if (t != null) DayLeftPlugin.prefs(this).edit().putString("shared", t.length() > 600 ? t.substring(0, 600) : t).apply();
        }
    }
}

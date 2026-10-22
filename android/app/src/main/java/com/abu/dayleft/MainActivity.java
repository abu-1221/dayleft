package com.abu.dayleft;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DayLeftPlugin.class);
        super.onCreate(savedInstanceState);
        Night.schedule(this);
    }
}

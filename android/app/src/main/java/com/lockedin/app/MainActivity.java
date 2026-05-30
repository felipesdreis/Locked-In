package com.lockedin.app;

import android.content.Intent;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onResume() {
        super.onResume();
        // Notify the widget to refresh its data when the app comes to foreground
        Intent intent = new Intent(LockedInWidget.ACTION_UPDATE);
        intent.setPackage(getPackageName());
        sendBroadcast(intent);
    }
}


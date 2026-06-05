package br.fdrapps.lockedin;

import android.content.Intent;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // registerPlugin deve ser chamado antes de super.onCreate
        registerPlugin(WidgetPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onResume() {
        super.onResume();
        // Atualiza widgets ao retornar ao app (tela de recentes, desbloqueio, etc.)
        sendWidgetUpdate();
    }

    private void sendWidgetUpdate() {
        Intent intent = new Intent(LockedInWidget.ACTION_UPDATE);
        intent.setPackage(getPackageName());
        sendBroadcast(intent);
    }
}

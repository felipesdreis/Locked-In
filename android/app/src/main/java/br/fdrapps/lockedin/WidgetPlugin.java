package br.fdrapps.lockedin;

import android.content.Intent;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Plugin mínimo que expõe requestUpdate() ao lado JS.
 * Envia o broadcast ACTION_UPDATE já declarado no AndroidManifest —
 * ambos os widgets (2×2 e 4×2) escutam essa action e se redesenham.
 */
@CapacitorPlugin(name = "WidgetPlugin")
public class WidgetPlugin extends Plugin {

    @PluginMethod
    public void requestUpdate(PluginCall call) {
        Intent intent = new Intent(LockedInWidget.ACTION_UPDATE);
        intent.setPackage(getActivity().getPackageName());
        getActivity().sendBroadcast(intent);
        call.resolve();
    }
}

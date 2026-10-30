package org.viraasat.heritage.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

/** A browser-backed launcher: authentication, payments and permissions stay in
 * the user's browser. It does not claim to implement native/offline commerce. */
public final class MainActivity extends Activity {
    private static final String WEBSITE = "https://virrasat.in/";
    private static final int TERRACOTTA = Color.rgb(140, 43, 43);

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(Color.rgb(250, 247, 242));
        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setGravity(Gravity.CENTER);
        content.setPadding(dp(28), dp(64), dp(28), dp(48));
        scroll.addView(content);

        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.viraasat_logo);
        logo.setContentDescription("Viraasat logo");
        content.addView(logo, new LinearLayout.LayoutParams(dp(160), dp(160)));
        TextView title = text("Viraasat", 34, Color.rgb(94, 44, 24));
        title.setTypeface(android.graphics.Typeface.SERIF);
        content.addView(title);
        content.addView(text("Browse Indian crafts and access your account and artisan studio.", 17, Color.rgb(101, 91, 83)));
        content.addView(text("Opens virrasat.in in your browser. Internet access is required.", 14, Color.rgb(101, 91, 83)));
        Button open = new Button(this);
        open.setText("Open Viraasat");
        open.setTextColor(Color.WHITE);
        open.setBackgroundTintList(android.content.res.ColorStateList.valueOf(TERRACOTTA));
        open.setMinHeight(dp(48));
        open.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View view) { openWebsite(); }
        });
        content.addView(open, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));
        setContentView(scroll);
        if (savedInstanceState == null) openWebsite();
    }

    private TextView text(String value, int size, int color) {
        TextView text = new TextView(this);
        text.setText(value); text.setTextSize(size); text.setTextColor(color);
        text.setGravity(Gravity.CENTER); text.setPadding(0, dp(12), 0, dp(12));
        return text;
    }
    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }

    private void openWebsite() {
        Intent browser = new Intent(Intent.ACTION_VIEW, Uri.parse(WEBSITE));
        browser.addCategory(Intent.CATEGORY_BROWSABLE);
        // Browsers supporting Custom Tabs use a browser-owned app window. Other
        // HTTPS handlers can open the URL normally. No embedded WebView login.
        Bundle extras = new Bundle();
        extras.putBinder("android.support.customtabs.extra.SESSION", null);
        extras.putInt("android.support.customtabs.extra.TOOLBAR_COLOR", TERRACOTTA);
        browser.putExtras(extras);
        try { startActivity(browser); }
        catch (ActivityNotFoundException | SecurityException error) {
            new AlertDialog.Builder(this).setTitle("A browser is required")
                .setMessage("Install or enable a web browser, then tap Open Viraasat again.")
                .setPositiveButton("OK", null).show();
        }
    }
}

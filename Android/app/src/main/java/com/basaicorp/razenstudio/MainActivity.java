package com.basaicorp.razenstudio;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {

    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Initialize WebView
        webView = new WebView(this);
        setContentView(webView);

        // Configure WebView settings
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);               // JS support
        webSettings.setDomStorageEnabled(true);               // Enables localStorage/sessionStorage
        webSettings.setAllowFileAccess(true);                 // Access to local file:// (for assets)
        webSettings.setAllowContentAccess(true);              // Allow access to content:// URIs
        webSettings.setDatabaseEnabled(true);                 // For Web SQL/IndexedDB if used
        webSettings.setLoadWithOverviewMode(true);            // Loads content to fit the view
        webSettings.setUseWideViewPort(true);                 // Enables responsive layout
        webSettings.setSupportZoom(true);                     // Enable zoom
        webSettings.setBuiltInZoomControls(true);             // Show zoom buttons
        webSettings.setDisplayZoomControls(false);            // Hide native zoom UI
        webSettings.setJavaScriptCanOpenWindowsAutomatically(true); // Support window.open()

        // WebViewClient: to handle internal loading
        webView.setWebViewClient(new WebViewClient());

        // WebChromeClient: for alerts, confirm, console logs, file chooser, etc.
        webView.setWebChromeClient(new WebChromeClient());

        // Load local HTML file from assets
        webView.loadUrl("file:///android_asset/index.html");
    }

    // Handle back button navigation
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    } // Should print: 1.0.3-beta.1
}
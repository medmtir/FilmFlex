package tv.filmflex.app;

import android.app.Activity;
import android.content.Context;
import android.content.pm.ActivityInfo;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Message;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.Toast;

public class MainActivity extends Activity {
    private static final String APP_URL = "https://filmflex-seven.vercel.app";

    private WebView mWebView;
    private FrameLayout mCustomViewContainer;
    private RelativeLayout mSplashContainer;
    private LinearLayout mOfflineContainer;
    private Button mBtnRetry;

    private WebChromeClient.CustomViewCallback mCustomViewCallback;
    private View mCustomView;
    private long backPressedTime = 0;
    private Toast backToast;
    private boolean isPageLoaded = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Native Fullscreen & Display Cutout handling
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Enable automatic sensor rotation based on device orientation (like Netflix)
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            getWindow().getAttributes().layoutInDisplayCutoutMode = 
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }

        setContentView(R.layout.activity_main);

        mWebView = findViewById(R.id.webview);
        mCustomViewContainer = findViewById(R.id.customViewContainer);
        mSplashContainer = findViewById(R.id.splashContainer);
        mOfflineContainer = findViewById(R.id.offlineContainer);
        mBtnRetry = findViewById(R.id.btnRetry);

        setupWebView();

        mBtnRetry.setOnClickListener(v -> {
            mOfflineContainer.setVisibility(View.GONE);
            mSplashContainer.setVisibility(View.VISIBLE);
            mSplashContainer.setAlpha(1.0f);
            mWebView.loadUrl(APP_URL);
        });

        loadApp();
    }

    private void setupWebView() {
        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setUserAgentString(settings.getUserAgentString() + " FilmFlexNativeApp/1.0");

        // Strict ad & popup prevention
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);

        // Supabase & Session cookies persistence
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(mWebView, true);

        // Native app feel: disable scrollbars & text selection
        mWebView.setVerticalScrollBarEnabled(false);
        mWebView.setHorizontalScrollBarEnabled(false);
        mWebView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        mWebView.setOnLongClickListener(v -> true);

        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleUrlNavigation(view, url);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (request != null && request.getUrl() != null) {
                    return handleUrlNavigation(view, request.getUrl().toString());
                }
                return false;
            }

            private boolean handleUrlNavigation(WebView view, String url) {
                if (url == null) return true;

                // Always allow FilmFlex domain, Supabase auth, and authorized streaming engines
                if (url.startsWith("https://filmflex-seven.vercel.app") ||
                    url.startsWith("http://localhost") ||
                    url.contains("supabase.co") ||
                    url.contains("vidlink.pro") ||
                    url.contains("vidsrc") ||
                    url.contains("embed")) {
                    return false; // Load normally inside webview
                }

                // Block any external advertising, betting, or redirect URLs
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                isPageLoaded = true;
                // Smooth Netflix-style fade out transition
                if (mSplashContainer != null && mSplashContainer.getVisibility() == View.VISIBLE) {
                    mSplashContainer.animate()
                            .alpha(0f)
                            .setDuration(400)
                            .withEndAction(() -> mSplashContainer.setVisibility(View.GONE));
                }
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request != null && request.isForMainFrame()) {
                    mSplashContainer.setVisibility(View.GONE);
                    mOfflineContainer.setVisibility(View.VISIBLE);
                }
            }
        });

        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                // Deny all popup ad windows completely
                return false;
            }

            @Override
            public void onShowCustomView(View view, CustomViewCallback callback) {
                if (mCustomView != null) {
                    callback.onCustomViewHidden();
                    return;
                }
                mCustomView = view;
                mCustomViewCallback = callback;
                mWebView.setVisibility(View.GONE);
                mCustomViewContainer.setVisibility(View.VISIBLE);
                mCustomViewContainer.addView(view, new FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
                setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
            }

            @Override
            public void onHideCustomView() {
                if (mCustomView == null) return;
                mWebView.setVisibility(View.VISIBLE);
                mCustomViewContainer.setVisibility(View.GONE);
                mCustomViewContainer.removeView(mCustomView);
                if (mCustomViewCallback != null) mCustomViewCallback.onCustomViewHidden();
                mCustomView = null;
                mCustomViewCallback = null;
                setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR);
            }
        });
    }

    private void loadApp() {
        if (!isNetworkAvailable()) {
            mSplashContainer.setVisibility(View.GONE);
            mOfflineContainer.setVisibility(View.VISIBLE);
            return;
        }
        mWebView.loadUrl(APP_URL);
    }

    private boolean isNetworkAvailable() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm != null) {
            NetworkInfo activeNetwork = cm.getActiveNetworkInfo();
            return activeNetwork != null && activeNetwork.isConnectedOrConnecting();
        }
        return false;
    }

    @Override
    public void onBackPressed() {
        if (mCustomView != null) {
            onCustomViewHidden();
            return;
        }
        if (mWebView.canGoBack()) {
            mWebView.goBack();
        } else {
            if (backPressedTime + 2000 > System.currentTimeMillis()) {
                if (backToast != null) backToast.cancel();
                super.onBackPressed();
            } else {
                backToast = Toast.makeText(this, "Appuyez à nouveau pour quitter FilmFlex", Toast.LENGTH_SHORT);
                backToast.show();
                backPressedTime = System.currentTimeMillis();
            }
        }
    }

    private void onCustomViewHidden() {
        if (mCustomView == null) return;
        mWebView.setVisibility(View.VISIBLE);
        mCustomViewContainer.setVisibility(View.GONE);
        mCustomViewContainer.removeView(mCustomView);
        if (mCustomViewCallback != null) mCustomViewCallback.onCustomViewHidden();
        mCustomView = null;
        mCustomViewCallback = null;
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR);
    }
}

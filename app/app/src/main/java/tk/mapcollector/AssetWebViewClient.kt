package tk.mapcollector

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.webkit.WebViewAssetLoader
import org.apache.commons.io.FilenameUtils

@SuppressLint("SetJavaScriptEnabled")
class AssetWebViewClient(private val _context: Context, private val _webView: WebView): WebViewClient(){
    init {
        //Enable basic stuff
        this._webView.settings.javaScriptEnabled = true
        this._webView.settings.domStorageEnabled = true

        //Make debugging Javascript code easier
        WebView.setWebContentsDebuggingEnabled(true)
    }

    //Set up the asset loader
    public override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this._context))
            .build()
        val url = request.url.toString()
        val isLibrary = url.startsWith("https://gustavlindberg99.github.io/") || url.startsWith("https://unpkg.com/") || url.startsWith("https://cdn.jsdelivr.net/")
        val response = assetLoader.shouldInterceptRequest(
            if(isLibrary) Uri.parse("https://appassets.androidplatform.net/assets/libs/" + FilenameUtils.getName(url))
            else if(url.endsWith("/toolbar-button.js")) Uri.parse(url.replace(Regex("\\.js$"), "-app.js"))
            else request.url
        )
        val responseHeaders = response?.responseHeaders ?: mutableMapOf<String, String>()
        responseHeaders["Access-Control-Allow-Origin"] = "https://appassets.androidplatform.net"
        if(isLibrary){
            response?.mimeType = if(url.endsWith(".css")) "text/css" else "text/javascript"
        }
        response?.responseHeaders = responseHeaders
        return response
    }

    //Open links in external browser
    public override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
        this._context.startActivity(Intent(Intent.ACTION_VIEW, request.url))
        return true
    }
}
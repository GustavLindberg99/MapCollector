package tk.mapcollector

import android.app.AlertDialog
import android.content.Context
import android.content.DialogInterface
import android.content.Intent
import android.content.res.Resources
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.drawable.BitmapDrawable
import android.os.Bundle
import android.text.Html
import android.text.method.LinkMovementMethod
import android.util.Base64
import android.util.TypedValue
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.TextView
import androidx.activity.result.ActivityResultLauncher
import androidx.appcompat.app.AppCompatActivity
import androidx.core.text.HtmlCompat

class DialogActivity : AppCompatActivity(){
    companion object{
        private const val TITLE = "title"
        private const val BODY = "body"
        private const val DEPENDENCIES = "dependencies"
        public const val DATA = "data"

        private var _alertDialog: AlertDialog? = null

        /**
         * Opens an activity dialog box.
         *
         * @param context           The parent context.
         * @param dialogLauncher    The launcher that contains the lambda that should be executed when the dialog closes.
         * @param title             The title of the dialog.
         * @param body              The body of the dialog.
         * @param dependencies      HTML code containing <script> and <link rel="stylesheet"> tags to be used in the activity dialog. Does nothing for an AlertDialog.
         */
        fun openActivityDialog(context: Context, dialogLauncher: ActivityResultLauncher<Intent>, title: String, body: String, dependencies: String?){
            val intent = Intent(context, DialogActivity::class.java)
            intent.putExtra(TITLE, title)
            intent.putExtra(BODY, body)
            intent.putExtra(DEPENDENCIES, dependencies)
            dialogLauncher.launch(intent)
        }

        /**
         * Opens an alert dialog box.
         *
         * @param context       The parent context.
         * @param webView       The web view to send the Javascript result to. Null if the dialog wasn't opened from Javascript.
         * @param title         The title of the dialog.
         * @param body          The body of the dialog.
         * @param ok            The text to display as OK button, or null if there is no OK button.
         * @param cancel        The text to display as Cancel button, or null if there is no Cancel button.
         * @param delete        The text to display as Delete button, or null if there is no Delete button.
         * @param icon          Base 64 encoded image to use as icon, or null if no icon should be used.
         */
        fun openAlertDialog(context: Context, webView: WebView?, title: String, body: String, ok: String?, cancel: String?, delete: String?, icon: String?){
            val textView = TextView(context)
            textView.text = HtmlCompat.fromHtml(body, HtmlCompat.FROM_HTML_MODE_LEGACY)
            textView.setTextColor(Color.BLACK)
            textView.setLinkTextColor(Color.BLUE)
            textView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
            val value = TypedValue()
            if(context.theme.resolveAttribute(androidx.appcompat.R.attr.dialogPreferredPadding, value, true)){
                val padding = TypedValue.complexToDimensionPixelSize(value.data, context.resources.displayMetrics)
                textView.setPadding(padding, dpToPx(8.0), padding, 0)
            }
            textView.movementMethod = LinkMovementMethod.getInstance()

            val builder = AlertDialog.Builder(context, R.style.AlertDialogTheme)
                .setTitle(title)
                .setView(textView)

            if(icon != null){
                val decodedData = Base64.decode(icon, Base64.DEFAULT)
                val bitmap = BitmapFactory.decodeByteArray(decodedData, 0, decodedData.size)
                val drawable = BitmapDrawable(context.resources, bitmap)
                builder.setIcon(drawable)
            }

            if(ok != null){
                builder.setPositiveButton(ok, {_: DialogInterface?, _: Int ->
                    webView?.evaluateJavascript("xdialog.onok?.()", null)
                })
            }
            if(cancel != null){
                builder.setNeutralButton(cancel, {_: DialogInterface?, _: Int ->
                    webView?.evaluateJavascript("xdialog.oncancel?.()", null)
                })
            }
            if(delete != null){
                builder.setNegativeButton(delete, {_: DialogInterface?, _: Int ->
                    webView?.evaluateJavascript("xdialog.ondelete?.()", null)
                })
            }
            this._alertDialog = builder.show()
        }

        /**
         * Closes the dialog box if any is open, otherwise does nothing.
         *
         * @param webView   The web view to send the Javascript result to.
         */
        public fun closeDialog(webView: WebView){
            this._alertDialog?.cancel()
            this._alertDialog = null
            webView.evaluateJavascript("xdialog.oncancel?.()", null)
        }
    }

    protected override fun onCreate(savedInstanceState: Bundle?){
        super.onCreate(savedInstanceState)
        this.setContentView(R.layout.activity_dialog)

        val title = this.intent.getStringExtra(TITLE)!!
        val body = this.intent.getStringExtra(BODY)!!
        val dependencies = this.intent.getStringExtra(DEPENDENCIES) ?: ""

        this.title = Html.fromHtml(
            String.format("<font color='0x000000'>%s</font>", title),
            HtmlCompat.FROM_HTML_MODE_LEGACY
        )

        val htmlCode = "<!DOCTYPE html><html><head><meta charset=\"utf-8\"/><meta name=\"viewport\" content=\"width=device-width\"/>$dependencies</head><body><section role=\"application\">$body</section></body></html>"

        val webView: WebView = this.findViewById(R.id.dialogWebView)
        webView.setWebViewClient(AssetWebViewClient(this, webView))
        webView.loadDataWithBaseURL("https://appassets.androidplatform.net/assets/index-app.html", htmlCode, "text/html", "utf-8", "")
        webView.addJavascriptInterface(object{
            @JavascriptInterface
            public fun close(data: String?){
                val intent = Intent()
                intent.putExtra(DATA, data)
                this@DialogActivity.setResult(RESULT_OK, intent)
                this@DialogActivity.finish()
            }

            @JavascriptInterface
            public fun email(): String? {
                val preferences = Preferences(this@DialogActivity)
                return preferences.email()
            }

            @JavascriptInterface
            public fun hashedPassword(): String? {
                val preferences = Preferences(this@DialogActivity)
                return preferences.hashedPassword()
            }
        }, "Android")
    }
}

/**
 * Converts a value in dp to a value in pixels.
 *
 * @param dp    The value in dp.
 *
 * @return The value in pixels.
 */
private fun dpToPx(dp: Double): Int {
    return (dp * Resources.getSystem().displayMetrics.density + 0.5).toInt()
}
package tk.mapcollector

import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.ImageButton
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import org.apache.commons.text.StringEscapeUtils
import java.util.Locale

@SuppressWarnings("unused")    //Otherwise it will warn about methods that are used in Javascript but not in Kotlin
class WebAppInterface(private val _activity: MainActivity, private val _webView: WebView){
    private val _dialogLauncher = this._activity.registerForActivityResult(ActivityResultContracts.StartActivityForResult(), {
        val data = it.data?.getStringExtra(DialogActivity.DATA)
        if(data == null){
            this._webView.evaluateJavascript("xdialog.oncancel?.()", null)
        }
        else {
            val dataAsString = "\"" + StringEscapeUtils.escapeJson(data) + "\""
            this._webView.evaluateJavascript("xdialog.onactivityresult?.($dataAsString)", null)
        }
    })

    /**
     * Gets the language that the app should be displayed in.
     *
     * @return The two-letter code of the language.
     */
    @JavascriptInterface
    public fun lang(): String {
        val language = Locale.getDefault().language.substring(0, 2)
        if(language in arrayOf("en", "fr", "sv")){
            return language
        }
        return "en"
    }

    /**
     * Shows a native Android toast message.
     *
     * @param text  The text to display.
     */
    @JavascriptInterface
    public fun showToast(text: String){
        Toast.makeText(this._activity, text, Toast.LENGTH_LONG).show()
    }

    /**
     * Opens a dialog box. If ok, cancel and delete are all null, shows it as an activity, otherwise shows it as an AlertDialog.
     *
     * @param title         The title of the dialog.
     * @param body          The body of the dialog.
     * @param ok            The text to display as OK button, or null if there is no OK button.
     * @param cancel        The text to display as Cancel button, or null if there is no Cancel button.
     * @param delete        The text to display as Delete button, or null if there is no Delete button.
     * @param dependencies  HTML code containing <script> and <link rel="stylesheet"> tags to be used in the activity dialog. Does nothing for an AlertDialog.
     * @param icon          Base 64 encoded image to use as icon, or null if no icon should be used. Does nothing for an AlertDialog.
     */
    @JavascriptInterface
    public fun openDialog(title: String, body: String, ok: String?, cancel: String?, delete: String?, dependencies: String?, icon: String?){
        this._activity.runOnUiThread {
            if(ok == null && cancel == null && delete == null){
                DialogActivity.openActivityDialog(this._activity, this._dialogLauncher, title, body, dependencies)
            }
            else {
                DialogActivity.openAlertDialog(this._activity, this._webView, title, body, ok, cancel, delete, icon)
            }
        }
    }

    /**
     * Closes the dialog that's currently open.
     */
    @JavascriptInterface
    public fun closeDialog(){
        this._activity.runOnUiThread {
            DialogActivity.closeDialog(this._webView)
        }
    }

    /**
     * Gets whether or not a toolbar button is disabled.
     *
     * @param buttonId  The string ID of the button.
     *
     * @return True if it's disabled, false if it's enabled.
     */
    @JavascriptInterface
    public fun getToolbarButtonDisabled(buttonId: String): Boolean {
        return !this.toolbarButtonFromId(buttonId).isEnabled
    }

    /**
     * Enables or disables a toolbar button.
     *
     * @param buttonId  The string ID of the button.
     * @param disabled  True to disable the button, false to enable it.
     */
    @JavascriptInterface
    public fun setToolbarButtonDisabled(buttonId: String, disabled: Boolean){
        this._activity.runOnUiThread {
            val button = this.toolbarButtonFromId(buttonId)
            this._activity.setToolbarButtonDisabled(button, disabled)
        }
    }

    /**
     * Gets the user's email address.
     *
     * @return The user's email address, or null if not logged in.
     */
    @JavascriptInterface
    public fun email(): String? {
        val preferences = Preferences(this._activity)
        return preferences.email()
    }

    /**
     * Gets the user's hashed password.
     *
     * @return The user's hashed password, or null if not logged in.
     */
    @JavascriptInterface
    public fun hashedPassword(): String? {
        val preferences = Preferences(this._activity)
        return preferences.hashedPassword()
    }

    /**
     * Gets a toolbar button from a string ID, so that it's possible to name a button from Javascript.
     *
     * @param buttonId  The string ID of the button.
     *
     * @return The ImageButton object corresponding to the button.
     */
    private fun toolbarButtonFromId(buttonId: String): ImageButton = when(buttonId){
        "newGameButton" -> this._activity.findViewById(R.id.newGameButton)
        "pauseButton" -> this._activity.findViewById(R.id.pauseButton)
        "fastForwardButton" -> this._activity.findViewById(R.id.fastForwardButton)
        else -> throw IllegalArgumentException("Unknown button: $buttonId")
    }
}
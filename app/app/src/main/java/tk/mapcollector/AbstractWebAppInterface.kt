package tk.mapcollector

import android.content.Context
import android.webkit.JavascriptInterface
import android.widget.Toast
import java.util.Locale

/**
 * Javascript interface that is used both in the main activity and in dialog activities.
 */
abstract class AbstractWebAppInterface(private val _context: Context) {
    /**
     * Gets the language that the app should be displayed in.
     *
     * @return The two-letter code of the language.
     */
    @JavascriptInterface
    public fun lang(): String {
        val language = Locale.getDefault().language.substring(0, 2)
        if (language in arrayOf("en", "fr", "sv")) {
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
    public fun showToast(text: String) {
        Toast.makeText(this._context, text, Toast.LENGTH_LONG).show()
    }

    /**
     * Gets the user's email address.
     *
     * @return The user's email address, or null if not logged in.
     */
    @JavascriptInterface
    public fun email(): String? {
        val preferences = Preferences(this._context)
        return preferences.email()
    }

    /**
     * Gets the user's hashed password.
     *
     * @return The user's hashed password, or null if not logged in.
     */
    @JavascriptInterface
    public fun hashedPassword(): String? {
        val preferences = Preferences(this._context)
        return preferences.hashedPassword()
    }
}
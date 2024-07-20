package tk.mapcollector

import android.content.Context
import android.webkit.WebView
import android.widget.ImageButton
import java.net.CookieHandler
import java.net.CookieManager
import java.net.HttpCookie
import java.net.URI

class Preferences(private val _context: Context){
    private val _sharedPreferences = this._context.getSharedPreferences("preferences", Context.MODE_PRIVATE)

    public object Preference{
        const val EMAIL = "email"
        const val HASHED_PASSWORD = "password"
        const val USER_ID = "userId"
        const val PROFILE_PICTURE = "profilePicture"
    }

    /**
     * Saves to the preferences that the user is logged in. Does not update the web view, that needs to be done separately.
     *
     * @param email             The user's email address.
     * @param hashedPassword    The user's hashed password.
     * @param userId            The user's ID.
     * @param profilePicture    The user's profile picture.
     */
    public fun logIn(email: String, hashedPassword: String, userId: Int, profilePicture: ProfilePicture){
        this._sharedPreferences.edit()
            .putString(Preference.EMAIL, email)
            .putString(Preference.HASHED_PASSWORD, hashedPassword)
            .putInt(Preference.USER_ID, userId)
            .putProfilePicture(Preference.PROFILE_PICTURE, profilePicture)
            .apply()
    }

    /**
     * Saves to the preferences that the user is logged out. Does not update the web view, that needs to be done separately.
     */
    public fun logOut(){
        this._sharedPreferences.edit()
            .remove(Preference.EMAIL)
            .remove(Preference.HASHED_PASSWORD)
            .remove(Preference.USER_ID)
            .remove(Preference.PROFILE_PICTURE)
            .apply()
    }

    /**
     * Checks if the user is logged in.
     *
     * @return True if the user is logged in, false otherwise.
     */
    public fun isLoggedIn(): Boolean {
        return this._sharedPreferences.getInt(Preference.USER_ID, 0) != 0
    }

    /**
     * Loads the homepage with the GET parameters set so that the user is logged in, and sets the Volley cookies to the logged in cookies.
     *
     * @param activity  The main activity. Used for disabling the buttons.
     * @param webView   The web view to load the homepage in.
     */
    public fun loadLoggedInPage(activity: MainActivity, webView: WebView){
        val userId = this._sharedPreferences.getInt(Preference.USER_ID, 0)
        webView.loadUrl("https://appassets.androidplatform.net/assets/index-app.html?uid=$userId")

        //Disable the buttons
        val newGameButton: ImageButton = activity.findViewById(R.id.newGameButton)
        val pauseButton: ImageButton = activity.findViewById(R.id.pauseButton)
        val fastForwardButton: ImageButton = activity.findViewById(R.id.fastForwardButton)
        activity.setToolbarButtonDisabled(newGameButton, true)
        activity.setToolbarButtonDisabled(pauseButton, true)
        activity.setToolbarButtonDisabled(fastForwardButton, true)

        //Set Volley cookies (only works for requests made with Kotlin, not with Javascript)
        val cookieManager = CookieManager()
        val uri = URI("https://mapcollector.eu5.org/")
        val email = this.email()
        val hashedPassword = this.hashedPassword()
        if(email == null || hashedPassword == null){
            cookieManager.cookieStore.removeAll()
        }
        else{
            cookieManager.cookieStore.add(uri, HttpCookie("email", email))
            cookieManager.cookieStore.add(uri, HttpCookie("password", hashedPassword))
        }
        CookieHandler.setDefault(cookieManager)
    }

    /**
     * Gets the user's profile picture.
     *
     * @return The user's profile picture, or null if no user is logged in.
     */
    public fun getProfilePicture(): ProfilePicture? {
        return this._sharedPreferences.getProfilePicture(Preference.PROFILE_PICTURE, null)
    }

    /**
     * Sets the user's profile picture. Does nothing if no user is logged in.
     *
     * @param profilePicture    The profile picture to set.
     */
    public fun setProfilePicture(profilePicture: ProfilePicture){
        if(this.getProfilePicture() == null){
            return
        }
        this._sharedPreferences.edit()
            .putProfilePicture(Preference.PROFILE_PICTURE, profilePicture)
            .apply()
    }

    /**
     * Gets the user's email address.
     *
     * @return The user's email address, or null if not logged in.
     */
    public fun email(): String? = this._sharedPreferences.getString(Preference.EMAIL, null)

    /**
     * Gets the user's hashed password.
     *
     * @return The user's hashed password, or null if not logged in.
     */
    public fun hashedPassword(): String? = this._sharedPreferences.getString(Preference.HASHED_PASSWORD, null)
}
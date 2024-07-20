package tk.mapcollector

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.text.Html
import android.text.method.LinkMovementMethod
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.text.HtmlCompat
import com.android.volley.Request
import com.android.volley.RequestQueue
import com.android.volley.toolbox.StringRequest
import com.android.volley.toolbox.Volley
import org.json.JSONException
import org.json.JSONObject
import java.util.Locale
import java.util.regex.Pattern

class LogInActivity: AppCompatActivity() {
    private val _logInButton: Button by lazy {this.findViewById(R.id.logInButton)}
    private var _errorView: TextView? = null

    protected override fun onCreate(savedInstanceState: Bundle?){
        super.onCreate(savedInstanceState)
        this.setContentView(R.layout.activity_log_in)
        this.title = Html.fromHtml(
            String.format("<font color='0x000000'>%s</font>", this.getString(R.string.logIn)),
            HtmlCompat.FROM_HTML_MODE_LEGACY
        )

        val email = this.findViewById<EditText>(R.id.logInEmail)
        val password = this.findViewById<EditText>(R.id.logInPassword)

        _logInButton.setOnClickListener {
            this.logIn(email.text.toString(), password.text.toString())
        }

        val signUpLink: TextView = this.findViewById(R.id.signUpLink)
        signUpLink.text = Html.fromHtml(
            String.format(this.getString(R.string.signUp), "https://mapcollector.eu5.org/users/signup.php"),
            HtmlCompat.FROM_HTML_MODE_LEGACY
        )
        signUpLink.movementMethod = LinkMovementMethod.getInstance()
        signUpLink.setLinkTextColor(Color.BLUE)
    }

    /**
     * Sends a request to the server to log in with the given email and password.
     *
     * @param email     The email address to log in with.
     * @param password  The (unhashed) password to log in with.
     */
    private fun logIn(email: String, password: String){
        val emailRegex = Pattern.compile("^[a-z0-9._%+-]+@[a-z0-9._-]+\\.[a-z]{2,}$", Pattern.CASE_INSENSITIVE)
        if(!emailRegex.matcher(email).find()){
            this.showError(this.getString(R.string.invalidEmail))
            return
        }
        else if(password.isEmpty()){
            this.showError(this.getString(R.string.passwordMissing))
            return
        }

        _logInButton.isEnabled = false

        var language = Locale.getDefault().language.substring(0, 2)
        if(language !in arrayOf("en", "fr", "sv")){
            language = "en"
        }

        val queue: RequestQueue = Volley.newRequestQueue(this)
        val request = object: StringRequest(
            Request.Method.POST,
            "https://mapcollector.eu5.org/$language/ajax/applogin.php",
            {this.processResponse(it)},
            {this.showError(this.getString(R.string.noInternet))}
        ){
            override fun getParams() = mapOf("email" to email, "password" to password)
            override fun getHeaders() = mapOf("Content-Type" to "application/x-www-form-urlencoded")
        }
        queue.add(request)
    }

    /**
     * Processes a response to a log in request from the server, and logs in if possible.
     *
     * @param response  The response body that the server sent.
     */
    private fun processResponse(response: String){
        try{
            val data = JSONObject(response)
            if(data.getString("status") != "success") {
                this.showError(data.getString("message"))
                return
            }

            val email = data.getString("email")
            val hashedPassword = data.getString("password")
            val userId = data.getInt("userId")
            val profilePictureUrl = "https://mapcollector.eu5.org/users/profilepicture.php?uid=$userId"

            val queue: RequestQueue = Volley.newRequestQueue(this)
            val request = ProfilePicture.ProfilePictureRequest(profilePictureUrl, queue, {profilePicture: ProfilePicture ->
                Toast.makeText(this, R.string.loginSucceeded, Toast.LENGTH_SHORT).show()

                val intent = Intent()
                intent.putExtra(Preferences.Preference.EMAIL, email)
                intent.putExtra(Preferences.Preference.HASHED_PASSWORD, hashedPassword)
                intent.putExtra(Preferences.Preference.USER_ID, userId)
                intent.putExtra(Preferences.Preference.PROFILE_PICTURE, profilePicture)
                this.setResult(RESULT_OK, intent)

                this.finish()
            })
            queue.add(request)
        }
        catch(e: JSONException) {
            this.showError(String.format(this.getString(R.string.error), e.message))
        }
    }

    /**
     * Shows a message that an error occurred when logging in.
     *
     * @param errorMessage  The error message to display.
     */
    private fun showError(errorMessage: String){
        val errorView = this._errorView ?: TextView(this)
        if(this._errorView == null){
            errorView.setTextColor(Color.RED)
            errorView.movementMethod = LinkMovementMethod.getInstance()
            errorView.setLinkTextColor(Color.BLUE)
            findViewById<LinearLayout>(R.id.loginLayout).addView(errorView)
            this._errorView = errorView
        }
        errorView.text = Html.fromHtml(errorMessage, HtmlCompat.FROM_HTML_MODE_LEGACY)
        _logInButton.isEnabled = true
        findViewById<EditText>(R.id.logInPassword).setText(String())
    }
}
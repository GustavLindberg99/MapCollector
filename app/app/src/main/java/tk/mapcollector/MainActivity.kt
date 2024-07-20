package tk.mapcollector

import android.content.Intent
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.drawable.Drawable
import android.net.Uri
import android.os.Bundle
import android.webkit.WebView
import android.widget.ImageButton
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.android.volley.Request
import com.android.volley.RequestQueue
import com.android.volley.toolbox.JsonObjectRequest
import com.android.volley.toolbox.Volley
import java.util.Timer
import kotlin.concurrent.timer

class MainActivity : AppCompatActivity(){
    private val _webView: WebView by lazy {this.findViewById(R.id.webView)}
    private val _myAccountButton: ImageButton by lazy {this.findViewById(R.id.myAccountButton)}
    private val _buttonDrawables = mutableMapOf<ImageButton, Drawable>()

    private var _setPressedTimer: Timer? = null

    protected override fun onCreate(savedInstanceState: Bundle?){
        super.onCreate(savedInstanceState)
        this.setContentView(R.layout.activity_main)

        //Initialize the action bar
        val actionBar = this.supportActionBar!!
        actionBar.setCustomView(R.layout.action_bar)
        actionBar.setDisplayShowCustomEnabled(true)

        //Initialize the buttons (needs to come before initializing the web view because when the web view gets loaded the buttons will be disabled)
        val newGameButton: ImageButton = this.initializeToolbarButton(R.id.newGameButton)
        val pauseButton: ImageButton = this.initializeToolbarButton(R.id.pauseButton)
        val fastForwardButton: ImageButton = this.initializeToolbarButton(R.id.fastForwardButton)
        val helpButton: ImageButton = this.initializeToolbarButton(R.id.helpButton)
        val aboutButton: ImageButton = this.initializeToolbarButton(R.id.aboutButton)

        //Initialize the web view
        this._webView.setWebViewClient(AssetWebViewClient(this, this._webView))
        val preferences = Preferences(this)
        preferences.loadLoggedInPage(this, this._webView)

        //Create the interface to call Kotlin functions from Javascript
        val webAppInterface = WebAppInterface(this, this._webView)
        this._webView.addJavascriptInterface(webAppInterface, "Android")

        //Initialize the button callbacks
        newGameButton.setOnClickListener {
            this._webView.evaluateJavascript("window.ToolbarButton.NewGameButton.onclick?.()", null)
        }
        pauseButton.setOnClickListener {
            this.setPauseButtonPressed(this._setPressedTimer == null)
            this._webView.evaluateJavascript("window.ToolbarButton.PauseButton.onclick?.()", null)
        }
        fastForwardButton.setOnClickListener {
            this._webView.evaluateJavascript("window.ToolbarButton.FastForwardButton.onclick?.()", null)
        }
        helpButton.setOnClickListener {
            this.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://github.com/GustavLindberg99/MapCollector/blob/master/README.md")))
        }
        aboutButton.setOnClickListener {
            DialogActivity.openAlertDialog(
                this,
                this._webView,
                this.getString(R.string.about),
                String.format(
                    this.getString(R.string.aboutString),
                    BuildConfig.VERSION_NAME,
                    "https://mapcollector.eu5.org",
                    "<a href=\"https://www.iconfinder.com/\">www.iconfinder.com</a>",
                    "<a href=\"http://creativecommons.org/licenses/by/3.0/\">CC 3.0 BY</a>",
                    "<a href=\"https://www.iconfinder.com/paomedia\">Paomedia</a>, <a href=\"https://www.iconfinder.com/webalys\">Webalys</a>, <a href=\"https://www.iconfinder.com/Chanut-is\">Chanut is Industries</a>, <a href=\"https://www.iconfinder.com/iconfinder\">Iconfinder</a>, <a href=\"https://www.iconfinder.com/kmgdesignid\">Kmg Design</a>, <a href=\"https://www.iconfinder.com/iconsets/ionicons\">Ionicons</a>, <a href=\"https://www.iconfinder.com/Mr-hopnguyen\">Hopnguyen Mr</a>, <a href=\"https://www.iconfinder.com/webhostingmedia\">David Cross</a>, <a href=\"https://www.iconfinder.com/pocike\">Alpár-Etele Méder</a>, <a href=\"https://www.iconfinder.com/iconsets/circle-icons-1\">Nick Roach</a>, <a href=\"https://www.iconfinder.com/fluent-designsystem\">Microsoft</a>, <a href=\"https://www.iconfinder.com/webkul\">Webkul Software</a>, <a href=\"https://www.iconfinder.com/iconsets/ios-7-icons\">Visual Pharm</a>, <a href=\"https://www.iconfinder.com/goodware\">goodware std.</a>, <a href=\"https://www.iconfinder.com/font-awesome\">Font Awesome</a>, <a href=\"https://www.iconfinder.com/graphiqa\">Graphiqa Studio</a>, <a href=\"https://www.iconfinder.com/kucingklawu\">Kucingklawu Std.</a>, <a href=\"https://www.iconfinder.com/bendavis\">Creaticca Ltd</a>, <a href=\"https://www.iconfinder.com/iconsets/google-material-design-3-0\">Google</a>",
                    "<a href=\"https://www.iconfinder.com/olivetty\">Smashicons</a>",
                    "<a href=\"https://peerjs.com/\">PeerJS</a>, <a href=\"https://apvarun.github.io/toastify-js/\">ToastifyJS</a>, <a href=\"https://alexbol99.github.io/flatten-js/index.html\">Flatten-js</a>, <a href=\"https://lodash.com/\">Lodash</a>",
                    "<a href=\"https://atomiks.github.io/tippyjs/\">Tippy.js</a>",
                    "<a href=\"https://tldrlegal.com/license/mit-license\">MIT License</a>",
                    "<a href=\"https://simplemaps.com/resources/svg-world\">simplemaps.com</a>"
                ),
                this.getString(R.string.ok),
                null,
                null,
                null
            )
        }

        //Initialize the my account button
        val profilePicture = preferences.getProfilePicture()
        profilePicture?.applyToImageView(this._myAccountButton)
        val logInLauncher = this.registerForActivityResult(ActivityResultContracts.StartActivityForResult(), {this.logInOrOut(it.data)})
        this._myAccountButton.setOnClickListener {this.openAccountActivity(logInLauncher)}
    }

    protected override fun onResume() {
        super.onResume()

        //Update the profile picture
        val preferences = Preferences(this)
        val profilePicture = preferences.getProfilePicture()
        profilePicture?.update(this, {
            preferences.setProfilePicture(profilePicture)
            profilePicture.applyToImageView(this._myAccountButton)
        })
    }

    /**
     * Enables or disables a toolbar button.
     *
     * @param button    The button to enable or disable.
     * @param disabled  True to disable the button, false to enable the button.
     */
    public fun setToolbarButtonDisabled(button: ImageButton, disabled: Boolean){
        button.isEnabled = !disabled
        val drawable = this._buttonDrawables[button]!!
        if(disabled){
            val grayDrawable = drawable.constantState!!.newDrawable().mutate()
            val matrix = ColorMatrix()
            matrix.setSaturation(0f)
            grayDrawable.colorFilter = ColorMatrixColorFilter(matrix)
            button.setImageDrawable(grayDrawable)
            button.alpha = 0.6f
        }
        else{
            button.setImageDrawable(drawable)
            button.alpha = 1.0f
        }
        if(button.id == R.id.pauseButton){
            this.setPauseButtonPressed(false)
        }
    }

    /**
     * Sets whether or not the pause button is pressed.
     *
     * @param pressed   True if it should be pressed, false otherwise.
     */
    private fun setPauseButtonPressed(pressed: Boolean){
        val pauseButton: ImageButton = this.findViewById(R.id.pauseButton)
        this._setPressedTimer?.cancel()
        this._setPressedTimer = null
        if(pressed){
            this._setPressedTimer = timer(action = {
                runOnUiThread {
                    pauseButton.isPressed = true
                }
            }, period = 10)
        }
        pauseButton.isPressed = pressed
    }

    /**
     * Initializes an toolbar button by adding it's drawable to _buttonDrawables.
     *
     * @param id    The R.id.* corresponding to the button.
     *
     * @return The ImageButton object corresponding to the button.
     */
    private fun initializeToolbarButton(id: Int): ImageButton {
        val button = this.findViewById<ImageButton>(id)
        _buttonDrawables[button] = button.drawable.constantState!!.newDrawable()
        return button
    }

    /**
     * Opens the my account activity if the user is logged in, and the log in activity otherwise.
     *
     * @param logInLauncher The launcher to send the results to.
     */
    private fun openAccountActivity(logInLauncher: ActivityResultLauncher<Intent>){
        val preferences = Preferences(this)
        val isLoggedIn = preferences.isLoggedIn()
        if(isLoggedIn){
            val intent = Intent(this, ProfileActivity::class.java)
            val queue: RequestQueue = Volley.newRequestQueue(this)

            val request = JsonObjectRequest(
                Request.Method.GET,
                "https://mapcollector.eu5.org/ajax/get-statistics.php",
                null,
                {
                    val userName = it.optString(ProfileActivity.USER_NAME, this.getString(R.string.myAccount))
                    intent.putExtra(ProfileActivity.USER_NAME, userName)
                    for(name in arrayOf(
                        ProfileActivity.Statistics.SCORE,
                        ProfileActivity.Statistics.NUMBER_OF_MAPS,
                        ProfileActivity.Statistics.WINNING_RATE,
                        ProfileActivity.Statistics.EASY_CHALLENGES,
                        ProfileActivity.Statistics.MEDIUM_CHALLENGES,
                        ProfileActivity.Statistics.DIFFICULT_CHALLENGES
                    )){
                        val value = it.optInt(name, -1)
                        if(value != -1){
                            intent.putExtra(name, value)
                        }
                    }
                    logInLauncher.launch(intent)
                },
                //If there's an error, just launch it without extras, the activity will take care of reporting the error. We need to launch it anyway otherwise it's not possible to log out.
                {logInLauncher.launch(intent)}
            )

            queue.add(request)
        }
        else{
            val intent = Intent(this, LogInActivity::class.java)
            logInLauncher.launch(intent)
        }
    }

    /**
     * Logs in, logs out or does nothing depending on the intent.
     *
     * @param intent    The intent with the log in/log out data.
     */
    private fun logInOrOut(intent: Intent?){
        val logOut = intent?.getBooleanExtra(ProfileActivity.LOGGED_OUT, false) ?: false
        if(logOut){
            val preferences = Preferences(this)
            preferences.logOut()
            preferences.loadLoggedInPage(this, this._webView)
            this._myAccountButton.setImageResource(R.drawable.user)
        }
        else {
            val email = intent?.getStringExtra(Preferences.Preference.EMAIL)
            val hashedPassword = intent?.getStringExtra(Preferences.Preference.HASHED_PASSWORD)
            val userId = intent?.getIntExtra(Preferences.Preference.USER_ID, 0) ?: 0
            val profilePicture =
                intent?.getProfilePictureExtra(Preferences.Preference.PROFILE_PICTURE)

            //They can be null if the user is already logged in and just viewed their profile, in which case do nothing
            if(email != null && hashedPassword != null && userId != 0 && profilePicture != null) {
                val preferences = Preferences(this)
                preferences.logIn(email, hashedPassword, userId, profilePicture)
                preferences.loadLoggedInPage(this, this._webView)
                profilePicture.applyToImageView(this._myAccountButton)
            }
        }
    }
}
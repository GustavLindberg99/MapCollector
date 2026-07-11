package tk.mapcollector

import android.content.Intent
import android.content.SharedPreferences
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.drawable.PictureDrawable
import android.util.Base64
import android.widget.ImageView
import com.caverock.androidsvg.SVG
import com.caverock.androidsvg.SVGParseException
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.android.Android
import io.ktor.client.request.get
import io.ktor.client.statement.HttpResponse
import org.json.JSONException
import org.json.JSONObject

class ProfilePicture(
    private var _isSvg: Boolean,
    private var _data: String?,
    public val url: String
) {
    /**
     * Applies this profile picture to an image view.
     *
     * @param imageView The image view to apply the profile picture to.
     */
    public fun applyToImageView(imageView: ImageView) {
        if (this._data == null) {
            imageView.setImageResource(R.drawable.user)
        }
        else if (this._isSvg) {
            try {
                val drawable = PictureDrawable(SVG.getFromString(this._data).renderToPicture())
                val bitmap = Bitmap.createBitmap(
                    drawable.intrinsicWidth,
                    drawable.intrinsicHeight,
                    Bitmap.Config.ARGB_8888
                )
                val canvas = Canvas(bitmap)
                canvas.drawPicture(drawable.picture)
                imageView.setImageBitmap(bitmap)
            }
            catch (_: SVGParseException) {
                imageView.setImageResource(R.drawable.user)
            }
        }
        else {
            val decodedData = Base64.decode(this._data, Base64.DEFAULT)
            imageView.setImageBitmap(
                BitmapFactory.decodeByteArray(decodedData, 0, decodedData.size)
            )
        }
    }

    /**
     * Updates the profile picture by sending a new request to the server.
     *
     * @throws Exception If the request fails.
     */
    public suspend fun update() {
        val client = HttpClient(Android) { expectSuccess = true }
        val response = client.get(this.url)
        val profilePicture = response.profilePicture(this.url)
        this._data = profilePicture._data
        this._isSvg = profilePicture._isSvg
    }

    /**
     * Converts the ProfilePicture object to a JSON string. Only intended to be used by the extensions in this file, not intended to be used outside of this file.
     *
     * @return A JSON representation of the ProfilePicture object.
     */
    public override fun toString(): String {
        val result = JSONObject()
        result.put(IS_SVG, this._isSvg)
        result.put(DATA, this._data)
        result.put(URL, this.url)
        return result.toString()
    }

    companion object {
        private const val IS_SVG = "isSvg"
        private const val DATA = "data"
        private const val URL = "url"

        /**
         * Gets the profile picture from a response.
         *
         * @param url   The URL that the response came from, before redirects.
         *
         * @return The profile picture.
         */
        public suspend fun HttpResponse.profilePicture(url: String): ProfilePicture {
            val contentType = this.headers["Content-type"]
            if (contentType == "image/svg+xml") {
                return ProfilePicture(
                    true,
                    this.body<String>(),
                    url
                )
            }
            else {
                return ProfilePicture(
                    false,
                    Base64.encode(this.body<ByteArray>(), Base64.DEFAULT).toString(Charsets.UTF_8),
                    url
                )
            }
        }

        /**
         * Helper function to convert a JSON string to a profile picture.
         *
         * @param jsonString    The JSON string to convert.
         *
         * @return The ProfilePicture object corresponding to the JSON string.
         *
         * @throws JSONException If the JSON string is invalid JSON or doesn't contain a profile picture.
         */
        private fun profilePictureFromJson(jsonString: String): ProfilePicture {
            val json = JSONObject(jsonString)
            val isSvg = json.getBoolean(IS_SVG)
            val data = if (json.has(DATA)) json.getString(DATA) else null
            val url = json.getString(URL)
            return ProfilePicture(isSvg, data, url)
        }

        /**
         * Set a ProfilePicture value in the preferences editor, to be written back once commit or apply are called.
         *
         * @param key   The name of the preference to modify.
         * @param value  The new value for the preference. Passing null for this argument is equivalent to calling remove(String) with this key.
         *
         * @return Returns a reference to the same Editor object, so you can chain put calls together.
         */
        public fun SharedPreferences.Editor.putProfilePicture(
            key: String,
            value: ProfilePicture?
        ): SharedPreferences.Editor {
            this.putString(key, value?.toString())
            return this
        }

        /**
         * Retrieve a ProfilePicture value from the preferences.
         *
         * @param key       The name of the preference to retrieve.
         * @param defValue  Value to return if this preference does not exist.
         *
         * @return Returns the preference value if it exists, or defValue. Throws ClassCastException if there is a preference with this name that is not a ProfilePicture.
         *
         * @throws ClassCastException
         */
        public fun SharedPreferences.getProfilePicture(
            key: String,
            defValue: ProfilePicture?
        ): ProfilePicture? {
            val jsonString = this.getString(key, null) ?: return defValue
            try {
                return profilePictureFromJson(jsonString)
            }
            catch (e: JSONException) {
                throw ClassCastException(e.message)
            }
        }

        /**
         * Add extended data to the intent. The name must include a package prefix, for example the app com.android.contacts would use names like "com.android.contacts.ShowAll".
         *
         * @param name  The name of the extra data, with package prefix.
         * @param value The ProfilePicture data value.
         *
         * @return Returns the same Intent object, for chaining multiple calls into a single statement.
         */
        public fun Intent.putExtra(name: String, value: ProfilePicture): Intent {
            this.putExtra(name, value.toString())
            return this
        }

        /**
         * Retrieve extended data from the intent.
         *
         * @param name  The name of the desired item.
         *
         * @return The value of an item previously added with putExtra(), or null if no ProfilePicture value was found.
         */
        public fun Intent.getProfilePictureExtra(name: String): ProfilePicture? {
            val jsonString = this.getStringExtra(name) ?: return null
            return try {
                profilePictureFromJson(jsonString)
            }
            catch (_: JSONException) {
                null
            }
        }
    }
}
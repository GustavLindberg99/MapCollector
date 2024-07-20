package tk.mapcollector

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.drawable.PictureDrawable
import android.util.Base64
import android.widget.ImageView
import com.android.volley.NetworkResponse
import com.android.volley.Request
import com.android.volley.RequestQueue
import com.android.volley.Response
import com.android.volley.VolleyError
import com.android.volley.toolbox.Volley
import com.caverock.androidsvg.SVG
import com.caverock.androidsvg.SVGParseException
import org.json.JSONException
import org.json.JSONObject

private const val IS_SVG = "isSvg"
private const val DATA = "data"
private const val URL = "url"

class ProfilePicture(private var _isSvg: Boolean, private var _data: String?, public val url: String){
    public class ProfilePictureRequest(
        private val _url: String,
        private val _queue: RequestQueue,
        private val _listener: (ProfilePicture) -> Unit
    ): Request<ProfilePicture>(Method.GET, _url, {_listener(ProfilePicture(false, null, _url))}){
        protected override fun parseNetworkResponse(response: NetworkResponse): Response<ProfilePicture> {
            val contentType = response.headers?.getOrDefault("Content-type", null)
            val profilePicture = if(contentType == "image/svg+xml"){
                ProfilePicture(true, response.data.toString(Charsets.UTF_8), this._url)
            }
            else{
                ProfilePicture(false, Base64.encode(response.data, Base64.DEFAULT).toString(Charsets.UTF_8), this._url)
            }
            return Response.success(profilePicture, null)
        }

        protected override fun deliverResponse(response: ProfilePicture) = this._listener(response)

        public override fun deliverError(error: VolleyError){
            val status = error.networkResponse?.statusCode ?: 0
            val location = if(status / 100 == 3) error.networkResponse.headers?.get("Location") else null
            if(location != null){
                val request = ProfilePictureRequest(location, this._queue, this._listener)
                this._queue.add(request)
            }
            else{
                super.deliverError(error)
            }
        }
    }

    /**
     * Applies this profile picture to an image view.
     *
     * @param imageView The image view to apply the profile picture to.
     */
    public fun applyToImageView(imageView: ImageView){
        if(this._data == null){
            imageView.setImageResource(R.drawable.user)
        }
        else if(this._isSvg){
            try{
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
            catch(_: SVGParseException){
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
     * @param context   A Context to use for making a request.
     * @param callback  The callback to be run when the download is finished and the profile picture is updated. If there was a network error, this callback is never called.
     */
    public fun update(context: Context, callback: () -> Unit){
        val queue: RequestQueue = Volley.newRequestQueue(context)
        val request = ProfilePicture.ProfilePictureRequest(this.url, queue, {
            this._data = it._data ?: return@ProfilePictureRequest
            this._isSvg = it._isSvg
            callback()
        })
        queue.add(request)
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
}

/**
 * Helper function to convert a JSON string to a profile picture.
 *
 * @param jsonString    The JSON string to convert.
 *
 * @return The ProfilePicture object corresponding to the JSON string.
 *
 * @throws JSONException if the JSON string is invalid JSON or doesn't contain a profile picture.
 */
private fun profilePictureFromJson(jsonString: String): ProfilePicture {
    val json = JSONObject(jsonString)
    val isSvg = json.getBoolean(IS_SVG)
    val data = if(json.has(DATA)) json.getString(DATA) else null
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
fun SharedPreferences.Editor.putProfilePicture(key: String, value: ProfilePicture?): SharedPreferences.Editor {
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
fun SharedPreferences.getProfilePicture(key: String, defValue: ProfilePicture?): ProfilePicture? {
    val jsonString = this.getString(key, null) ?: return defValue
    try{
        return profilePictureFromJson(jsonString)
    }
    catch(e: JSONException){
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
fun Intent.putExtra(name: String, value: ProfilePicture): Intent {
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
fun Intent.getProfilePictureExtra(name: String): ProfilePicture? {
    val jsonString = this.getStringExtra(name) ?: return null
    return try{
        profilePictureFromJson(jsonString)
    }
    catch(_: JSONException){
        null
    }
}
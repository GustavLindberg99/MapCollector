package tk.mapcollector

import android.app.AlertDialog
import android.content.DialogInterface
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.text.Html
import android.text.method.LinkMovementMethod
import android.view.View
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.text.HtmlCompat
import org.apache.commons.text.StringEscapeUtils

class ProfileActivity: AppCompatActivity(){
    companion object{
        const val LOGGED_OUT = "loggedOut"
        const val USER_NAME = "userName"
    }

    public object Statistics{
        const val SCORE = "score"
        const val NUMBER_OF_MAPS = "numberOfMaps"
        const val WINNING_RATE = "winningRate"
        const val EASY_CHALLENGES = "easyChallenges"
        const val MEDIUM_CHALLENGES = "mediumChallenges"
        const val DIFFICULT_CHALLENGES = "difficultChallenges"
    }

    override fun onCreate(savedInstanceState: Bundle?){
        super.onCreate(savedInstanceState)
        this.setContentView(R.layout.activity_profile)

        //Initialize the user name
        val userName = this.intent.getStringExtra(USER_NAME) ?: this.getString(R.string.myAccount)
        this.title = Html.fromHtml(
            String.format("<font color='0x000000'>%s</font>", StringEscapeUtils.escapeHtml4(userName)),
            HtmlCompat.FROM_HTML_MODE_LEGACY
        )

        //Initialize the profile picture
        val preferences = Preferences(this)
        val profilePicture = preferences.getProfilePicture()!!
        val profilePictureView: ImageView = this.findViewById(R.id.profilePicture)
        profilePicture.applyToImageView(profilePictureView)

        //Initialize the statistics
        val score = this.intent.getIntExtra(Statistics.SCORE, -1)
        val numberOfMaps = this.intent.getIntExtra(Statistics.NUMBER_OF_MAPS, -1)
        val winningRate = this.intent.getIntExtra(Statistics.WINNING_RATE, -1)
        val easyChallenges = this.intent.getIntExtra(Statistics.EASY_CHALLENGES, -1)
        val mediumChallenges = this.intent.getIntExtra(Statistics.MEDIUM_CHALLENGES, -1)
        val difficultChallenges = this.intent.getIntExtra(Statistics.DIFFICULT_CHALLENGES, -1)

        val errorLabel: TextView = this.findViewById(R.id.errorLabel)
        val scoreLabel: TextView = this.findViewById(R.id.scoreLabel)
        val numberOfMapsLabel: TextView = this.findViewById(R.id.numberOfMapsLabel)
        val winningRateLabel: TextView = this.findViewById(R.id.winningRateLabel)
        val challengesLayout: LinearLayout = this.findViewById(R.id.challengesLayout)

        if(score == -1 || numberOfMaps == -1 || winningRate == -1 || easyChallenges == -1 || mediumChallenges == -1 || difficultChallenges == -1){
            errorLabel.visibility = View.VISIBLE
            scoreLabel.visibility = View.GONE
            numberOfMapsLabel.visibility = View.GONE
            winningRateLabel.visibility = View.GONE
            challengesLayout.visibility = View.GONE
        }
        else{
            scoreLabel.text = String.format(this.getString(R.string.score), score)
            numberOfMapsLabel.text = String.format(this.getString(R.string.numberOfMaps), numberOfMaps)
            winningRateLabel.text = String.format(this.getString(R.string.winningRate), winningRate)

            val easyChallengesLabel: TextView = this.findViewById(R.id.easyChallengesLabel)
            val easyChallengesImage: ImageView = this.findViewById(R.id.easyChallengesImage)
            val mediumChallengesLabel: TextView = this.findViewById(R.id.mediumChallengesLabel)
            val mediumChallengesImage: ImageView = this.findViewById(R.id.mediumChallengesImage)
            val difficultChallengesLabel: TextView = this.findViewById(R.id.difficultChallengesLabel)
            val difficultChallengesImage: ImageView = this.findViewById(R.id.difficultChallengesImage)

            if(easyChallenges == 0){
                easyChallengesLabel.visibility = View.GONE
                easyChallengesImage.visibility = View.GONE
            }
            else{
                easyChallengesLabel.text = easyChallenges.toString()
            }

            if(mediumChallenges == 0){
                mediumChallengesLabel.visibility = View.GONE
                mediumChallengesImage.visibility = View.GONE
            }
            else{
                mediumChallengesLabel.text = mediumChallenges.toString()
            }

            if(difficultChallenges == 0){
                difficultChallengesLabel.visibility = View.GONE
                difficultChallengesImage.visibility = View.GONE
            }
            else{
                difficultChallengesLabel.text = difficultChallenges.toString()
            }

            val challengesDetailsLink: TextView = this.findViewById(R.id.challengeDetailsLink)
            challengesDetailsLink.text = Html.fromHtml(
                String.format("(<a href=\"https://mapcollector.eu5.org/users/challenges.php\">%s</a>)", this.getString(R.string.viewDetails)),
                HtmlCompat.FROM_HTML_MODE_LEGACY
            )
            challengesDetailsLink.movementMethod = LinkMovementMethod.getInstance()
            challengesDetailsLink.setLinkTextColor(Color.BLUE)
        }

        //Initialize the buttons
        val editProfileButton: Button = this.findViewById(R.id.editProfileButton)
        val deleteAccountButton: Button = this.findViewById(R.id.deleteAccountButton)
        val logOutButton: Button = this.findViewById(R.id.logOutButton)

        editProfileButton.setOnClickListener {
            this.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("http://mapcollector.eu5.org/users/profile.php")))
        }
        deleteAccountButton.setOnClickListener {
            this.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("http://mapcollector.eu5.org/users/delete.php")))
        }
        logOutButton.setOnClickListener {
            AlertDialog.Builder(this, R.style.AlertDialogTheme)
                .setTitle(R.string.logOut)
                .setMessage(R.string.logOutConfirmation)
                .setPositiveButton(R.string.yes, {_, _ ->
                    Toast.makeText(this, R.string.logoutSucceeded, Toast.LENGTH_SHORT).show()

                    val intent = Intent()
                    intent.putExtra(LOGGED_OUT, true)
                    this.setResult(RESULT_OK, intent)
                    this.finish()
                })
                .setNegativeButton(R.string.no, null)
                .show()
        }
    }
}
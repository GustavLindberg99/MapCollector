# Map Collector

Map Collector is a game about riding around on trains to collect train timetables. In the game, the timetables are referred to as "maps". When you start a new game, you need to choose which place you want to get maps in.

In the game, you have a certain amount of time to collect all maps that exist in the game. There is one map for each line that exists in that place. The amount of time you have varies for each place, but is usually between 2 and 10 minutes. You can find maps both on lines and at stations. You have a higher probability of finding the map of a certain line on that line or at a station where that line stops.

## Contents
- [The game](#the-game)
    - [Starting a new game](#starting-a-new-game)
    - [Going to another station](#going-to-another-station)
    - [Collecting maps](#collecting-maps)
    - [The toolbar](#the-toolbar)
    - [Playing with money](#playing-with-money)
- [Accounts](#accounts)
    - [Managing your account](#managing-your-account)
    - [Score and statistics](#score-and-statistics)
    - [Two-player games](#two-player-games)
- [Other](#other)
    - [Supported browsers](#supported-browsers)
    - [Why is it called "Map Collector"?](#why-is-it-called-map-collector)
    - [Where does the logo come from?](#where-does-the-logo-come-from)

Can't find what you're looking for? [Ask us a question.](https://github.com/GustavLindberg99/MapCollector/issues)

## The game
### Starting a new game
When you first open the [homepage](https://mapcollector.eu5.org) or when you press the ![New Game](https://gustavlindberg99.github.io/MapCollector/images/newbutton.svg) button in the toolbar, you will see a New Game window which allows you to choose which place you want to play in:

![New Game window](https://github.com/user-attachments/assets/f82fcb1e-cb19-4f68-8ec1-6e7bbb35fdcb)

This window contains 3 parts:

1. A world map with all the places that are available (you can zoom in and out with the wheel on your mouse)
2. Details about the selected place
3. A list to select if you want to play with time or money and if you want to play alone or a [two-player game](#two-player-games)

To start a new game, click on a marker in (1). The colors represent how easy it is to win the game at that place: green for easy, yellow for medium and red for difficult. Some places have two different colors, this means several variants of the same place are available (for example with or without tram). If you hover over one of those places, you can choose which variant you want to play with.

The part with details about the selected place (2) contains the following details:

- **Level:** Can be Easy, Medium or Difficult. The fewer stations and lines there are, the easier the place is. When there are fewer stations and lines, it's usually easier to tell where it's best for you to go next. The level of each place is also visible in the place list (1).
- **Length of a Game:** Indicates the amount of time you have to collect all maps when playing with time. The length of a game is usually adapted to the difficulty of the place, so if there are a lot of maps that you need to collect, you usually have longer time to collect them.
- **Money at Start:** The amount of money you get at the start of a game is shown here.
- **Country:** Indicates which country this place is in. This doesn't make any difference for the game, it's just a fun fact.
- **Real Website:** This is a link to the official website of the company that operates the train lines in this place in real life. This link usually contains interesting real life information about the train lines in this place. This link is not always in English. If it's in a language that you don't understand, you can use Google Translate to translate the page. Paste the link to the page in the box to the left and click on the link that shows up on the right. Some sites also have a language menu in the header so that you can get the site in English.

### Going to another station
To go to a station, click on that station. You can only go to a station if there is at least one direct line between your current position and the station you want to go to. If there is no direct line, you can't go directly to that station, you need to go to another station first to change trains. For example, in Denver, if you want to go from RidgeGate Parkway to Westminster, there is no direct line so you need to first go to Union Station (on line E) and then go to Westminster (on line B).

If there is only one line between the station where you are and the station where you want to go, this line is automatically selected and you will be taken to the station where you want to go by simply selecting "Go". However, if there are several lines that stop at both stations and that go different ways, you will need to choose which one you want to take. To do so, you will get a dialog like this:

![Line choice window](https://github.com/user-attachments/assets/8cd95fb6-2826-4a40-b51c-e4377551c995)

Simply click on the line you want to take. Usually, you will probably want to take the shortest line, but if you already have the map for the shortest line but not for the other one, you might want to take the other one, especially if you're playing with money. In the example above, in New York, you're at Fulton St and you want to go to Borough Hall. Line 2 is shorter so that's the one you would usually want to take, but if you already have the map for line 2 but don't have the one for line 5, you might want to take line 5 instead.

### Collecting maps
On the left side of the game area (or above the game area on mobile devices), there are three views:

- **Available maps:** Shows a list of the maps that you can collect at your current position.
- **Maps you still need:** Shows a list of all maps. The ones you already have are grayed out, and the one you don't have yet aren't. That way, you can easily see which maps you still need to collect by looking at which ones aren't grayed out. You can't collect maps by clicking on them from this window (otherwise the game would be too easy), you need to go places where the maps are available and collect them from the Available Maps view. If you click on a map in this list, the corresponding line will be highlighted. To unhighlight it, click on the map again or press the Esc key.
- **Maps your opponent still needs:** Similar to "Maps you still need", but shows your opponent's maps. Only available in two-player games.

The number next to the title of the view is the number of maps in the view that you (or your opponent in the case of the last view) don't have yet.

By default, Available Maps is expanded on all devices and Your Maps is expanded on desktop devices. To collapse or expand one of these views, click on the title.

To collect a map, click on it in the Available Maps view. It will then appear in the Your Maps view, which shows that you have collected it. If the map that you are looking for is not in the Available Maps view, you need to go somewhere else to find it.

If you are looking for a map of a specific line, it's possible to find it anywhere, but you are most likely to find it either on that line or at a station where that line stops. The maps available at a specific station or on a specific line are changed each game. This means that if you go back to a station you have already been at this game or if you ride a line that you have already ridden this game, the maps that you will find will not be different than the ones that were there last time you were there.

### The toolbar
The toolbar is the area on top of the game area. It contains the following buttons:

- ![New Game](https://gustavlindberg99.github.io/MapCollector/images/newbutton.svg) Opens a window with options to start a new game. See Starting a new game for a complete description of how this window works.
- ![Pause](https://gustavlindberg99.github.io/MapCollector/images/pause.svg) Pauses the game. When the game is paused, you can't move or collect maps and the time the game is paused won't count against how long the game month is. Pausing the game can be useful if you want to do something else and continue the game later, or if you need time to think about what you want to do next in the game. You can also pause the game by pressing the Space key.
- ![Fast forward to destination](https://gustavlindberg99.github.io/MapCollector/images/fast-forward.svg) If you're on a train or a bus, this button makes you go directly to your next destination without having to wait. If you're playing with time, this button also reduces the amount of time left accordingly, so this button is just for comfort and doesn't change how much time you have left.
- ![Help](https://gustavlindberg99.github.io/MapCollector/images/help.svg) Opens the main help page in a new tab.
- ![About](https://gustavlindberg99.github.io/MapCollector/images/info.svg) Shows legal information about the app. Only exists in the Android app, on the web this information is on the bottom of each page.

### Playing with money
When you start a new game, you can choose whether to play with time or money by using the dropdown list to the left of the New Game button. When you play with money, you have as much time as you want to collect all maps, but going to different stations costs money and you only have a limited amount of money that you can use during each game month.

Most places have fare zones. These fare zones are visible no matter if you are playing with time or money, but only have an effect when you're playing with money. The fare zones are colored in white, green or yellow. Some places also have a regional boundary. In that case, the area outside of the region is colored in red. Some places also have sea, lakes and rivers colored in blue, but these have no effect on the game.

Going to another station costs a different amount of money depending on how many fare zones you go through. Here is a list of those fares:

- **Travel within the same zone:** $1.
    Example: From Union Station to 41st/Fox in Denver.
- **Travel between several zones:** $10 per zone boundary crossed.
    Example: In Denver, starting from Union Station, travelling to Peoria costs $10, travelling to 61st/Pena costs $20 and travelling to Denver Airport costs $30.
- **Crossing the region boundary:** $25. If you cross zone boundaries inside the region too, it costs $10 extra per zone boundary crossed. If you cross the region boundary twice, it costs $50 (plus any extra cost for crossing zone boundaries).
    Example: In Skåne, starting from CPH Flygplats, travelling to to Hyllie costs $25, travelling to Lund C costs $35, travelling to Landskrona costs $45, and travelling to Göteborg costs $90 ($50 for crossing the region boundary twice and $40 for crossing 4 zone boundaries).
- **Travel between two stations outside of the region:** $3 if you do not cross the region boundary, otherwise as above.
    Example: From Bergåsa to Karlskrona in Skåne.
- **Using a walking connection:** Free, no matter how many zone boundaries are crossed.
    Example: From Farragut North to Farragut West Washington DC.

Some places like New York don't have any zones. In those places, any travel costs $1, except walking connections which are free.

When you play with money, you have the possibility to fare evade by checking the "fare evasion"-checkbox in the window where you choose which line to take. When you fare evade, you ride for free, but you might get caught, in which case you must pay a fine equal to ten times what a ticket would have cost. If you don't have enough money to pay the fine, you lose the game.

## Accounts
### Managing your account
#### Creating an account
To create an account, go to the [sign up page](https://mapcollector.eu5.org/users/signup.php). There you need to enter the user name, email address and password that you want to use. You can only create an account on the web, not in the Android app (but once you've created an account, you can log in to it in the Android app).

#### Logging in and out
When you have created your account, you will be logged in automatically. You can log out by clicking on the "Log out" button in the "My account" menu on the top right.

If you want to log in from another browser or log in again after having logged out, you can use the "Log in" button on the top right.

When you have created an account, you can also log in from the Android app by clicking on the ![](https://gustavlindberg99.github.io/MapCollector/images/user.svg) button on the top right of the app. You can log out from the app by clicking on your profile picture on the top right and then selecting "Log out".

#### Changing your profile
When you're logged in, you can change your profile on your [profile page](https://mapcollector.eu5.org/users/profile.php). There are buttons next to your user name and profile picture to change them, and there are buttons under "Account" to change your email or password or delete your account.

If you want to use a custom profile picture, you need to create a [Gravatar](https://en.gravatar.com/) account and select "Gravatar" when changing your profile picture on Map Collector.

You can also use a Map Collector map as your profile picture by choosing "Map Collector". If your email address starts with a letter in the English alphabet or a number, your profile picture will be the map a line that has the same letter or number as the first character in your email address. Otherwise, your profile picture will be a map from Västergötland or Rome that doesn't have a name, and instead has a picture of a train.

Your user name and profile picture will be visible publicly, but others will only be able to search for you if they have a Map Collector account. You can choose on your [profile page](https://mapcollector.eu5.org/users/profile.php) who can see your statistics. Your email address is only visible to yourself and administrators. Your password is safely encrypted and is not visible to anyone, not even to administrators.

You cannot change your profile in the Android app, but if you're using the app you can easily open your profile in a browser and change it by clicking on your profile picture on the top right and choosing "Change profile".

#### Changing your settings
You can choose which language and game variant you prefer by clicking on "Settings" in the "My account"-menu on the top right.

### Score and statistics
You can view your statistics on the website on your [user page](https://mapcollector.eu5.org/users/profile.php), or in the Android app by clicking on your profile picture in the top right corner. There you can see your score, how many maps you have collected, your winning rate and how many challenges you have completed. The score is calculated like this:

- **+1** for every 10 maps that you collect
- **+5** for each game you win in an easy place
- **+10** for each game you win in a medium place
- **+25** for each game you win in a difficult place
- **-2** for each game you lose
- Your score can never drop below 0

You can see which challenges you have completed and how close you are to completing new challenges on the [challenges page](https://mapcollector.eu5.org/users/challenges.php).

### Two-player games
#### Starting a two-player game
In order to play a two-player game, you must have an account. When you're logged in, select "Two players" under "Number of players" in (3) in the image below, and then click on the place in which you want to play in (1) in the image below.

![New Game window](https://github.com/user-attachments/assets/f82fcb1e-cb19-4f68-8ec1-6e7bbb35fdcb)

When you click on a place after having selected Two players, you will see a window where you need to select which user you want to play with. To start a game with a certain user, click on the "Play with this user" link below their name:

![Window for starting a two-player game](https://github.com/user-attachments/assets/49cace6f-e6c6-4b96-a6cc-1b0aa7a4f055)

When you initially open this window, it will show you a list of your contacts. When you first create an account, your list of contacts is empty. In order to add a user to your list of contacts, you can search for their name in the search box on the top of the window, and click on the "Add to contacts" link under their name. You can also play a game with someone who is not your contact by searching for their name and clicking on the "Play with this user" link below their name.

#### Common reasons why you can't play with a certain user
You can only play with a user if they already have the Map Collector homepage opened in a supported browser, or if they have the Android app open. Additionally, especially if they left the page open for a long time, users will sometimes have to refresh the page in order to be able to play two-player games (both to send and to receive invitations).

#### Rules for winning two-player games
As for single-player games, you can choose whether you want to play a two-player game with time or money (you do that the same way as with single-player games before you send an invitation to the user you want to play with). However, in two-player games, you never run out of time or money. In order to win a two-player game with time, you need to collect all maps before your opponent collects all maps, and in order to win a two-player game with money, both you and your opponent need to collect all maps, and the winner is the player who spent the least money.

#### Contacts
If you often play two-player games with a specific user, you can add them to your contacts so that you don't need to search for them each time. To add someone to your contacts, go to the user list, search for a user and add them to your contacts.

#### Notifications in the Android app
If you're logged in in the Android app, you will get a notification when someone wants to play a two-player game with you. If you don't want notifications, you can disable them in Settings > Apps and notifications > Map Collector > Notifications. You can also disable notifications only from people who aren't in your contacts.

## Other
### Supported browsers
Map Collector supports the following browsers (includes both desktop and mobile versions):

- Google Chrome version 126 and later ([download](https://www.google.com/chrome/)) (also includes other Chromium-based browsers)
- Mozilla Firefox version 128 and later ([download](https://www.mozilla.org/en-US/firefox/new/))
- Microsoft Edge version 126 and later ([download](https://www.microsoft.com/en-us/edge))
- Opera version 111 and later ([download](https://www.opera.com/download)) (does <em>not</em> include Opera Mini)
- On Android you can also play in the [app](https://play.google.com/store/apps/details?id=tk.mapcollector).

Map Collector may work on other browsers too, but these are the browsers that it's been tested on and that it's guaranteed to work on.

Playing Map Collector on Apple devices is not officially supported, which means that we won't fix bugs that only occur on Apple devices. This is because Apple doesn't allow updating to the latest version of iOS on old iPhones, and buying a new iPhone every few years would be very expensive, meaning that we can't test Map Collector on the latest iOS version. For the best user experience, we recommend that next time you buy a new computer or mobile phone, make sure it's not Apple.

### Why is it called "Map Collector"?
The Map Collector "maps" represent timetables of specific lines. So why is it "Map Collector" and not "Timetable Collector"?

I got the idea for making Map Collector because I collect timetables in real life. For example, here is my "map" collection from Denver:

![](https://github.com/user-attachments/assets/66554881-9ce2-4c90-9b82-dc9f8fb4608e)

In real life, I call these timetables "maps". The reason for this is because I have five different "map" collections (you can see this as that I collect maps in five different Map Collector places). Four of these collections are timetables just like in Map Collector, but one of them is a collection of actual maps of public transportation in the Paris region. Here is one of these maps:

![](https://github.com/user-attachments/assets/e8d05e95-0f2f-49db-9499-f8177fbf1015)

As you can see, the main purpose of this is to be a map, so it's natural to call this a map. These were the first maps I started collecting, and when I started collecting timetables as well, I called them maps too. The "maps" you can collect in Map Collector are the timetables, and not the actual maps, but since I just call them all "maps" in real life, I call them that in Map Collector too.

To finish, here is a picture of my entire collection of 851 maps and timetables:

![](https://github.com/user-attachments/assets/685aecd2-c279-41b8-abf1-d743efb2ab3e)

From top left to bottom right: buses in the Paris region (too many to make an interesting game in Map Collector, there are over 500 of these), trains and buses in Skåne (only the trains are in Map Collector), trains in the Paris region (the same ones as in Map Collector), trains and buses in Denver (only the trains are in Map Collector), maps of Paris and its close suburbs.

### Where does the logo come from?
The Map Collector logo represents the Map Collector map for the A line in Denver (the real map doesn't look like this, see the image above). The reason the logo represents this line is because Denver was the first Map Collector place I made, and the A line is the first line in Denver in alphabetical order ([this wasn't the first line in Denver chronolgically](https://en.wikipedia.org/wiki/Regional_Transportation_District#Light_rail), but Map Collector was first made in 2019 a few years after the A line was opened).
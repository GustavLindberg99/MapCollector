<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/challenges.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/database.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/exceptions.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/level.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/statistics.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/utils.php');

abstract class ProfilePicture{
    const Gravatar = 1;
    const Map = 2;
}

abstract class GameVariant{
    const Time = 0x0;
    const Money = 0x1;
}

abstract class UserGroup{
    const Me = 0x0;
    const Contacts = 0x1;
    const Everybody = 0x2;
}

class User{
    private $_id;
    private $_hasAdminRights;
    protected $_email;
    protected $_password;
    protected $_profileIsPublic;
    protected $_language;
    protected $_statistics;
    protected $_name;
    protected $_profilePictureType;
    protected $_variant;
    protected $_contacts;
    protected $_multiplayerId;

    protected const statisticsKeys = [
        "numberOfWonGames",
        "numberOfLostGames",
        "numberOfMaps",
        "remainingTime",
        "remainingMoney",
        "currentStreak",
        "longestStreak",
        "numberOfWonMultiplayerGames",
        "numberOfWonMultiplayerGamesAgainstHigherScore",
        "lastPlayed",
        "currentDaysInARow",
        "totalDaysInARow",
        "completedGameChallenges"
    ];

    /**
     * Constructs a User object.
     *
     * @param $user If an int or a string convertible to an int, the ID of the user. If any other string, the email address of the user. If a User object, the constructor acts a s a copy constructor.
     *
     * @throws PDOException if the attempt to connect to the database fails.
     * @throws InvalidEmailException if the email address is invalid (can only be thrown if $user is a string).
     * @throws UserNotFoundException if the email address isn't in the database.
     */
    public function __construct($user){
        //If $user is a User object, change it to the user ID
        if($user instanceof User){
            $user = $user->id();
        }

        $bdd = connectToDatabase();

        //If $user is an integer, interpret it as a user ID
        if(is_int($user) || (string)(int)$user == $user){
            $query = $bdd->prepare("SELECT * FROM users WHERE id = ?");
        }

        //Otherwise interpret it as an email address
        else if(is_string($user)){
            if(!filter_var($user, FILTER_VALIDATE_EMAIL)){
                throw new InvalidEmailException('The email address isn\'t valid');
            }
            $query = $bdd->prepare("SELECT * FROM users WHERE REPLACE(email, '.', '') = ?");
        }

        //If it's not an integer or a string, we don't know what to do with it so throw an exception
        else{
            throw new TypeError('The parameter for the User constructor must be of type int, string or User');
        }

        //Run the query defined above (the query is different depending on if the parameter was a user ID or an email address)
        $query->execute([str_replace('.', '', $user)]);
        $data = $query->fetch();
        if(!$data){
            throw new UserNotFoundException('Could not find the user with ID or email address');
        }

        //Initialize the class attributes using the database
        $this->_email = $data['email'];
        $this->_name = $data['name'];
        $this->_password = $data['password'];
        $this->_profilePictureType = $data['profilePicture'];
        $this->_language = $data['language'];
        $this->_variant = $data['variant'];
        $this->_id = $data['id'];
        $this->_hasAdminRights = $data['hasAdminRights'];
        $this->_profileIsPublic = $data['profileIsPublic'];
        $this->_statistics = new Statistics($data['statistics']);
        $this->_contacts = json_decode($data['contacts'], true);
        $this->_multiplayerId = $data['multiplayerId'];
        $query->closeCursor();
    }

    /**
     * Finds which user the GET parameters correspond to, for example when viewing the profile. If no user is found, the script exits and the appropriate HTTP error is shown. Does not check if the user has the right to view the other user's profile.
     *
     * @param $loggedInUser The user that is currently logged in, or null if no user is logged in. Used to determine whether that user has the rights to edit the other user's profile.
     *
     * @return The user corresponding to the GET parameters. This user will have the correct subtype of User if relevant (EditableUser if it can be edited, LoggedInUser if it's the same user as the one logged in, etc). Returns null if the user ID isn't set in the GET parameters and no user is logged in
     */
    public static function userFromGetParams(?LoggedInUser $loggedInUser): ?User {
        if(isset($_GET['uid'])){
            if(!is_numeric($_GET['uid'])){
                showHttpError(400);
            }
            $userId = (int)$_GET['uid'];
            if($loggedInUser !== null && $userId === $loggedInUser->id()){
                return $loggedInUser;
            }
            else try{
                if($loggedInUser !== null && $loggedInUser->hasAdminRights()){
                    return new AdminEditableUser($userId, $loggedInUser);
                }
                else{
                    return new User($userId);
                }
            }
            catch(UserNotFoundException $e){
                showHttpError(404);
            }
            catch(PDOException $e){
                showHttpError(503, 'Database error: ' . $e->getMessage());
            }
        }
        else{
            return $loggedInUser;
        }
    }

    /**
     * Searches for users whose names contain a specific string.
     *
     * @param $search   The string that the username should contain.
     *
     * @return An array of User objects with the found users.
     *
     * @throws PDOException if the attempt to connect to the database fails.
     */
    public static function userSearch(string $search): array {
        $bdd = connectToDatabase();
        if(preg_match('/^id:([0-9]+)$/', $search, $matches)){
            $query = $bdd->prepare("SELECT id FROM users WHERE id = ?");
            $query->execute([$matches[1]]);
        }
        else{
            $query = $bdd->prepare("SELECT id FROM users WHERE INSTR(name, ?) <> 0");
            $query->execute([$search]);
        }
        $result = [];
        while($data = $query->fetch()){
            $result[] = new User($data['id']);
        }
        return $result;
    }

    /**
     * Checks if an email address is registered.
     *
     * @param $email    The email address to check.
     *
     * @return True if the email address is registered, false if it isn't.
     *
     * @throws PDOException if the attempt to connect to the database fails.
     */
    public static function emailIsRegistered(string $email): bool {
        $bdd = connectToDatabase();
        $query = $bdd->prepare("SELECT * FROM users WHERE REPLACE(email, '.', '') = ?");
        $query->execute([str_replace('.', '', $email)]);
        if($query->fetch()){
            $query->closeCursor();
            return true;
        }
        $query->closeCursor();
        return false;
    }

    /**
     * Checks if a user with the specified ID exists.
     *
     * @param $id   The email address to check.
     *
     * @return True if a user with the ID exists, false if it doesn't.
     *
     * @throws PDOException if the attempt to connect to the database fails.
     */
    public static function userIdExists(int $id): bool {
        $bdd = connectToDatabase();
        $query = $bdd->prepare("SELECT * FROM users WHERE id = ?");
        $query->execute([$id]);
        if($query->fetch()){
            $query->closeCursor();
            return true;
        }
        $query->closeCursor();
        return false;
    }

    /**
     * Gets the user's email address.
     *
     * @return The user's email address.
     */
    public function email(): string {
        return $this->_email;
    }

    /**
     * Gets the user's user name.
     *
     * @return The user's user name.
     */
    public function name(): string {
        return $this->_name;
    }

    /**
     * Gets the user's ID.
     *
     * @return The user's ID.
     */
    public function id(): int {
        return $this->_id;
    }

    /**
     * Gets whether the user has admin rights.
     *
     * @return True if the user has admin rights, false if they don't.
     */
    public function hasAdminRights(): bool {
        return $this->_hasAdminRights;
    }

    /**
     * Gets who can see the user's statistics.
     *
     * @return A member of the UserGroup enum.
     */
    public function whoCanSeeStatistics(): int {
        return $this->_profileIsPublic;
    }

    /**
     * Gets the user's preferred language.
     *
     * @return The two-letter string corresponding to the user's preferred language.
     */
    public function language(): string {
        return $this->_language;
    }

    /**
     * Gets the user's preferred game variant.
     *
     * @return A member of the GameVariant enum.
     */
    public function variant(): int {
        return $this->_variant;
    }

    /**
     * Gets the URL of the user's Map profile picture. This is not necessarily the actual profile picture if the user set their profile picture to Gravatar.
     *
     * @return The URL of the user's Map profile picture.
     */
    public function mapProfilePicture(): string {
        $mapIndex = 0;
        foreach(unpack('C*', $this->email()) as $charcode){    //unpack('C*', string) converts the string to an array of ASCII codes
            $mapIndex += $charcode;
        }
        return sprintf('%s://%s/profilemap.php?c=%s&n=%d', isset($_SERVER['HTTPS']) ? 'https' : 'http', $_SERVER['HTTP_HOST'], urlencode($this->email()[0]), $mapIndex);
    }

    /**
     * Gets the URL of the user's Gravatar profile picture. This is not necessarily the actual profile picture if the user set their profile picture to Map.
     *
     * @return The URL of the user's Gravatar profile picture.
     */
    public function gravatarProfilePicture(): string {
        return 'https://www.gravatar.com/avatar/' . md5(strtolower(trim($this->email()))) . '?d=identicon&s=256';
    }

    /**
     * Gets the URL of the user's profile picture.
     *
     * @param $profilePictureType   Whether to show the user's Map or Gravatar profile picture. If null, shows whatever the user set it to.
     *
     * @return The URL of the user's profile picture.
     */
    public function profilePicture(?int $profilePictureType = null): string {
        switch($profilePictureType ?? $this->_profilePictureType){
        case ProfilePicture::Gravatar:
            return $this->gravatarProfilePicture();
        case ProfilePicture::Map:
            return $this->mapProfilePicture();
        }
    }

    /**
     * Gets whether the profile picture is a map or a Gravatar image.
     *
     * @return A value from the ProfilePicture enum.
     */
    public function profilePictureType(): int {
        return $this->_profilePictureType;
    }

    /**
     * Exports all the information needed to create a user card to an associative array that json_encode can be called on.
     *
     * @return An associative array with the user's information.
     */
    public function toJSON(): array {
        $loggedInUser = LoggedInUser::userFromCookies();
        if($loggedInUser === null){
            $contacts = [];
        }
        else{
            $contacts = $loggedInUser->contactIds();
        }
        return [
            'id' => $this->id(),
            'name' => $this->name(),
            'profilePicture' => $this->profilePicture(),
            'isContact' => in_array($this->id(), $contacts)
        ];
    }

    /**
     * Checks if a password matches this user's password.
     *
     * @param $password         The password to check.
     * @param $passwordIsHashed True if $password is hashed, false if it isn't.
     *
     * @return True if the password is correct, false if it isn't.
     */
    public function passwordIsCorrect(string $password, bool $passwordIsHashed = false): bool {
        if($passwordIsHashed){
            return $password == $this->_password;
        }
        if(preg_match('/^\$extradata\$[0-9]+(\$.*)$/', $this->_password, $actualHashedPassword)){
            return password_verify($password, $actualHashedPassword[1]);
        }
        return password_verify($password, $this->_password);
    }

    /**
     * Checks if a hashed password matches this user's password.
     *
     * @param $password The hashed password to check.
     *
     * @return True if the hashed password is correct, false if it isn't.
     */
    public function hashedPasswordIsCorrect(string $password): bool {
        return $this->passwordIsCorrect($password, true);
    }

    /**
     * Checks if two User object represent the same user.
     *
     * @param $otherUser    The user to compare to. If null, always returns false.
     *
     * @return True if the $otherUser represents the same user as $this, false otherwise.
     */
    public function equals(?User $otherUser): bool {
        return $otherUser !== null && $this->id() === $otherUser->id();
    }

    /**
     * Gets the user IDs of this user's contacts. If one or more contacts have deleted their accounts, those IDs won't be included.
     *
     * @return An array of integers containing the user's contacts' IDs.
     *
     * @throws PDOException if the attempt to connect to the database fails.
     */
    public function contactIds(): array {
        return array_filter($this->_contacts, function($it){return User::userIdExists($it);});
    }

    /**
     * Gets the this user's contacts. If one or more contacts have deleted their accounts, those users won't be included.
     *
     * @return An array of User objects containing the user's contacts.
     *
     * @throws PDOException if the attempt to connect to the database fails.
     */
    public function contacts(): array {
        return array_map(function($it){return new User($it);}, $this->contactIds());
    }

    /**
     * Checks if the given user is in this user's contacts.
     *
     * @param $contact  The user to check if they're in this user's contacts.
     *
     * @return True if $contact is in $this's contacts, false otherwise.
     *
     * @throws PDOException if the attempt to connect to the database fails.
     */
    public function hasContact(?User $contact): bool {
        return $contact !== null && in_array($contact->id(), $this->contactIds());
    }

    /**
     * Checks if this user's profile is visible to another user.
     *
     * @param $otherUser    The user trying to view this user's profile. Null means a user that isn't logged in.
     *
     * @return True if the other user is allowed to see this user's profile, false otherwise.
     */
    public function profileVisibleTo(?User $otherUser): bool {
        return $this->equals($otherUser) ||
               $this->whoCanSeeStatistics() == UserGroup::Everybody ||
               ($otherUser !== null && $otherUser->hasAdminRights()) ||
               ($this->whoCanSeeStatistics() == UserGroup::Contacts && $this->hasContact($otherUser));
    }

    /**
     * Gets the user's statistics.
     *
     * @return The user's statistics.
     */
    public function statistics(): Statistics {
        return clone $this->_statistics;
    }

    /**
     * The user's multiplayer ID, i.e. the ID of the user's latest Peer object in peer.js. This gets updated every time the user visits the homepage, so that when the get an invitation, it goes to the page they opened last.
     *
     * @return A JSON array with the multiplayer IDs, or null if the user has never visited the homepage while logged in.
     */
    public function multiplayerId(): ?string {
        $this->updateMuliplayerId(null);    //Remove obsolete IDs
        return $this->_multiplayerId;
    }

    /**
     * Updates the list of multiplayer IDs of the user.
     *
     * @param $multiplayerId    If non-null, adds this multiplayer ID so that the player can receive invitations to that Peer.js ID. If null, doesn't add any ID, but removes IDs that are older than a day.
     */
    public function updateMuliplayerId(?string $multiplayerId): void {
        $ids = json_decode($this->_multiplayerId ?? '', true) ?? [];
        if($multiplayerId !== null){
            $ids[] = $multiplayerId;
        }
        $ids = array_filter($ids, function(string $id): bool {
            preg_match('/^gustavlindberg99-mapcollector-[0-9]+-([0-9]+)$/', $id, $matches);
            return (int)($matches[1] ?? 0) / 1000 > time() - 24 * 3600;
        });
        $this->_multiplayerId = json_encode($ids);
        $bdd = connectToDatabase();
        $request = $bdd->prepare("UPDATE users SET multiplayerId = :multiplayerId WHERE id = :id");
        $request->execute(["id" => $this->id(), "multiplayerId" => $this->_multiplayerId]);
    }
}


abstract class EditableUser extends User{
    /**
     * Constructs an EditableUser object. This class is abstract to make sure that the logged in user has privileges to edit this user, those checks are implemented in the subclass constructors.
     *
     * @param $user The ID or email address of the user to construct, see User constructor for details.
     *
     * @throws PDOException if the attempt to connect to the database fails.
     * @throws InvalidEmailException if the email address is invalid (can only be thrown if $user is a string).
     * @throws UserNotFoundException if the email address isn't in the database.
     */
    protected function __construct($user){
        parent::__construct($user);
    }

    /**
     * Changes the email address of the user and saves the changes to the database.
     *
     * @param $email    The new email address to set.
     *
     * @throws PDOException if the attempt to connect to the database fails.
     * @throws InvalidEmailException if the email address is invalid.
     * @throws UserAlreadyExistsException if the email address is already registered by another user.
     */
    public function setEmail(string $email): void {
        if($this->email() === $email){
            return;
        }
        if(!filter_var($email, FILTER_VALIDATE_EMAIL)){
            throw new InvalidEmailException('The email address isn\'t valid');
        }
        else if(strlen($email) > 255){
            throw new InvalidEmailException('The email address is too long.');
        }
        else if(User::emailIsRegistered($email)){
            throw new UserAlreadyExistsException('This email address is already in use');
        }
        $bdd = connectToDatabase();
        $request = $bdd->prepare("UPDATE users SET email = :newEmail WHERE id = :id");
        $request->execute(['id' => $this->id(), 'newEmail' => $email]);
        $this->_email = $email;
        if($this instanceof LoggedInUser){
            $this->createLogInCookies($this->stayingLoggedIn());
        }
    }

    /**
     * Changes the name of the user and saves the changes to the database.
     *
     * @param $name The new name to set.
     *
     * @throws PDOException if the attempt to connect to the database fails.
     * @throws InvalidNameException if the name is invalid.
     */
    public function setName(string $name): void{
        if($this->name() === $name){
            return;
        }
        if(strlen($name) === 0){
            throw new InvalidNameException('The user name is empty');
        }
        else if(strlen($name) > 255){
            throw new InvalidNameException('The user name is too long');
        }
        $bdd = connectToDatabase();
        $request = $bdd->prepare("UPDATE users SET name = :newName WHERE id = :id");
        $request->execute(['id' => $this->id(), 'newName' => $name]);
        $this->_name = $name;
    }

    /**
     * Sets the user's profile picture to either Map or Gravatar.
     *
     * @param $type ProfilePicture::Map or ProfilePicture::Gravatar.
     *
     * @throws PDOException if the attempt to connect to the database fails.
     * @throws InvalidEnumValueException if $type is not ProfilePicture::Map or ProfilePicture::Gravatar.
     */
    public function setProfilePicture(int $type): void {
        if($this->_profilePictureType === $type){
            return;
        }
        if(!in_array($type, (new ReflectionClass('ProfilePicture'))->getConstants())){
            throw new InvalidEnumValueException('EditableUser::setProfilePicture: expected ProfilePicture as parameter, got ' . $type);
        }
        $bdd = connectToDatabase();
        $request = $bdd->prepare("UPDATE users SET profilePicture = :type WHERE id = :id");
        $request->execute(['id' => $this->id(), 'type' => $type]);
        $this->_profilePictureType = $type;
    }

    /**
     * Sets who can see the user's statistics.
     *
     * @param $userGroup    A member of the UserGroup enum.
     *
     * @throws PDOException if the attempt to connect to the database fails.
     * @throws InvalidEnumValueException if $userGroup is not a member of the UserGroup enum.
     */
    public function setWhoCanSeeStatistics(int $userGroup): void {
        if($this->whoCanSeeStatistics() === $userGroup){
            return;
        }
        if(!in_array($userGroup, (new ReflectionClass('UserGroup'))->getConstants())){
            throw new InvalidEnumValueException("EditableUser::setWhoCanSeeStatistics: expected UserGroup as parameter, got $profileIsPublic.", ErrorCode::Unspecified);
        }
        $bdd = connectToDatabase();
        $request = $bdd->prepare("UPDATE users SET profileIsPublic = :profileIsPublic WHERE id = :id");
        $request->execute(["id" => $this->id(), "profileIsPublic" => $userGroup]);
        $this->_profileIsPublic = $userGroup;
    }

    /**
     * Deletes the user from the database.
     *
     * @throws PDOException if the attempt to connect to the database fails.
     */
    public function delete(): void {
        $bdd = connectToDatabase();
        $request = $bdd->prepare("DELETE FROM users WHERE id = :id");
        $request->execute(['id' => $this->id()]);
    }

    /**
     * Resets the player's statistics.
     *
     * @throws PDOException if the attempt to connect to the database fails.
     */
    public function resetStatistics(): void {
        $bdd = connectToDatabase();
        $request = $bdd->prepare("UPDATE users SET statistics = '{}' WHERE id = :id");
        $request->execute(['id' => $this->id()]);
        $this->_statistics = new Statistics();
    }
}


class AdminEditableUser extends EditableUser{
    /**
     * Constructs an AdminEditableUser object.
     *
     * @param $user     The ID or email address of the user to construct, see User constructor for details.
     * @param $admin    The logged in admin. This user must have admin rights, otherwise it will cause an assertion error.
     *
     * @throws PDOException if the attempt to connect to the database fails.
     * @throws InvalidEmailException if the email address is invalid (can only be thrown if $user is a string).
     * @throws UserNotFoundException if the email address isn't in the database.
     */
    public function __construct($user, LoggedInUser $admin){
        assert($admin->hasAdminRights());
        parent::__construct($user);
    }
}


class LoggedInUser extends EditableUser{
    /**
     * Constructs a LoggedInUser object.
     *
     * @param $user             The user's email address.
     * @param $password         The user's password or hashed password.
     * @param $passwordIsHashed If true, $password is interpreted as a hashed password, otherwise $password is interpreted as a plain text password.
     *
     * @throws PDOException if the attempt to connect to the database fails.
     * @throws InvalidEmailException if the email address is invalid.
     * @throws UserNotFoundException if the email address isn't in the database.
     * @throws WrongPasswordException if the password is wrong.
     */
    public function __construct(string $user, string $password, bool $passwordIsHashed){
        parent::__construct($user);
        if(!$this->passwordIsCorrect($password, $passwordIsHashed)){
            throw new WrongPasswordException('The password is incorrect');
        }
    }

    /**
     * Checks if it's possible to create a new user with the specified parameters. Does nothing if it's possible, throws an exception if it's not.
     *
     * @param $email            The user's email address.
     * @param $name             The user's name.
     * @param $password         The user's password or hashed password.
     * @param $passwordIsHashed If true, $password is interpreted as a hashed password, otherwise $password is interpreted as a plain text password.
     *
     * @throws PDOException if the attempt to connect to the database fails.
     * @throws InvalidEmailException if the email address is invalid.
     * @throws InvalidNameException if the user name is invalid.
     * @throws InvalidPasswordException if the password is invalid.
     * @throws UserAlreadyExistsException if the email address is already registered.
     */
    public static function checkIfPossibleToCreateNewUser(string $email, string $name, string $password, string $language, bool $passwordIsHashed = false): void {
        if(!filter_var($email, FILTER_VALIDATE_EMAIL)){
            throw new InvalidEmailException('The email address isn\'t valid');
        }
        else if(strlen($email) > 255){
            throw new InvalidEmailException('The email address is too long');
        }
        else if($name === ''){
            throw new InvalidNameException('The user name is missing');
        }
        else if(strlen($name) > 255){
            throw new InvalidNameException('The user name is too long');
        }
        else if(!$passwordIsHashed && strlen($password) < 3){
            throw new InvalidPasswordException('The password is too short');
        }
        else if(!$passwordIsHashed && strlen($password) > 255){
            throw new InvalidPasswordException('The password is too long');
        }
        else if($language !== 'en' && $language != 'fr' && $language != 'sv'){
            throw new Exception('The language must be en, fr or sv');
        }
        if(User::emailIsRegistered($email)){
            throw new UserAlreadyExistsException('This email address is already in use');
        }
    }

    /**
     * Creates a new user in the database.
     *
     * @param $email            The user's email address.
     * @param $name             The user's name.
     * @param $password         The user's password or hashed password.
     * @param $passwordIsHashed If true, $password is interpreted as a hashed password, otherwise $password is interpreted as a plain text password.
     *
     * @return The LoggedInUser object corresponding to the new user.
     *
     * @throws PDOException if the attempt to connect to the database fails.
     * @throws InvalidEmailException if the email address is invalid.
     * @throws InvalidNameException if the user name is invalid.
     * @throws InvalidPasswordException if the password is invalid.
     * @throws UserAlreadyExistsException if the email address is already registered.
     */
    public static function createNewUser(string $email, string $name, string $password, string $language, bool $passwordIsHashed = false): LoggedInUser {
        LoggedInUser::checkIfPossibleToCreateNewUser($email, $name, $password, LANGUAGE, $passwordIsHashed);
        $bdd = connectToDatabase();
        if(!$passwordIsHashed){
            $password = password_hash($password, PASSWORD_DEFAULT);
        }
        $request = $bdd->prepare("INSERT INTO users(email, name, password, language, statistics, contacts) VALUES(:email, :name, :password, :language, '{}', '[]')");
        $request->execute(["email" => $email, "name" => $name, "password" => $password, "language" => $language]);
        $request->closeCursor();
        return new LoggedInUser($email, $password, true);
    }


    /**
     * Static function for getting the logged in user from the cookies or session variables
     *
     * @param $httpResponseOnError  If $httpResponseOnError is 0, the function returns null when no user is logged in, otherwise it stops the script and sends the specified HTTP response code.
     *
     * @return The logged in user, or null if no user is logged in and $httpResponseOnError is 0.
     */
    public static function userFromCookies(int $httpResponseOnError = 0): ?LoggedInUser {
        if($_SERVER['REQUEST_URI'] === '/users/logout.php'){
            if($httpResponseOnError === 0){
                return null;
            }
            else{
                showHttpError($httpResponseOnError);
            }
        }

        $email = null;
        $password = null;
        if(($_SESSION['email'] ?? '') !== ''){
            $email = $_SESSION['email'];
        }
        else if(($_COOKIE['email'] ?? '') !== ''){
            $email = $_COOKIE['email'];
        }
        else if(($_POST['email'] ?? '') !== ''){
            //Workaround for https://issuetracker.google.com/issues/354305979
            $email = $_POST['email'];
        }
        if(($_SESSION['password'] ?? '') !== ''){
            $password = $_SESSION['password'];
        }
        else if(($_COOKIE['password'] ?? '') !== ''){
            $password = $_COOKIE['password'];
        }
        else if(($_POST['password'] ?? '') !== ''){
            //Workaround for https://issuetracker.google.com/issues/354305979
            $password = $_POST['password'];
        }

        if($email === null || $password === null){
            LoggedInUser::logOut();
            if($httpResponseOnError === 0){
                return null;
            }
            else{
                showHttpError($httpResponseOnError);
            }
        }

        //For some reason Volley surrounds cookies with quotes, so unquote it if that's the case
        if(json_decode($email) !== null){
            $email = json_decode($email);
            $password = json_decode($password) ?? $password;
        }

        try{
            $result = new LoggedInUser($email, $password, true);
        }
        catch(PDOException $e){
            if($httpResponseOnError === 0){
                return null;
            }
            else{
                showHttpError(503, 'Database error: ' . $e->getMessage());
            }
        }
        catch(InvalidEmailException | UserNotFoundException | WrongPasswordException $e){
            if($httpResponseOnError === 0){
                return null;
            }
            else{
                showHttpError($httpResponseOnError);
            }
        }
        $result->createLogInCookies(isset($_SESSION['stayLoggedIn']) || (isset($_COOKIE['stayLoggedIn']) && $_COOKIE['stayLoggedIn'] === 'true'));
        return $result;
    }

    /**
     * Static function, checks if a user is staying logged in.
     *
     * @return True if a user is logged in and staying logged in, false if a user is logged in temporarily or not logged in at all.
     */
    public static function stayingLoggedIn(): bool {
        return isset($_COOKIE['email']) && isset($_COOKIE['password']);
    }

    /**
     * Creates login cookies for the current LoggedInUser.
     *
     * @param $stayLoggedIn True if the user wants to stay logged in, false otherwise.
     */
    public function createLogInCookies(bool $stayLoggedIn): void {
        $_SESSION['email'] = $this->email();
        $_SESSION['password'] = $this->password();
        if($stayLoggedIn){
            setCookie('stayLoggedIn', 'true', cookieOptions(true));
            $_COOKIE['stayLoggedIn'] = 'true';
            setCookie('email', $this->email(), cookieOptions(true));
            $_COOKIE['email'] = $this->email();
            setCookie('password', $this->password(), cookieOptions(true));
            $_COOKIE['password'] = $this->password();
        }
    }

    /**
     * Logs the user out (only deletes the cookies, does not redirect to logout.php).
     */
    public static function logOut(): void {
        unset($_SESSION['email']);
        unset($_SESSION['password']);
        unset($_SESSION['stayLoggedIn']);
        if(isset($_COOKIE['email'])){
            setCookie('email', '', cookieOptions(true, time() - 3600));
            unset($_COOKIE['email']);
        }
        if(isset($_COOKIE['password'])){
            setCookie('password', '', cookieOptions(true, time() - 3600));
            unset($_COOKIE['password']);
        }
        if(isset($_COOKIE['stayLoggedIn'])){
            setCookie('stayLoggedIn', '', cookieOptions(true, time() - 3600));
            unset($_COOKIE['stayLoggedIn']);
        }
    }

    /**
     * Returns the hashed version of the user's password that is in the database.
     *
     * @return The hashed password.
     */
    public function password(): string {
        return $this->_password;
    }

    /**
     * Changes the user's password and saves the changes to the database.
     *
     * @param $password The new password.
     *
     * @throws PDOException if the attempt to connect to the database fails.
     * @throws InvalidPasswordException if the password is invalid.
     */
    public function setPassword(string $password): void {
        if(strlen($password) < 3){
            throw new InvalidPasswordException('The password is too short');
        }
        else if(strlen($password) > 255){
            throw new InvalidPasswordException('The password is too long');
        }
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $bdd = connectToDatabase();
        $request = $bdd->prepare("UPDATE users SET password = :password WHERE id = :id");
        $request->execute(['id' => $this->id(), 'password' => $hashedPassword]);
        $this->_password = $hashedPassword;
        $this->createLogInCookies($this->stayingLoggedIn());
    }

    /**
     * Changes the user's preferred language.
     *
     * @param $language The two-letter code for the language to set.
     *
     * @throws PDOException if the attempt to connect to the database fails.
     * @throws InvalidEnumValueException if the language is unknown.
     */
    public function setLanguage(string $language): void {
        if($this->language() === $language){
            return;
        }
        if($language !== 'en' && $language !== 'fr' && $language !== 'sv'){
            throw new InvalidEnumValueException('Unknown language: ' . $language);
        }
        $bdd = connectToDatabase();
        $request = $bdd->prepare("UPDATE users SET language = :language WHERE id = :id");
        $request->execute(['id' => $this->id(), 'language' => $language]);
        $this->_language = $language;
    }

    /**
     * Changes the user's preferred game variant.
     *
     * @param $language GameVariant::Time or GameVariant::Money.
     *
     * @throws PDOException if the attempt to connect to the database fails.
     * @throws InvalidEnumValueException if $variant is not a member of the GameVariant enum.
     */
    public function setVariant(int $variant): void {
        if($this->variant() === $variant){
            return;
        }
        if(!in_array($variant, (new ReflectionClass('GameVariant'))->getConstants())){
            throw new InvalidEnumValueException('LoggedInUser::setVariant: expected GameVariant as parameter, got ' . $variant);
        }
        $bdd = connectToDatabase();
        $request = $bdd->prepare("UPDATE users SET variant = :variant WHERE id = :id");
        $request->execute(['id' => $this->id(), 'variant' => $variant]);
        $this->_variant = $variant;
    }

    /**
     * Adds the given user to the logged in user's contacts and saves the changes to the database.
     *
     * @param $contact  The user to add to the contacts.
     *
     * @return True if the user was successfully added to the contacts, false if the user is already in the contacts.
     *
     * @throws PDOException if the attempt to connect to the database fails.
     */
    public function addContact(User $contact): bool {
        if(!$this->hasContact($contact)){
            $this->_contacts[] = $contact->id();
            $bdd = connectToDatabase();
            $request = $bdd->prepare("UPDATE users SET contacts = :contacts WHERE id = :id");
            $request->execute(['id' => $this->id(), 'contacts' => json_encode($this->_contacts)]);
            return true;
        }
        return false;
    }

    /**
     * Removes the given user from the logged in user's contacts and saves the changes to the database.
     *
     * @param $contact  The user to remove from the contacts.
     *
     * @return True if the user was successfully removed from the contacts, false if the user wasn't in the contacts to begin with.
     *
     * @throws PDOException if the attempt to connect to the database fails.
     */
    public function removeContact(User $contact): bool{
        if($this->hasContact($contact)){
            array_splice($this->_contacts, array_search($contact->id(), $this->_contacts), 1);
            $bdd = connectToDatabase();
            $request = $bdd->prepare("UPDATE users SET contacts = :contacts WHERE id = :id");
            $request->execute(['id' => $this->id(), 'contacts' => json_encode($this->_contacts)]);
            return true;
        }
        return false;
    }

    /**
     * Updates all necessary statistics when the user is finished with a game and saves them to the database.
     *
     * @param $won          True if the user won this game, false otherwise.
     * @param $level        The level of the place the user was playing in as a string.
     * @param $numberOfMaps The number of maps the user collected during this game (can be less than the number of maps in the place if they lost).
     * @param $remainingTime  The amount of seconds the user had left when they won, zero if not playing with time.
     * @param $money        The amount of money the user had at the end of the game, zero if not playing with money.
     * @param $opponentId   The ID of the opponent if the game was a two-player game, zero if it was a one-player game.
     *
     * @throws PDOException if the attempt to connect to the database fails.
     * @throws InvalidEnumValueException if $level isn't "easy", "medium" or "difficult".
     * @throws UserNotFoundException if $opponentId does not correspond to any user.
     */
    public function updateStatistics(bool $won, string $level, int $numberOfMaps, int $remainingTime, int $remainingMoney, int $opponentId): void {
        if(!in_array($level, ['easy', 'medium', 'difficult'])){
            throw new InvalidEnumValueException('Unknown level ' . $level);
        }

        if($opponentId === 0){
            $opponentHasHigherScore = null;
        }
        else{
            $opponentHasHigherScore = (new User($opponentId))->_statistics->score() > $this->_statistics->score();
        }

        $this->_statistics->updateStatistics($won, $level, $numberOfMaps, $remainingTime, $remainingMoney, $opponentHasHigherScore);
        $this->_statistics->updateStatistics($won, 'all', $numberOfMaps, $remainingTime, $remainingMoney, $opponentHasHigherScore);

        $bdd = connectToDatabase();
        $request = $bdd->prepare("UPDATE users SET statistics = :statistics WHERE id = :id");
        $request->execute(['id' => $this->id(), 'statistics' => $this->_statistics->toJSON()]);
    }
}
<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/error-handler.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/html.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/user.php');

//Find which user to show the profile of
$loggedInUser = LoggedInUser::userFromCookies();
$user = User::userFromGetParams($loggedInUser);
if($user === null){
    showHttpError(401);
}

//Process POST data
$newName = $_POST['userName'] ?? $user->name();
$changeNameFailed = false;
$newEmail = $_POST['email'] ?? $user->email();
$newConfirmEmail = $_POST['confirmEmail'] ?? $user->email();
$newPassword = $_POST['password'] ?? '';
$changeEmailOrPasswordFailed = false;
$emailAlreadyRegistered = false;
$passwordIsInvalid = false;
$passwordsDontMatch = false;
$passwordIsWrong = false;
try{
    if($loggedInUser !== null && isset($_POST['addToContacts'])){
        $loggedInUser->addContact($user);
    }
    if($loggedInUser !== null && isset($_POST['removeFromContacts'])){
        $loggedInUser->removeContact($user);
    }
    if(($user->equals($loggedInUser) || ($loggedInUser !== null && $loggedInUser->hasAdminRights())) && isset($_POST['resetStatistics'])){
        $user->resetStatistics();
    }
    if(isset($_POST['changeUserName'])){
        if($user instanceof EditableUser){
            $user->setName($newName);
        }
        else{
            showHttpError(401);
        }
    }
    if(isset($_POST['changeProfilePicture'])){
        if($user instanceof EditableUser){
            $user->setProfilePicture($_POST['profilePicture'] ?? 2);
        }
        else{
            showHttpError(401);
        }
    }
    if(isset($_POST['changeWhoCanSeeStatistics'])){
        if($user instanceof EditableUser){
            $user->setWhoCanSeeStatistics($_POST['whoCanSeeStatistics'] ?? 2);
        }
        else{
            showHttpError(401);
        }
    }
    if(isset($_POST['email']) && isset($_POST['confirmEmail'])){
        if($user instanceof EditableUser){
            if(!$loggedInUser->passwordIsCorrect($_POST['currentPassword'] ?? '')){
                $passwordIsWrong = true;
                $changeEmailOrPasswordFailed = true;
            }
            else if($newEmail !== $newConfirmEmail){
                $changeEmailOrPasswordFailed = true;
            }
            else{
                $user->setEmail($newEmail);
            }
        }
        else{
            showHttpError(401);
        }
    }
    if($newPassword !== ''){
        if($user instanceof EditableUser){
            if(!$loggedInUser->passwordIsCorrect($_POST['currentPassword'] ?? '')){
                $passwordIsWrong = true;
                $changeEmailOrPasswordFailed = true;
            }
            else if($newPassword !== ($_POST['confirmPassword'] ?? '')){
                $passwordsDontMatch = true;
                $changeEmailOrPasswordFailed = true;
            }
            else{
                $user->setPassword($newPassword);
            }
        }
        else{
            showHttpError(401);
        }
    }
}
catch(InvalidNameException $e){
    $changeNameFailed = true;
}
catch(InvalidEmailException $e){
    $changeEmailOrPasswordFailed = true;
}
catch(UserAlreadyExistsException $e){
    $emailAlreadyRegistered = true;
    $changeEmailOrPasswordFailed = true;
}
catch(InvalidPasswordException $e){
    $passwordIsInvalid = true;
    $changeEmailOrPasswordFailed = true;
}
catch(InvalidEnumValueException $e){
    showHttpError(400);
}
catch(PDOException $e){
    showHttpError(503, 'Database error: ' . $e->getMessage());
}

$statistics = $user->statistics();
?>

<!DOCTYPE html>
<html lang="<?= LANGUAGE ?>">
<head>
    <?php
        insertMetaTags(
            sprintf(translator()->trans('%s\'s Map Collector profile'), htmlspecialchars($user->name())),
            [translator()->trans('profile'), translator()->trans('statistics'), htmlspecialchars($user->name())]
        );
    ?>
    <title>Map Collector - <?= $user->equals($loggedInUser) ? translator()->trans('Your Account') : sprintf(translator()->trans('User %s'), htmlspecialchars($user->name())) ?></title>

    <script type="module" src="<?= STATIC_DOMAIN ?>/js/forms/main.js" async crossorigin></script>
    <link rel="stylesheet" type="text/css" href="<?= STATIC_DOMAIN ?>/css/forms.css"/>

    <script type="module" src="<?= STATIC_DOMAIN ?>/js/header/main.js" async crossorigin></script>
    <link rel="stylesheet" type="text/css" href="<?= STATIC_DOMAIN ?>/css/general/main.css"/>
</head>
<body>
    <?php insertHeader(); ?>
    <section>
        <?php if($user->equals($loggedInUser) && isset($_POST['resetStatistics'])){ ?>
            <p class="formToolTip correct"><?= translator()->trans('Your statistics have been reset.') ?></p>
        <?php } ?>
        <?php if(isset($_POST['changeUserName'])){ ?>
            <?php if($changeNameFailed){ ?>
                <p class="formToolTip incorrect"><?= translator()->trans('Your user name could not be changed because you did not fill out the form correctly.') . ' ' . sprintf(translator()->trans('If you think this is a bug, please <a href="%s">contact us</a>.'), 'https://github.com/GustavLindberg99/MapCollector/issues') ?></p>
            <?php } else { ?>
                <p class="formToolTip correct"><?= translator()->trans('Your user name has been changed.') ?></p>
            <?php } ?>
        <?php } ?>
        <?php if(isset($_POST['changeProfilePicture'])){ ?>
            <p class="formToolTip correct"><?= translator()->trans('Your profile picture has been changed.') ?></p>
        <?php } ?>
        <?php if(isset($_POST['changeWhoCanSeeStatistics'])){ ?>
            <p class="formToolTip correct"><?= translator()->trans('Who can see your statistics has been changed.') ?></p>
        <?php } ?>
        <?php if(isset($_POST['changeEmailOrPassword'])){ ?>
            <?php if($changeEmailOrPasswordFailed){ ?>
                <p class="formToolTip incorrect"><?= translator()->trans('Your account details could not be changed because you did not fill out the form correctly.') . ' ' . sprintf(translator()->trans('If you think this is a bug, please <a href="%s">contact us</a>.'), 'https://github.com/GustavLindberg99/MapCollector/issues') ?></p>
            <?php } else { ?>
                <p class="formToolTip correct"><?= translator()->trans('Your account details have been changed.') ?></p>
            <?php } ?>
        <?php } ?>

        <!-- User name -->
        <h1 id="username" <?= $changeNameFailed ? 'style="display:none"' : '' ?>>
            <span><?= htmlspecialchars($user->name()) ?></span>
            <?php if($user instanceof EditableUser){ ?>
                <img id="changeUserNameButton" role="button" src="<?= STATIC_DOMAIN ?>/images/edit.svg" class="inline" title="<?= translator()->trans('Edit') ?>" alt="<?= translator()->trans('Change user name') ?>"/>
            <?php } ?>
            <?php if($loggedInUser !== null && !$user->equals($loggedInUser)){ ?>
                <form method="post" action="">
                    <?php if(in_array($user->id(), $loggedInUser->contactIds())){ ?>
                        <input type="submit" name="removeFromContacts" value="<?= translator()->trans('Remove from contacts') ?>"/>
                    <?php } else{ ?>
                        <input type="submit" name="addToContacts" value="<?= translator()->trans('Add to contacts') ?>"/>
                    <?php } ?>
                </form>
            <?php } ?>
        </h1>
        <?php if($user instanceof EditableUser){ ?>
            <form id="changeUserNameForm" method="post" action="" <?= $changeNameFailed ? '' : 'style="display:none"' ?>>
                <input type="text" name="userName" value="<?= htmlspecialchars($user->name()) ?>" required/>
                <input type="submit" name="changeUserName" value="<?= translator()->trans('OK') ?>"/>
                <input type="reset" value="<?= translator()->trans('Cancel') ?>"/>
                <span class="formToolTip"><?= translator()->trans('Please enter between {min} and # characters.', ['count' => 255, 'min' => 1]) ?></span>
            </form>
        <?php } ?>
        <div id="profile">
            <!-- Profile picture -->
            <div id="profilePicture">
                <img src="/users/profilepicture.php?uid=<?= $user->id() ?>" alt="<?= translator()->trans('Profile picture') ?>" width="128" height="128"/><br/>
                <?php if($user instanceof EditableUser){ ?>
                    <button id="changeProfilePictureButton"><?= translator()->trans('Change profile picture') ?></button>
                    <form id="changeProfilePictureForm" method="post" action="" style="display:none">
                        <?php foreach([
                            ProfilePicture::Map => 'Map',
                            ProfilePicture::Gravatar => 'Gravatar <a href="https://gravatar.com/profile/avatars">' . translator()->trans("Change") . '</a>'
                        ] as $profilePictureType => $profilePictureName){ ?>
                            <p>
                                <label>
                                    <input type="radio" name="profilePicture" value="<?= $profilePictureType ?>" <?= ($user->profilePictureType() == $profilePictureType) ? 'checked' : '' ?>/>
                                    <img src="<?= $user->profilePicture($profilePictureType) ?>" width="32" height="32" style="vertical-align:middle"/>
                                    <?= $profilePictureName ?>
                                </label>
                            </p>
                        <?php } ?>
                        <p>
                            <input type="submit" name="changeProfilePicture" value="<?= translator()->trans('OK') ?>"/>
                            <input type="reset" value="<?= translator()->trans('Cancel') ?>"/>
                        </p>
                    </form>
                <?php } ?>
            </div>

            <div>
                <!-- Statistics -->
                <?php if($user->profileVisibleTo($loggedInUser)){ ?>
                    <h2><?= translator()->trans('Statistics') ?></h2>
                    <?php if($user instanceof EditableUser){ ?>
                        <form method="post" action="">
                            <label>
                                <?= translator()->trans('Who can see your statistics') ?>:
                                <select name="whoCanSeeStatistics">
                                    <?php foreach([
                                        UserGroup::Me => translator()->trans('Only me'),
                                        UserGroup::Contacts => translator()->trans('Me and my contacts'),
                                        UserGroup::Everybody => translator()->trans('Everybody')
                                    ] as $userGroup => $userGroupName){ ?>
                                        <option <?= $user->whoCanSeeStatistics() == $userGroup ? "selected" : "" ?> value="<?= $userGroup ?>"><?= $userGroupName ?></option>
                                    <?php } ?>
                                </select>
                            </label>
                            <input type="submit" name="changeWhoCanSeeStatistics" value="<?= translator()->trans('OK') ?>"/>
                        </form>
                    <?php } ?>
                    <p><?= translator()->trans('Score') . ': ' . $statistics->score() ?></p>
                    <p><?= translator()->trans('Number of collected maps') . ': ' . $statistics->numberOfMaps() ?></p>
                    <p><?= translator()->trans('Winning rate') . ': ' . intval(100 * $statistics->winningRate()) ?>%</p>
                    <p>
                        <?php
                        echo translator()->trans('Completed challenges:');
                        if($statistics->numberOfCompletedChallenges(Level::All) > 0){
                            foreach([Level::Easy, Level::Medium, Level::Difficult] as $level){
                                if($statistics->numberOfCompletedChallenges($level) > 0){
                                    ?>
                                    <span title="<?= translator()->trans('# {level} challenges completed', ['count' => $statistics->numberOfCompletedChallenges($level), 'level' => levelToString($level, true)]) ?>">
                                        <img src="<?= STATIC_DOMAIN ?>/images/<?= levelToString($level, false) ?>badge.svg" class="inline" alt="<?= levelToString($level, true) . ' ' . translator()->trans('challenge') ?>"/>
                                        <?= $statistics->numberOfCompletedChallenges($level) ?>
                                    </span>
                                    <?php
                                }
                            }
                        }
                        else{
                            echo ' ' . translator()->trans('none');
                        }
                        ?>
                        (<a href="<?= localizedUrl('/users/challenges.php?uid=' . $user->id()) ?>"><?= translator()->trans('View details') ?></a>)
                    </p>
                <?php } ?>

                <!-- Account info -->
                <?php if($user instanceof EditableUser){ ?>
                    <h2><?= translator()->trans('Account') ?></h2>
                    <p id="email">
                        <?= translator()->trans('Email address:') ?>
                        <span><?= htmlspecialchars($user->email()) ?></span>
                    </p>
                    <div id="accountButtons">
                        <button id="changeEmailOrPasswordButton"><?= translator()->trans('Change email or password') ?></button>
                        <?php if($user->equals($loggedInUser)){ ?>
                            <form method="get" action="<?= localizedUrl("/users/delete.php") ?>" style="display:inline">
                                <input type="submit" value="<?= translator()->trans('Delete account') ?>"/>
                            </form>
                        <?php } ?>
                        <form method="post" action="" style="display:inline">
                            <input type="submit" name="resetStatistics" value="<?= translator()->trans('Reset statistics') ?>"/>
                        </form>
                    </div>
                    <form id="changeEmailOrPasswordForm" method="post" action="" <?= $changeEmailOrPasswordFailed ? '' : 'style="display:none"' ?>>
                        <label>
                            <?= translator()->trans('Email') ?>:
                            <input type="email" name="email" value="<?= htmlspecialchars($newEmail) ?>" required/>
                            <span class="formToolTip"><?= translator()->trans('Please enter a valid e-mail address.') ?></span>
                        </label><br/>
                        <label>
                            <?= translator()->trans('Confirm email') ?>:
                            <input type="email" name="confirmEmail" value="<?= htmlspecialchars($newConfirmEmail) ?>" required/>
                            <span class="formToolTip"><?= translator()->trans('The e-mail addresses don\'t match') ?></span>
                            <?php if($emailAlreadyRegistered){ ?>
                                <span id="alreadyInUse" class="formToolTip incorrect"><?= translator()->trans('This e-mail address is already in use.') ?> <a href="<?= localizedUrl('/users/login.php') ?>"><?= translator()->trans('Click here to log in.') ?></a></span>
                            <?php } ?>
                        </label><br/>
                        <label>
                            <?= translator()->trans('New password') ?>:
                            <input type="password" name="password" autocomplete="new-password"/>
                            <span class="formToolTip<?= $passwordIsInvalid ? ' incorrect' : '' ?>"><?= translator()->trans('Please enter between {min} and # characters.', ['count' => 255, 'min' => 3]) ?></span>
                        </label><br/>
                        <label>
                            <?= translator()->trans('Confirm password') ?>:
                            <input type="password" name="confirmPassword" autocomplete="new-password"/>
                            <span class="formToolTip<?= $passwordsDontMatch ? ' incorrect' : '' ?>"><?= translator()->trans('The passwords don\'t match.') ?></span>
                        </label><br/>
                        <label>
                            <?= translator()->trans('Your current password') ?>:
                            <input type="password" name="currentPassword" required/>
                            <?php if($passwordIsWrong){ ?>
                                <span class="formToolTip incorrect"><?= sprintf(translator()->trans('This password is incorrect. If you forgot your password, you can reset it by <a href="%s">contacting us</a>.'), 'mailto:95423695+GustavLindberg99@users.noreply.github.com') ?></span>
                            <?php } ?>
                        </label><br/>
                        <input type="submit" name="changeEmailOrPassword" value="<?= translator()->trans('OK') ?>"/>
                        <input type="reset" value="<?= translator()->trans('Cancel') ?>"/>
                    </form>
                <?php } ?>

                <!-- Admin -->
                <?php if($loggedInUser !== null && $loggedInUser->hasAdminRights()){ ?>
                    <h2><?= translator()->trans('Admin') ?></h2>
                    <p>
                        <?php if(IS_LOCALHOST){ ?>
                            <a href="http://localhost/phpmyadmin/">PhpMyAdmin</a><br/>
                        <?php } else{ ?>
                            <a href="/ftp/"><?= translator()->trans('File Manager') ?></a><br/>
                            <a href="/pma/">PhpMyAdmin</a><br/>
                            <a href="https://newserv.freewha.com/"><?= translator()->trans('Control Panel') ?></a><br/>
                            <a href="https://search.google.com/search-console/?resource_id=https%3A%2F%2F<?= htmlspecialchars(urlencode($_SERVER['HTTP_HOST'])) ?>">Google Search Console</a><br/>
                            <a href="https://www.bing.com/webmaster/home/dashboard?url=https%3A%2F%2F<?= htmlspecialchars(urlencode($_SERVER['HTTP_HOST'])) ?>">Bing Webmaster Tools</a><br/>
                            <a href="https://play.google.com/console/u/0/developers/6270415371439825281/app/4972047901472652455/app-dashboard">Google Play Console</a><br/>
                            <a href="https://www.google.com/recaptcha/admin#site/343332115?setup"><?= translator()->trans('Captcha settings') ?></a>
                        <?php } ?>
                    </p>
                <?php } ?>
            </div>
        </div>
    </section>
    <?php insertFooter(); ?>
</body>
</html>
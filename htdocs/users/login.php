<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/error-handler.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/html.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/user.php');

//Show a 503 error directly if the database isn't working
try{
    connectToDatabase();
}
catch(PDOException $e){
    showHttpError(503, 'Database error: ' . $e->getMessage());
}

$formSubmitted = $_SERVER['REQUEST_METHOD'] === 'POST';
$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';
$stayLoggedIn = isset($_POST['stayLoggedIn']);
$emailNotRegistered = false;
$passwordIsWrong = false;

if($formSubmitted){
    try{
        $user = new LoggedInUser($email, $password, false);
        $user->createLogInCookies($stayLoggedIn);
        redirect(303, $_GET['returnurl'] ?? '/users/profile.php');
    }
    catch(InvalidEmailException $e){
        //Do nothing, Javascript will take care of this
    }
    catch(UserNotFoundException $e){
        $emailNotRegistered = true;
    }
    catch(WrongPasswordException $e){
        $passwordIsWrong = true;
    }
    catch(PDOException $e){
        showHttpError(503, 'Database error: ' . $e->getMessage());
    }
}
?>

<!DOCTYPE html>
<html lang="<?= LANGUAGE ?>">
<head>
    <?php
        insertMetaTags(
            QObject::tr('Log in to Map Collector'),
            [QObject::tr('log in')]
        );
    ?>

    <title><?= APPNAME . ' - ' . QObject::htr('Log in') ?></title>

    <script type="module" src="<?= STATIC_DOMAIN ?>/js/forms/main.js" async crossorigin></script>
    <link rel="stylesheet" type="text/css" href="<?= STATIC_DOMAIN ?>/css/forms.css"/>

    <script type="module" src="<?= STATIC_DOMAIN ?>/js/header/main.js" async crossorigin></script>
    <link rel="stylesheet" type="text/css" href="<?= STATIC_DOMAIN ?>/css/general/main.css"/>
</head>
<body>
    <?php insertHeader(); ?>
    <section>
        <h1>Map Collector - <?= QObject::htr('Log in') ?></h1>
        <form method="post" action="">
            <?php if($formSubmitted){ ?>
                <p class="formToolTip incorrect"><?= QObject::htr('You could not be logged in because you did not fill out the form correctly.') . ' ' . sprintf(QObject::tr('If you think this is a bug, please <a href="%s">contact us</a>.'), 'https://github.com/GustavLindberg99/MapCollector/issues') ?></p>
            <?php } ?>
            <label>
                <?= QObject::htr('Email') ?>:
                <input type="email" name="email" value="<?= htmlspecialchars($email) ?>" required/>
                <span class="formToolTip"><?= QObject::htr('Please enter a valid e-mail address.') ?></span>
                <?php if($emailNotRegistered){ ?>
                    <span id="alreadyInUse" class="formToolTip incorrect"><?= QObject::htr('This e-mail address is not registered.') ?> <a href="<?= localizedUrl('/users/signup.php') ?>"><?= QObject::htr('Click here to create an account.') ?></a> <?= QObject::htr('If you just created your account, please wait a few minutes and try again.') ?></span>
                <?php } ?>
            </label><br/>
            <label>
                <?= QObject::htr('Password') ?>:
                <input type="password" name="password" required/>
                <span class="formToolTip"><?= QObject::htr('Please enter your password.') ?></span>
                <?php if($passwordIsWrong){ ?>
                    <span id="wrongPassword" class="formToolTip incorrect"><?= sprintf(QObject::tr('This password is incorrect. If you forgot your password, you can reset it by <a href="%s">contacting us</a>.'), 'mailto:95423695+GustavLindberg99@users.noreply.github.com') ?></span>
                <?php } ?>
            </label><br/>
            <label>
                <input type="checkbox" name="stayLoggedIn" <?= $stayLoggedIn ? "checked" : "" ?>/>
                <?= QObject::htr('Stay logged in') ?>
            </label><br/>
            <input type="submit" value="<?= QObject::htr('Log in') ?>"/>
        </form>
        <p><a href="/users/signup.php"><?= QObject::htr('Create a free account') ?></a></p>
    </section>
    <?php insertFooter(); ?>
</body>
</html>
<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/error-handler.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/captcha.php');
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
$name = $_POST['userName'] ?? '';
$password = $_POST['password'] ?? '';
$confirmPassword = $_POST['confirmPassword'] ?? '';
$captchaFailed = $formSubmitted && !verifyCaptcha();
$licenseNotAccepted = $formSubmitted && !isset($_POST['license']);
$emailAlreadyRegistered = false;
$passwordIsInvalid = false;
$passwordsDontMatch = $password !== $confirmPassword;

if($formSubmitted && !$captchaFailed && $password === $confirmPassword && !$licenseNotAccepted){
    try{
        $user = LoggedInUser::createNewUser($email, $name, $password, LANGUAGE);
        $user->createLogInCookies(isset($_POST['stayLoggedIn']));
        redirect(303, $_GET['returnurl'] ?? '/users/profile.php');
    }
    catch(InvalidEmailException | InvalidNameException $e){
        //Do nothing, Javascript will take care of this
    }
    catch(InvalidPasswordException $e){
        $passwordIsInvalid = true;
    }
    catch(UserAlreadyExistsException $e){
        $emailAlreadyRegistered = true;
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
            QObject::tr('Sign up to Map Collector'),
            [QObject::tr('sign up'), QObject::tr('create account')]
        );
    ?>

    <title><?= APPNAME . ' - ' . QObject::htr('Sign up') ?></title>

    <script type="text/javascript" src="https://www.google.com/recaptcha/api.js?hl=<?= LANGUAGE ?>" async defer></script>

    <script type="module" src="<?= STATIC_DOMAIN ?>/js/forms/main.js" async crossorigin></script>
    <link rel="stylesheet" type="text/css" href="<?= STATIC_DOMAIN ?>/css/forms.css"/>

    <script type="module" src="<?= STATIC_DOMAIN ?>/js/header/main.js" async crossorigin></script>
    <link rel="stylesheet" type="text/css" href="<?= STATIC_DOMAIN ?>/css/general/main.css"/>
</head>
<body>
    <?php insertHeader(); ?>
    <section>
        <h1><?= APPNAME . ' - ' . QObject::tr('Sign up') ?></h1>
        <form method="post" action="">
            <?php if($formSubmitted){ ?>
                <p class="formToolTip incorrect"><?= QObject::htr('Your account could not be created because you did not fill out the form correctly.') . ' ' . sprintf(QObject::tr('If you think this is a bug, please <a href="%s">contact us</a>.'), 'https://github.com/GustavLindberg99/MapCollector/issues') ?></p>
            <?php } ?>
            <label>
                <?= QObject::htr('User name') ?>:
                <input type="text" name="userName" value="<?= htmlspecialchars($name) ?>" required/>
                <span class="formToolTip"><?= sprintf(QObject::htr('Please enter between %d and %n characters.', null, 255), 1) ?></span>
            </label><br/>
            <label>
                <?= QObject::htr('Email') ?>:
                <input type="email" name="email" value="<?= htmlspecialchars($email) ?>" required/>
                <span class="formToolTip"><?= QObject::htr('Please enter a valid e-mail address.') ?></span>
                <?php if($emailAlreadyRegistered){ ?>
                    <span id="alreadyInUse" class="formToolTip incorrect"><?= QObject::htr('This e-mail address is already in use.') ?> <a href="<?= localizedUrl('/users/login.php') ?>"><?= QObject::htr('Click here to log in.') ?></a></span>
                <?php } ?>
            </label><br/>
            <label>
                <?= QObject::htr('Password') ?>:
                <input type="password" name="password" autocomplete="new-password" required/>
                <span class="formToolTip<?= $passwordIsInvalid ? ' incorrect' : '' ?>"><?= sprintf(QObject::htr('Please enter between %d and %n characters.', null, 255), 3) ?></span>
            </label><br/>
            <label>
                <?= QObject::htr('Confirm password') ?>:
                <input type="password" name="confirmPassword" autocomplete="new-password" required/>
                <span class="formToolTip<?= $passwordsDontMatch ? ' incorrect' : '' ?>"><?= QObject::htr('The passwords don\'t match.') ?></span>
            </label><br/>
            <label>
                <input type="checkbox" name="stayLoggedIn"/>
                <?= QObject::htr('Stay logged in') ?>
            </label><br/>
            <label>
                <input type="checkbox" name="license" required/>
                <?= sprintf(QObject::tr('I accept the <a href="%s">terms of use</a> and the <a href="%s">privacy policy</a>'), 'https://github.com/GustavLindberg99/MapCollector/blob/master/LICENSE', 'https://github.com/GustavLindberg99/MapCollector/blob/master/PRIVACY') ?>
                <?php if($licenseNotAccepted){ ?>
                    <span class="formToolTip incorrect"><?= QObject::htr('You need to accept the terms of use and the privacy policy.') ?></span>
                <?php } ?>
            </label><br/>
            <?php if($captchaFailed){ ?>
                <p class="formToolTip incorrect"><?= QObject::htr('Please confirm that you are not a robot.') ?></p>
            <?php } ?>
            <div class="g-recaptcha" data-sitekey="<?= SITEKEY ?>"></div>
            <input type="submit" value="<?= QObject::htr('Create account') ?>"/>
        </form>
        <p><?= QObject::htr('Already have an account?') ?> <a href="<?= localizedUrl('/users/login.php') ?>"><?= QObject::htr('Log in') ?>.</a></p>
    </section>
    <?php insertFooter(); ?>
</body>
</html>
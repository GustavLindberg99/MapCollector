<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/error-handler.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/captcha.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/html.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/user.php');

$loggedInUser = LoggedInUser::userFromCookies(401);

$captchaFailed = false;
$passwordIsWrong = false;
$deleted = false;
if(isset($_POST['delete'])){
    if(!verifyCaptcha()){
        $captchaFailed = true;
    }
    else if(!$loggedInUser->passwordIsCorrect($_POST['password'] ?? '')){
        $passwordIsWrong = true;
    }
    else try{
        $loggedInUser->delete();
        $deleted = true;
    }
    catch(PDOException $e){
        showHttpError(503, 'Database error: ' . $e->getMessage());
    }
}
?>

<!DOCTYPE html>
<html lang="<?= LANGUAGE ?>">
<head>
    <?php insertMetaTags('', []); ?>
    <title>Map Collector - <?= QObject::htr('Delete account') ?></title>

    <script type="text/javascript" src="https://www.google.com/recaptcha/api.js?hl=<?= LANGUAGE ?>" async defer></script>

    <script type="module" src="<?= STATIC_DOMAIN ?>/js/forms/main.js" async crossorigin></script>
    <link rel="stylesheet" type="text/css" href="<?= STATIC_DOMAIN ?>/css/forms.css"/>

    <script type="module" src="<?= STATIC_DOMAIN ?>/js/header/main.js" async crossorigin></script>
    <link rel="stylesheet" type="text/css" href="<?= STATIC_DOMAIN ?>/css/general/main.css"/>
</head>
<body>
    <?php insertHeader(); ?>
    <article>
        <h1><?= QObject::htr('Delete account') ?></h1>
        <?php if($deleted) { ?>
            <p><?= QObject::htr('Your account has been successfully deleted.') ?></p>
            <p><a href="<?= localizedUrl('/') ?>"><?= QObject::htr('Back to the homepage') ?></a></p>
        <?php } else{ ?>
            <p><?= QObject::htr('Do you really want to delete your account?') ?></p>
            <p><?= QObject::htr('If you delete your account, all information about your account will be permanently deleted, and it will not be possible to recover any information related to your account.') ?></p>
            <form method="post" action="">
                <label>
                    <?= QObject::htr('Password') ?>:
                    <input type="password" name="password" required/>
                    <?php if($passwordIsWrong){ ?>
                        <span class="formToolTip incorrect"><?= sprintf(QObject::tr('This password is incorrect. If you forgot your password, you can reset it by <a href="%s">contacting us</a>.'), 'mailto:95423695+GustavLindberg99@users.noreply.github.com') ?></span>
                    <?php } ?>
                </label><br/>
                <?php if($captchaFailed){ ?>
                    <p class="formToolTip incorrect"><?= QObject::htr('Please confirm that you are not a robot.') ?></p>
                <?php } ?>
                <div class="g-recaptcha" data-sitekey="<?= SITEKEY ?>"></div>
                <input type="submit" name="delete" value="<?= QObject::htr('Delete account (WARNING: this can not be undone)') ?>"/>
            </form>
        <?php } ?>
    </article>
    <?php insertFooter(); ?>
</body>
</html>
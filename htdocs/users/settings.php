<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/error-handler.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/html.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/user.php');

$loggedInUser = LoggedInUser::userFromCookies(401);

try{
    if(isset($_POST['language'])){
        $loggedInUser->setLanguage($_POST['language']);
    }
    if(isset($_POST['variant'])){
        $loggedInUser->setVariant($_POST['variant']);
    }
}
catch(InvalidEnumValueException $e){
    showHttpError(400);
}
catch(PDOException $e){
    showHttpError(503, 'Database error: ' . $e->getMessage());
}
?>

<!DOCTYPE html>
<html lang="<?= LANGUAGE ?>">
<head>
    <?php insertMetaTags('', []); ?>
    <title>Map Collector - <?= QObject::htr('Settings') ?></title>

    <link rel="stylesheet" type="text/css" href="<?= STATIC_DOMAIN ?>/css/forms.css"/>

    <script type="module" src="<?= STATIC_DOMAIN ?>/js/header/main.js" async crossorigin></script>
    <link rel="stylesheet" type="text/css" href="<?= STATIC_DOMAIN ?>/css/general/main.css"/>
</head>
<body>
	<?php insertHeader(); ?>
    <section>
        <h1><?= QObject::htr('Settings') ?></h1>
        <?php if(isset($_POST['changeSettings'])){ ?>
            <p class="formToolTip correct"><?= QObject::tr('The changes were saved successfully.') ?></p>
        <?php } ?>
        <form method="post" action="">
            <h2><?= QObject::htr('Preferred language') ?></h2>
            <label>
                <input type="radio" name="language" value="en" <?= ($loggedInUser->language() === 'en') ? "checked" : "" ?>/>
                <img src="<?= STATIC_DOMAIN ?>/images/countries/united_states.svg" class="inline" alt=""/>
                English
            </label><br/>
            <label>
                <input type="radio" name="language" value="fr" <?= ($loggedInUser->language() === 'fr') ? "checked" : "" ?>/>
                <img src="<?= STATIC_DOMAIN ?>/images/countries/france.svg" class="inline" alt=""/>
                Français
            </label><br/>
            <label>
                <input type="radio" name="language" value="sv" <?= ($loggedInUser->language() === 'sv') ? "checked" : "" ?>/>
                <img src="<?= STATIC_DOMAIN ?>/images/countries/sweden.svg" class="inline" alt=""/>
                Svenska
            </label>
            <h2><?= QObject::htr('Preferred game variant') ?></h2>
            <label>
                <input type="radio" name="variant" <?= ($loggedInUser->variant() & GameVariant::Money) ? "" : "checked" ?> value="<?= GameVariant::Time ?>">
                <img src="<?= STATIC_DOMAIN ?>/images/time.svg" class="inline" alt=""/>
                <?= QObject::htr('Time') ?>
            </label><br/>
            <label>
                <input type="radio" name="variant" <?= ($loggedInUser->variant() & GameVariant::Money) ? "checked" : "" ?> value="<?= GameVariant::Money ?>">
                <img src="<?= STATIC_DOMAIN ?>/images/money.svg" class="inline" alt=""/>
                <?= QObject::htr('Money') ?>
            </label>
            <p><input type="submit" name="changeSettings" value="<?= QObject::htr('Save') ?>"/></p>
        </form>
    </section>
    <?php insertFooter(); ?>
</body>
</html>
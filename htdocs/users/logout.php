<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/error-handler.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/html.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/user.php');

LoggedInUser::logOut();
?>

<!DOCTYPE html>
<html lang="<?= LANGUAGE ?>">
<head>
    <?php insertMetaTags('', []); ?>
    <title>Map Collector - <?= QObject::htr('Log out') ?></title>

    <script type="module" src="<?= STATIC_DOMAIN ?>/js/header/main.js" async crossorigin></script>
    <link rel="stylesheet" type="text/css" href="<?= STATIC_DOMAIN ?>/css/general/main.css"/>
</head>
<body>
    <?php insertHeader(); ?>
    <article>
        <h1><?= QObject::htr('You have been successfully logged out.') ?></h1>
        <p><a href="<?= localizedUrl('/') ?>"><?= QObject::htr('Back to the homepage') ?></a></p>
    </article>
    <?php insertFooter(); ?>
</body>
</html>
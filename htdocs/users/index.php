<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/error-handler.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/html.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/user.php');

$loggedInUser = LoggedInUser::userFromCookies(401);
$searchQuery = $_POST['search'] ?? '';
if(!isset($_POST['search'])){
    $foundUsers = [];
}
else try{
    $foundUsers = User::userSearch($searchQuery);
}
catch(PDOException $e){
    showHttpError(503, 'Database error: ' . $e->getMessage());
}
?>

<!DOCTYPE html>
<html lang="<?= LANGUAGE ?>">
<head>
    <?php insertMetaTags(
        QObject::tr('Map Collector Users'),
        [QObject::tr('users'), QObject::tr('list'), QObject::tr('contacts')]
    ); ?>

    <?php if($loggedInUser !== null){ ?>
        <meta name="user-id" content="<?= $loggedInUser->id() ?>"/>
    <?php } ?>

    <title>Map Collector - <?= QObject::htr('Users') ?></title>

    <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/toastify-js" async crossorigin></script>
    <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css" <?= ASYNC_CSS ?>/>

    <script type="module" src="<?= STATIC_DOMAIN ?>/js/contacts/main.js" async crossorigin></script>
    <link rel="stylesheet" type="text/css" href="<?= STATIC_DOMAIN ?>/css/loading-view.css"/>
    <link rel="stylesheet" type="text/css" href="<?= STATIC_DOMAIN ?>/css/usercard.css"/>

    <script type="module" src="<?= STATIC_DOMAIN ?>/js/header/main.js" async crossorigin></script>
    <link rel="stylesheet" type="text/css" href="<?= STATIC_DOMAIN ?>/css/general/main.css"/>
</head>
<body>
	<?php insertHeader(); ?>
    <section>
        <h1><?= QObject::htr('Users') ?></h1>
        <h2><?= QObject::htr('Your Contacts') ?></h2>
        <div id="contactList" class="contactList"></div>

        <h2><?= QObject::htr('Search for Users') ?></h2>
        <form id="searchUserForm" method="post" action="">
            <input type="search" name="search" value="<?= htmlspecialchars($searchQuery) ?>" placeholder="<?= QObject::htr("Search a user...") ?>"/>
            <input type="submit" value="<?= QObject::htr('Search') ?>"/>
        </form>
        <div id="searchResults"></div>
    </section>
    <?php insertFooter(); ?>
</body>
</html>
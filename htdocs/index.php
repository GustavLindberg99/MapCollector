<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/error-handler.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/html.php');

$loggedInUser = LoggedInUser::userFromCookies();
?>

<!DOCTYPE html>
<html lang='<?= LANGUAGE ?>'>
<head>
    <?php insertMetaTags(
        QObject::tr('A fun game to explore public transportation systems from around the world'),
        [QObject::tr('game'), QObject::tr('train'), QObject::tr('trains'), QObject::tr('public transportation')]
    ); ?>

    <title><?= APPNAME . ' - ' . QObject::htr('A fun game to explore public transportation systems from around the world') ?></title>

    <!-- Peer.js (library for communicating with the opponent in multiplayer games) and a non-standard meta tag to be able to access the user ID from Javascript. -->
    <?php if($loggedInUser !== null){ ?>
        <meta name="user-id" content="<?= $loggedInUser->id() ?>"/>
        <script type="text/javascript" src="https://unpkg.com/peerjs/dist/peerjs.min.js"></script>
    <?php } ?>

    <!-- Tippy.js (library for showing bubbles). The CSS is Map Collector's own customization of the tippy bubble. -->
    <script type="text/javascript" src="https://unpkg.com/@popperjs/core@2" defer crossorigin></script>
    <script type="text/javascript" src="https://unpkg.com/tippy.js@6" defer crossorigin></script>
    <link rel="stylesheet" type="text/css" href="<?= STATIC_DOMAIN ?>/css/tippy.css" <?= ASYNC_CSS ?>/>

    <!-- Xdialog (library for showing dialogs) -->
    <script type="text/javascript" src="https://cdn.jsdelivr.net/gh/xxjapp/xdialog@3/xdialog.min.js" async crossorigin></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/xxjapp/xdialog@3/xdialog.min.css" <?= ASYNC_CSS ?>/>

    <!-- Toastify (library for showing toast messages) -->
    <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/toastify-js" async crossorigin></script>
    <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css" <?= ASYNC_CSS ?>/>

    <!-- Game -->
    <script type="module" src="<?= STATIC_DOMAIN ?>/js/game/main.js" async crossorigin></script>
    <link rel="stylesheet" type="text/css" href="<?= STATIC_DOMAIN ?>/css/game/main.css" <?= ASYNC_CSS ?>/>
    <link rel="stylesheet" type="text/css" href="<?= STATIC_DOMAIN ?>/css/toolbar.css"/>
    <link rel="stylesheet" type="text/css" href="<?= STATIC_DOMAIN ?>/css/zoom-box.css"/>

    <!-- Multiplayer dialog -->
    <link rel="stylesheet" type="text/css" href="<?= STATIC_DOMAIN ?>/css/loading-view.css"/>
    <link rel="stylesheet" type="text/css" href="<?= STATIC_DOMAIN ?>/css/usercard.css"/>

    <!-- General -->
    <script type="module" src="<?= STATIC_DOMAIN ?>/js/header/main.js" async crossorigin></script>
    <link rel="stylesheet" type="text/css" href="<?= STATIC_DOMAIN ?>/css/general/main.css"/>
</head>
<body>
    <?php insertCookieBannerIfNeeded(); ?>
    <?php insertHeader(); ?>
    <div class="toolbar">
        <button id="newGameButton" title="<?= QObject::tr('Exit game') ?>" disabled>
            <img src="<?= STATIC_DOMAIN ?>/images/newbutton.svg" alt="<?= QObject::tr('Exit game') ?>"/>
        </button>
        <button id="pauseButton" class="toggleable" title="<?= QObject::tr('Pause') ?>" disabled>
            <img src="<?= STATIC_DOMAIN ?>/images/pause.svg" alt="<?= QObject::tr('Pause') ?>"/>
        </button>
        <button id="fastForwardButton" title="<?= QObject::tr('Fast forward to destination') ?>" disabled>
            <img src="<?= STATIC_DOMAIN ?>/images/fast-forward.svg" alt="<?= QObject::tr('Fast forward to destination') ?>"/>
        </button>
        <button id="helpButton" onclick="window.open('https://github.com/GustavLindberg99/MapCollector/blob/master/README.md')" title="<?= QObject::tr('Help') ?>">
            <img src="<?= STATIC_DOMAIN ?>/images/help.svg" alt="<?= QObject::tr('Help') ?>"/>
        </button>
    </div>
    <section role="application"></section>
    <?php insertFooter(); ?>
</body>
</html>
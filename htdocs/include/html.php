<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/defines.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/utils.php');
if(!defined('NO_LOGIN')){
    require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/user.php');
}

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/qtranslator/init.php');

/**
 * Prints <meta> tags and other tags that should go in the head on all HTML pages.
 *
 * @param $description  A description of the current page, goes in <meta name="description"/>.
 * @param $keywords     An array containing keywords relevant for this page, goes in <meata name="keywords"/>.
 */
function insertMetaTags(?string $description, array $keywords = []): void {
    ?>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width"/>
    <meta name="application-name" content="<?= htmlspecialchars(APPNAME) ?>"/>
    <meta name="author" content="Gustav Lindberg"/>
    <?php if($description !== null){ ?>
        <meta name="description" content="<?= htmlspecialchars($description) ?>"/>
    <?php } ?>
    <?php if(sizeof($keywords) > 0){ ?>
        <meta name="keywords" content="<?= htmlspecialchars(join(',', $keywords)) ?>"/>
    <?php } ?>
    <meta name="request-method" content="<?= htmlspecialchars($_SERVER['REQUEST_METHOD']) ?>"/><!-- Not a standard meta tag, used to be able to detect the request method in Javascript, see https://stackoverflow.com/a/121290/4284627 -->
    <link rel="alternate" hreflang="en" href="<?= htmlspecialchars(pageInLanguage('en')) ?>"/>
    <link rel="alternate" hreflang="fr" href="<?= htmlspecialchars(pageInLanguage('fr')) ?>"/>
    <link rel="alternate" hreflang="sv" href="<?= htmlspecialchars(pageInLanguage('sv')) ?>"/>
    <link rel="shortcut icon" href="/favicon.ico"/>
    <?php
}

/**
 * Prints the cookie banner if the user hasn't accepted cookies yet.
 */
function insertCookieBannerIfNeeded(): void {
    if(($_COOKIE['acceptedCookies'] ?? 'false') !== 'false'){
        setCookie('acceptedCookies', 'true', cookieOptions(false));    //So that the banner doesn't come back after a year when the cookie expires
        return;
    }
    ?>
    <script type="module" src="<?= STATIC_DOMAIN ?>/js/cookies/main.js" async crossorigin></script>
    <link rel="stylesheet" type="text/css" href="<?= STATIC_DOMAIN ?>/css/banners.css">
    <div class="banner" id="cookieConsent">
        <h6><?= QObject::htr('We use cookies') ?></h6>
        <p><?= QObject::htr('We use cookies and other tracking technologies to improve your browsing experience on our website. By browsing our website, you consent to our use of cookies and other tracking technologies.') ?> <a href="/privacy.php" rel="nofollow"><?= QObject::htr('Click here to read our privacy policy.') ?></a></p>
        <button id="acceptCookies"><?= QObject::htr('I\'m fine with that') ?></button>
        <button id="dontCareAboutCookies"><?= QObject::htr("I don't care") ?></button>
    </div>
    <?php
}

/**
 * Prints the header to the HTML document.
 */
function insertHeader(): void {
    $loggedInUser = defined('NO_LOGIN') ? null : LoggedInUser::userFromCookies();
    ?>
    <header>
        <a id="logo" href="<?= htmlspecialchars(localizedUrl('/')) ?>">
            <img src="<?= STATIC_DOMAIN ?>/images/logo.svg" alt="<?= QObject::htr('Logo') ?>"/>
            <div><?= STYLEDAPPNAME ?></div>
        </a>
        <button id="menuButton">
            <img src="<?= STATIC_DOMAIN ?>/images/menu.svg" alt="<?= QObject::htr('Menu') ?>"/>
        </button>
        <nav>
            <div class="spacer"></div>
            <ul class="menus">
                <?php if(DEVICEISMOBILE){ ?>
                    <li>
                        <a href="<?= htmlspecialchars('https://play.google.com/store/apps/details?id=tk.mapcollector') ?>">
                            <?= QObject::htr('Android App') ?>
                        </a>
                    </li>
                <?php } if($loggedInUser !== null){ ?>
                    <li class="dropdown">
                        <a href="<?= htmlspecialchars(localizedUrl('/users/profile.php')) ?>"><?= QObject::htr('My account') ?></a>
                        <ul>
                            <li>
                                <a href="<?= htmlspecialchars(localizedUrl('/users/profile.php')) ?>">
                                    <img src="<?= htmlspecialchars($loggedInUser->profilePicture()) ?>" alt="<?= htmlspecialchars($loggedInUser->name()) ?>" class="inline"/>
                                    <span> <?= QObject::htr('Profile and statistics') ?></span>
                                </a>
                            </li>
                            <li>
                                <a href="<?= htmlspecialchars(localizedUrl('/users/settings.php')) ?>">
                                    <img src="<?= STATIC_DOMAIN ?>/images/settings.svg" alt="" class="inline"/>
                                    <span> <?= QObject::htr('Settings') ?></span>
                                </a>
                            </li>
                            <li>
                                <a href="<?= htmlspecialchars(localizedUrl('/users/')) ?>">
                                    <img src="<?= STATIC_DOMAIN ?>/images/contacts.svg" alt="" class="inline"/>
                                    <span> <?= QObject::htr('Contacts') ?></span>
                                </a>
                            </li>
                            <li>
                                <a href="<?= htmlspecialchars(localizedUrl('/users/challenges.php')) ?>">
                                    <img src="<?= STATIC_DOMAIN ?>/images/easybadge.svg" alt="" class="inline"/>
                                    <span> <?= QObject::htr('Challenges') ?></span>
                                    <p>
                                        <?php
                                        $statistics = $loggedInUser->statistics();
                                        if($statistics->numberOfCompletedChallenges(Level::All) > 0){
                                            foreach([Level::Easy, Level::Medium, Level::Difficult] as $level){
                                                if($statistics->numberOfCompletedChallenges($level) > 0){
                                                    ?>
                                                    <span title="<?= sprintf(QObject::htr('%n %s challenges completed', null, $statistics->numberOfCompletedChallenges($level)), levelToString($level, true)) ?>">
                                                        <img src="<?= STATIC_DOMAIN ?>/images/<?= levelToString($level, false) ?>badge.svg" alt="<?= htmlspecialchars(sprintf(QObject::htr('%s challenge'), levelToString($level, true))) ?>" class="inline"/>
                                                        <?= $statistics->numberOfCompletedChallenges($level) ?>
                                                    </span>
                                                    <?php
                                                }
                                            }
                                        }
                                        ?>
                                    </p>
                                </a>
                            </li>
                            <li>
                                <a href="<?= htmlspecialchars(localizedUrl('/users/logout.php')) ?>">
                                    <img src="<?= STATIC_DOMAIN ?>/images/exit.svg" alt="" class="inline"/>
                                    <span> <?= QObject::htr('Log out') ?></span>
                                </a>
                            </li>
                        </ul>
                    </li>
                <?php } else{ ?>
                    <li>
                        <a href="<?= htmlspecialchars(localizedUrl('/users/login.php')) ?>" rel="nofollow">
                            <?= QObject::htr('Log in') ?>
                        </a>
                    </li>
                    <li>
                        <a href="<?= htmlspecialchars(localizedUrl('/users/signup.php')) ?>" rel="nofollow">
                            <?= QObject::htr('Sign up') ?>
                        </a>
                    </li>
                <?php } ?>
                <li class="dropdown">
                    <a class="navButtonWithImage" href="javascript:void(0)">
                        <img src="<?= STATIC_DOMAIN ?>/images/translation.svg" alt="<?= QObject::htr('Language') ?>"/>
                        <span><?= QObject::htr('Language') ?></span>
                    </a>
                    <ul>
                        <li>
                            <a href="<?= htmlspecialchars(pageInLanguage('en')) ?>">
                                <img src="<?= STATIC_DOMAIN ?>/images/countries/united_states.svg" alt="" class="inline"/>
                                <span> English</span>
                            </a>
                        </li>
                        <li>
                            <a href="<?= htmlspecialchars(pageInLanguage('fr')) ?>">
                                <img src="<?= STATIC_DOMAIN ?>/images/countries/france.svg" alt="" class="inline"/>
                                <span> Français</span>
                            </a>
                        </li>
                        <li>
                            <a href="<?= htmlspecialchars(pageInLanguage('sv')) ?>">
                                <img src="<?= STATIC_DOMAIN ?>/images/countries/sweden.svg" alt="" class="inline"/>
                                <span> Svenska</span>
                            </a>
                        </li>
                    </ul>
                </li>
                <li>
                    <a class="navButtonWithImage" href="<?= htmlspecialchars('https://github.com/GustavLindberg99/MapCollector/blob/master/README.md') ?>" rel="help">
                        <img src="<?= STATIC_DOMAIN ?>/images/help.svg" alt="<?= QObject::htr('Help') ?>"/>
                        <span><?= QObject::htr('Help') ?></span>
                    </a>
                </li>
            </ul>
        </nav>
    </header>
    <?php
}

/**
 * Prints the footer to the HTML document.
 */
function insertFooter(): void {
    ?>
    <div class="spacer"></div>
    <footer>
        <div>
            <h3><?= htmlspecialchars(APPNAME) ?></h3>
            <p>Version <?= VERSION ?></p>
            <p>Copyright &copy; <?= COPYRIGHTSTART ?>-<?= date('Y') ?> Gustav Lindberg</p>
            <p><a href="https://github.com/GustavLindberg99/MapCollector/blob/master/LICENSE" rel="license"><?= QObject::htr('Terms of Use') ?></a> • <a href="https://github.com/GustavLindberg99/MapCollector/blob/master/PRIVACY"><?= QObject::htr('Privacy Policy') ?></a> • <a href="https://github.com/GustavLindberg99/MapCollector/issues"><?= QObject::htr('Contact Us') ?></a></p>
            <p><?= sprintf(QObject::htr('Icons made by %3$s and %4$s from %1$s are licensed under %2$s. Some of the icons have been modified.'), '<a href="https://www.iconfinder.com/" rel="external">www.iconfinder.com</a>', '<a href="http://creativecommons.org/licenses/by/3.0/" rel="external">CC 3.0 BY</a>', '<a href="https://www.iconfinder.com/paomedia" rel="external">Paomedia</a>, <a href="https://www.iconfinder.com/webalys" rel="external">Webalys</a>, <a href="https://www.iconfinder.com/Chanut-is" rel="external">Chanut is Industries</a>, <a href="https://www.iconfinder.com/iconfinder" rel="external">Iconfinder</a>, <a href="https://www.iconfinder.com/kmgdesignid" rel="external">Kmg Design</a>, <a href="https://www.iconfinder.com/iconsets/ionicons" rel="external">Ionicons</a>, <a href="https://www.iconfinder.com/Mr-hopnguyen" rel="external">Hopnguyen Mr</a>, <a href="https://www.iconfinder.com/webhostingmedia" rel="external">David Cross</a>, <a href="https://www.iconfinder.com/pocike" rel="external">Alpár-Etele Méder</a>, <a href="https://www.iconfinder.com/iconsets/circle-icons-1" rel="external">Nick Roach</a>, <a href="https://www.iconfinder.com/fluent-designsystem" rel="external">Microsoft</a>, <a href="https://www.iconfinder.com/webkul" rel="external">Webkul Software</a>, <a href="https://www.iconfinder.com/iconsets/ios-7-icons" rel="external">Visual Pharm</a>, <a href="https://www.iconfinder.com/goodware" rel="external">goodware std.</a>, <a href="https://www.iconfinder.com/font-awesome" rel="external">Font Awesome</a>, <a href="https://www.iconfinder.com/graphiqa" rel="external">Graphiqa Studio</a>, <a href="https://www.iconfinder.com/kucingklawu" rel="external">Kucingklawu Std.</a>, <a href="https://www.iconfinder.com/bendavis" rel="external">Creaticca Ltd</a>, <a href="https://www.iconfinder.com/iconsets/google-material-design-3-0" rel="external">Google</a>', '<a href="https://www.iconfinder.com/olivetty" rel="external">Smashicons</a>') ?></p>
            <p><?= sprintf(QObject::htr('%1$s and %2$s are licensed under the %3$s.'), '<a href="https://peerjs.com/" rel="external">PeerJS</a>, <a href="https://apvarun.github.io/toastify-js/" rel="external">ToastifyJS</a>, <a href="https://alexbol99.github.io/flatten-js/index.html" rel="external">Flatten-js</a>, <a href="https://lodash.com/" rel="external">Lodash</a>', '<a href="https://atomiks.github.io/tippyjs/" rel="external">Tippy.js</a>', '<a href="https://tldrlegal.com/license/mit-license" rel="external">MIT License</a>') ?> <?= sprintf(QObject::htr('%1$s is licensed under the %2$s.'), '<a href="https://xxjapp.github.io/xdialog/" rel="external">Xdialog</a>', '<a href="https://www.apache.org/licenses/LICENSE-2.0" rel="external">Apache License 2.0</a>') ?></p>
            <p><?= sprintf(QObject::htr('World map from %s.'), '<a href="https://simplemaps.com/resources/svg-world" rel="external">simplemaps.com</a>') ?></p>
        </div>
    </footer>
    <?php
}
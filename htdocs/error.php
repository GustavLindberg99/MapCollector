<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/defines.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/html.php');

ini_set('display_errors', 'off');

$errorNames = [
    400 => QObject::tr('Bad Request'),
    401 => QObject::tr('Unauthorized'),
    402 => QObject::tr('Payment Required'),
    403 => QObject::tr('Forbidden'),
    404 => QObject::tr('Page Not Found'),
    405 => QObject::tr('Method Not Allowed'),
    406 => QObject::tr('Not Acceptable'),
    407 => QObject::tr('Proxy Authentication Required'),
    408 => QObject::tr('Request Timeout'),
    409 => QObject::tr('Conflict'),
    410 => QObject::tr('Gone'),
    411 => QObject::tr('Length Required'),
    412 => QObject::tr('Precondition Failed'),
    413 => QObject::tr('Payload Too Large'),
    414 => QObject::tr('URI Too Long'),
    415 => QObject::tr('Unsupported Media Type'),
    416 => QObject::tr('Range Not Satisfiable'),
    417 => QObject::tr('Expectation Failed'),
    418 => QObject::tr('I\'m a Teapot'),
    421 => QObject::tr('Misdirected Request'),
    422 => QObject::tr('Unprocessable Entity'),
    423 => QObject::tr('Locked'),
    424 => QObject::tr('Failed Dependency'),
    426 => QObject::tr('Upgrade Required'),
    428 => QObject::tr('Precondition Required'),
    429 => QObject::tr('Too Many Requests'),
    431 => QObject::tr('Request Header Fields Too Large'),
    451 => QObject::tr('Unavailable For Legal Reasons'),
    500 => QObject::tr('Internal Server Error'),
    501 => QObject::tr('Not Implemented'),
    502 => QObject::tr('Bad Gateway'),
    503 => QObject::tr('Service Unavailable'),
    504 => QObject::tr('Gateway Timeout'),
    505 => QObject::tr('HTTP Version Not Supported'),
    506 => QObject::tr('Variant Also Negotiates'),
    507 => QObject::tr('Insufficient Storage'),
    508 => QObject::tr('Loop Detected'),
    510 => QObject::tr('Not Extended'),
    511 => QObject::tr('Network Authentication Required')
];

if(!isset($errorCode) && isset($_GET['e'])){
    $errorCode = (int)$_GET['e'];
}
if(!isset($errorCode) || !isset($errorNames[$errorCode])){
    $errorCode = 400;
}

//Redirect to login page on 401 error for users who aren't logged in
if($errorCode === 401 && LoggedInUser::userFromCookies() === null && !preg_match('/\/ajax\//', $_SERVER['REQUEST_URI'])){
    redirect(303, localizedUrl('/users/login.php?returnurl=' . urlencode($_SERVER['REQUEST_URI'])));
}

//Show 404 error when trying to access this page directly
if(preg_match('/\/error\.php\?e=[0-9]*$/i', $_SERVER['REQUEST_URI']) && !IS_LOCALHOST){
    $errorCode = 404;
}

http_response_code($errorCode);

function showErrorMessage(string $errorMessage, array $thingsToTry = [], ?string $contactUsMessage = null): void {
    $contactUsMessage = $contactUsMessage ?? QObject::tr('If you think this is a bug, please <a href="%s">contact us</a>.');
    $showContactLink = $contactUsMessage !== '';
    $contactUsMessage = sprintf($contactUsMessage, 'https://github.com/GustavLindberg99/MapCollector/issues');
    echo '<p>';
    echo $errorMessage;
    if(sizeof($thingsToTry) > 0){
        echo ' ' . QObject::htr('You can try the following things:');
    }
    else if($showContactLink){
        echo ' ' . $contactUsMessage;
    }
    echo '</p>';
    if(sizeof($thingsToTry) > 0){
        echo '<ul class="errorList">';
        foreach($thingsToTry as $thingToTry){
            echo "<li>$thingToTry</li>";
        }
        if($showContactLink){
            echo "<li>$contactUsMessage</li>";
        }
        echo '</ul>';
    }
}

if(!defined('LANGUAGE')){
    define('LANGUAGE', 'en');
}
?>

<!DOCTYPE html>
<html lang="<?= LANGUAGE ?>">
<head>
    <?php insertMetaTags('', []); ?>
    <?php if(isset($errorMessage) && $errorMessage !== null){ ?>
        <meta name="php-error" content="<?= htmlspecialchars($errorMessage) ?>"/>
        <script type="text/javascript">
            console.error(<?= json_encode($errorMessage) ?>);
        </script>
    <?php } ?>

    <title><?= APPNAME ?> - <?= htmlspecialchars($errorCode . ' ' . $errorNames[$errorCode]) ?></title>

    <script type="module" src="<?= STATIC_DOMAIN ?>/js/header/main.js" async crossorigin></script>
    <link rel="stylesheet" type="text/css" href="<?= STATIC_DOMAIN ?>/css/general/main.css"/>
</head>
<body>
    <?php insertHeader(); ?>
    <article>
        <h1><?= htmlspecialchars($errorCode . ' - ' . $errorNames[$errorCode]) ?></h1>
        <?php if($errorCode === 418) { ?>
            <img class="errorMaps" src="<?= STATIC_DOMAIN ?>/images/teapot.svg"/>
        <?php } else { ?>
            <div class="errorMaps">
                <img src="/profilemap.php?c=<?= ((string)$errorCode)[0] ?>&n=<?= $errorCode + 3 ?>"/>
                <img src="/profilemap.php?c=<?= ((string)$errorCode)[1] ?>&n=<?= $errorCode + 2 ?>"/>
                <img src="/profilemap.php?c=<?= ((string)$errorCode)[2] ?>&n=<?= $errorCode + 1 ?>"/>
            </div>
        <?php } ?>
        <?php
        //Client errors
        if(intdiv($errorCode, 100) === 4){
            switch($errorCode){
                case 401:
                    showErrorMessage(QObject::htr('Your account does not have the permissions to access this page.'));
                    break;
                case 403:
                    showErrorMessage(
                        QObject::htr('You do not have the permissions to access this page, so this is probably not the page you were looking for.'),
                        [
                            sprintf(QObject::tr('Go to the <a href="%1$s">home page</a> to play %2$s.'), htmlspecialchars(localizedUrl('/')), htmlspecialchars(APPNAME)),
                            sprintf(QObject::tr('Go to the <a href="%s">help page</a> to get help.'), htmlspecialchars('https://github.com/GustavLindberg99/MapCollector/blob/master/README.md'))
                        ]
                    );
                    break;
                case 404:
                case 410:
                case 414:
                    $searchFor = urldecode(basename($_SERVER['REQUEST_URI'], '?' . $_SERVER['QUERY_STRING']));
                    showErrorMessage(
                        QObject::htr('This page could not be found.'),
                        [
                            sprintf(QObject::tr('Go to the <a href="%1$s">home page</a> to play %2$s.'), htmlspecialchars(localizedUrl('/')), htmlspecialchars(APPNAME)),
                            sprintf(QObject::tr('Go to the <a href="%s">help page</a> to get help.'), htmlspecialchars('https://github.com/GustavLindberg99/MapCollector/blob/master/README.md')),
                            sprintf(QObject::htr('Search for %s.'), '<a href="' . htmlspecialchars('https://www.google.com/search?q=site%3A' . htmlspecialchars(urlencode($_SERVER['HTTP_HOST'])) . '+' . htmlspecialchars(str_replace(' ', '+', urlencode($searchFor)))) . '">' . htmlspecialchars($searchFor) . '</a>')
                        ]
                    );
                    break;
                case 418:
                    showErrorMessage(
                        QObject::htr('I\'m not a map, I\'m a teapot.'),
                        [
                            sprintf(QObject::tr('If you want to collect maps instead of teapots, <a href="%s">click here</a>.'), htmlspecialchars(localizedUrl('/'))),
                            sprintf(QObject::tr('If you\'re fine with collecting teapots, <a href="%s">click here</a>.'), 'https://www.google.com/teapot'),
                            sprintf(QObject::tr('If you want to know more, <a href="%s">click here</a>.'), 'https://' . LANGUAGE . '.wikipedia.org/wiki/Hyper_Text_Coffee_Pot_Control_Protocol')
                        ],
                        ''
                    );
                    break;
                case 429:
                    showErrorMessage(QObject::htr('You have sent too many requests. Please try again later.'));
                    break;
                default:
                    showErrorMessage(QObject::htr('The request could not be processed correctly.'));
                    break;
            }
        }
        //Server errors
        else{
            switch($errorCode){
                case 503:
                    showErrorMessage(QObject::htr('This page is temporarily unavailable due to server problems. We apologize for the inconvenience. Please try again later.'), [], '');
                    break;
                default:
                    showErrorMessage(QObject::htr('An unexpected error occurred. We apologize for the inconvenience.'), [], QObject::tr('If this error persists, please <a href="%s">contact us</a>.') . ' ' . QObject::htr('Please include as much information as possible, including what you were doing before you got this error and any information available in the browser\'s developer tools (accessible by pressing the F12 key and going to Console).'));
                    break;
            }
        }
        ?>
		</ul>
    </article>
    <?php insertFooter(); ?>
</body>
</html>
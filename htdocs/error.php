<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/defines.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/html.php');

ini_set('display_errors', 'off');

$errorNames = [
    400 => translator()->trans('Bad Request'),
    401 => translator()->trans('Unauthorized'),
    402 => translator()->trans('Payment Required'),
    403 => translator()->trans('Forbidden'),
    404 => translator()->trans('Page Not Found'),
    405 => translator()->trans('Method Not Allowed'),
    406 => translator()->trans('Not Acceptable'),
    407 => translator()->trans('Proxy Authentication Required'),
    408 => translator()->trans('Request Timeout'),
    409 => translator()->trans('Conflict'),
    410 => translator()->trans('Gone'),
    411 => translator()->trans('Length Required'),
    412 => translator()->trans('Precondition Failed'),
    413 => translator()->trans('Payload Too Large'),
    414 => translator()->trans('URI Too Long'),
    415 => translator()->trans('Unsupported Media Type'),
    416 => translator()->trans('Range Not Satisfiable'),
    417 => translator()->trans('Expectation Failed'),
    418 => translator()->trans('I\'m a Teapot'),
    421 => translator()->trans('Misdirected Request'),
    422 => translator()->trans('Unprocessable Entity'),
    423 => translator()->trans('Locked'),
    424 => translator()->trans('Failed Dependency'),
    426 => translator()->trans('Upgrade Required'),
    428 => translator()->trans('Precondition Required'),
    429 => translator()->trans('Too Many Requests'),
    431 => translator()->trans('Request Header Fields Too Large'),
    451 => translator()->trans('Unavailable For Legal Reasons'),
    500 => translator()->trans('Internal Server Error'),
    501 => translator()->trans('Not Implemented'),
    502 => translator()->trans('Bad Gateway'),
    503 => translator()->trans('Service Unavailable'),
    504 => translator()->trans('Gateway Timeout'),
    505 => translator()->trans('HTTP Version Not Supported'),
    506 => translator()->trans('Variant Also Negotiates'),
    507 => translator()->trans('Insufficient Storage'),
    508 => translator()->trans('Loop Detected'),
    510 => translator()->trans('Not Extended'),
    511 => translator()->trans('Network Authentication Required')
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
    $contactUsMessage = $contactUsMessage ?? translator()->trans('If you think this is a bug, please <a href="%s">contact us</a>.');
    $showContactLink = $contactUsMessage !== '';
    $contactUsMessage = sprintf($contactUsMessage, 'https://github.com/GustavLindberg99/MapCollector/issues');
    echo '<p>';
    echo $errorMessage;
    if(sizeof($thingsToTry) > 0){
        echo ' ' . translator()->trans('You can try the following things:');
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
                    showErrorMessage(translator()->trans('Your account does not have the permissions to access this page.'));
                    break;
                case 403:
                    showErrorMessage(
                        translator()->trans('You do not have the permissions to access this page, so this is probably not the page you were looking for.'),
                        [
                            sprintf(translator()->trans('Go to the <a href="%1$s">home page</a> to play %2$s.'), htmlspecialchars(localizedUrl('/')), htmlspecialchars(APPNAME)),
                            sprintf(translator()->trans('Go to the <a href="%s">help page</a> to get help.'), htmlspecialchars('https://github.com/GustavLindberg99/MapCollector/blob/master/README.md'))
                        ]
                    );
                    break;
                case 404:
                case 410:
                case 414:
                    $searchFor = urldecode(basename($_SERVER['REQUEST_URI'], '?' . $_SERVER['QUERY_STRING']));
                    showErrorMessage(
                        translator()->trans('This page could not be found.'),
                        [
                            sprintf(translator()->trans('Go to the <a href="%1$s">home page</a> to play %2$s.'), htmlspecialchars(localizedUrl('/')), htmlspecialchars(APPNAME)),
                            sprintf(translator()->trans('Go to the <a href="%s">help page</a> to get help.'), htmlspecialchars('https://github.com/GustavLindberg99/MapCollector/blob/master/README.md')),
                            sprintf(translator()->trans('Search for %s.'), '<a href="' . htmlspecialchars('https://www.google.com/search?q=site%3A' . htmlspecialchars(urlencode($_SERVER['HTTP_HOST'])) . '+' . htmlspecialchars(str_replace(' ', '+', urlencode($searchFor)))) . '">' . htmlspecialchars($searchFor) . '</a>')
                        ]
                    );
                    break;
                case 418:
                    showErrorMessage(
                        translator()->trans('I\'m not a map, I\'m a teapot.'),
                        [
                            sprintf(translator()->trans('If you want to collect maps instead of teapots, <a href="%s">click here</a>.'), htmlspecialchars(localizedUrl('/'))),
                            sprintf(translator()->trans('If you\'re fine with collecting teapots, <a href="%s">click here</a>.'), 'https://www.google.com/teapot'),
                            sprintf(translator()->trans('If you want to know more, <a href="%s">click here</a>.'), 'https://' . LANGUAGE . '.wikipedia.org/wiki/Hyper_Text_Coffee_Pot_Control_Protocol')
                        ],
                        ''
                    );
                    break;
                case 429:
                    showErrorMessage(translator()->trans('You have sent too many requests. Please try again later.'));
                    break;
                default:
                    showErrorMessage(translator()->trans('The request could not be processed correctly.'));
                    break;
            }
        }
        //Server errors
        else{
            switch($errorCode){
                case 503:
                    showErrorMessage(translator()->trans('This page is temporarily unavailable due to server problems. We apologize for the inconvenience. Please try again later.'), [], '');
                    break;
                default:
                    showErrorMessage(translator()->trans('An unexpected error occurred. We apologize for the inconvenience.'), [], translator()->trans('If this error persists, please <a href="%s">contact us</a>.') . ' ' . translator()->trans('Please include as much information as possible, including what you were doing before you got this error and any information available in the browser\'s developer tools (accessible by pressing the F12 key and going to Console).'));
                    break;
            }
        }
        ?>
		</ul>
    </article>
    <?php insertFooter(); ?>
</body>
</html>
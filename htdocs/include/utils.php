<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');

/**
 * Shows the error page with the given HTTP error code and exits.
 *
 * @param $errorCode    The error code to show on the error page.
 * @param $errorMessage An error message to be shown in the Javascript console. If null, nothing will be logged in the Javascript console.
 */
function showHttpError(int $errorCode, ?string $errorMessage = null): void {
    ob_end_clean();
    require($_SERVER['DOCUMENT_ROOT'] . '/error.php');
    exit();
}

/**
 * Redirects to a given URL and exits the current page.
 *
 * @param $responseCode The HTTP code to send. Should be a 3xx code.
 * @param $url          The URL to redirect to.
 */
function redirect(int $responseCode, string $url): void {
    http_response_code($responseCode);
    header('Location: ' . $url);
    exit();
}

/**
 * Gets the user's timezone. For this to work correctly, the timezone must be sent as POST data (since timezone information isn't sent by default).
 *
 * @return The user's timezone.
 */
function getTimezone(): DateTimeZone {
    if(!isset($_POST['timezone']) || !preg_match('/^[+-][0-9]{1,2}:[0-9]{1,2}$/', $_POST['timezone'])){
        return new DateTimeZone('+00:00');
    }
    else{
        return new DateTimeZone($_POST['timezone']);
    }
}

/**
 * Returns the default cookie options, meant to be used as a third parameter for the built-in setcookie function.
 *
 * @param httponly  False if it should be possible to read the cookie in Javascript, true if it shouldn't.
 * @param expires   The number of seconds after the current time that the cookie should expire. Defaults to a year.
 *
 * @return An array that can be used as the third parameter for setcookie.
 */
function cookieOptions(bool $httponly, int $expires = 365 * 24 * 3600): array {
    return [
        'path' => '/',    //Very important, by default 'path' is the path of the current page, so without this there will be dupliate cookies for each page
        'samesite' => 'lax',
        'expires' => time() + $expires,
        'httponly' => $httponly
    ];
}
<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/utils.php');

/**
 * Handles an error by showing a 500 internal server error page and logging the error to the Javascript console.
 *
 * @param $errno    The level of the error raised.
 * @param $errstr   The error message.
 * @param $errfile  The filename that the error was raised in.
 * @param $errline  The line number where the error was raised.
 */
function errorHandler(int $errno, string $errstr, string $errfile, int $errline): void {
    $errfile = str_replace(['\\', $_SERVER['DOCUMENT_ROOT']], ['/', ''], $errfile);
    //The code for users is quite complicated and will be run to determine the language, account buttons, etc, so if it's a problem in a file having to do with users, don't log the user in to avoid errors on the error page itself
    if(preg_match('/^\/include\/user/', $errfile)){
        define('NO_LOGIN', true);
    }
    showHttpError(500, "PHP error $errno in file $errfile, line $errline: $errstr");
}

/**
 * Handles any fatal error that may have occurred (set_error_handler doesn't work for those). This will be run even if there was no error, which is why we need the null check.
 */
function fatalErrorHandler(): void {
    $error = error_get_last();
    if($error !== null){
        errorHandler($error['type'], $error['message'], $error['file'], $error['line']);
    }
}

set_error_handler('errorHandler');
register_shutdown_function('fatalErrorHandler');
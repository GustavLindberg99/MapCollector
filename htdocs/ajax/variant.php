<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/error-handler.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/user.php');

$loggedInUser = LoggedInUser::userFromCookies();
if($loggedInUser === null){
    echo GameVariant::Time;
}
else{
    echo $loggedInUser->variant();
}

header('Content-type: text/plain');
header('Access-Control-Allow-Origin: https://appassets.androidplatform.net');
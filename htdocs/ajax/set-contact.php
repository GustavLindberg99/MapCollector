<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/error-handler.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/user.php');

if($_SERVER['REQUEST_METHOD'] !== 'POST'){
    showHttpError(405);
}

$loggedInUser = LoggedInUser::userFromCookies(401);
$action = $_POST['action'] ?? '';
$userId = $_POST['contact'] ?? '';
if(!is_numeric($userId)){
    showHttpError(400);
}
try{
    $user = new User($userId);
}
catch(UserNotFoundException $e){
    showHttpError(400);
}
catch(PDOException $e){
    showHttpError(503, 'Database error: ' . $e->getMessage());
}

switch($action){
case 'add':
    $loggedInUser->addContact($user);
    break;
case 'remove':
    $loggedInUser->removeContact($user);
    break;
default:
    showHttpError(400);
}

header('Content-type: text/plain');
header('Access-Control-Allow-Origin: https://appassets.androidplatform.net');
http_response_code(204);
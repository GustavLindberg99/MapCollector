<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/error-handler.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/user.php');

if($_SERVER['REQUEST_METHOD'] !== 'POST'){
    showHttpError(405);
}

$loggedInUser = LoggedInUser::userFromCookies(401);
$won = $_POST['won'] ?? '';
$level = $_POST['level'] ?? '';
$numberOfMaps = $_POST['numberOfMaps'] ?? '';
$remainingTime = $_POST['remainingTime'] ?? '';
$remainingMoney = $_POST['remainingMoney'] ?? '';
$opponentId = $_POST['opponentId'] ?? '';
if(!in_array($won, ['true', 'false']) || !is_numeric($numberOfMaps) || !is_numeric($remainingTime) || !is_numeric($remainingMoney) || !is_numeric($opponentId)){
    showHttpError(400, 'Missing or invalid POST data');
}
try{
    $loggedInUser->updateStatistics($won === 'true', $level, $numberOfMaps, $remainingTime, $remainingMoney, $opponentId);
}
catch(InvalidEnumValueException $e){
    showHttpError(400, $e->getMessage());
}
catch(UnkownUserException $e){
    showHttpError(400, 'Unknown opponent');
}
catch(PDOException $e){
    showHttpError(503, 'Database error: ' . $e->getMessage());
}

header('Content-type: text/plain');
header('Access-Control-Allow-Origin: https://appassets.androidplatform.net');
http_response_code(204);
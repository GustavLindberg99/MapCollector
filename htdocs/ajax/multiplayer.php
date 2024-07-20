<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/error-handler.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/user.php');

if($_SERVER['REQUEST_METHOD'] !== 'POST'){
    showHttpError(405);
}

$loggedInUser = LoggedInUser::userFromCookies(401);

if(isset($_POST['getId'])){
    if(!is_numeric($_POST['getId'])){
        showHttpError(400, 'Invalid ID');
    }
    try{
        $user = new User($_POST['getId']);
        echo $user->multiplayerId();
        header('Content-type: application/json');
        header('Access-Control-Allow-Origin: https://appassets.androidplatform.net');
    }
    catch(UnkownUserException $e){
        showHttpError(400, 'Unknown opponent');
    }
    catch(PDOException $e){
        showHttpError(503, 'Database error: ' . $e->getMessage());
    }
}
else if(preg_match('/^gustavlindberg99-mapcollector-[0-9]+(-[0-9]+)$/', $_POST['setId'] ?? '')){
    $loggedInUser->updateMuliplayerId($_POST['setId']);
    http_response_code(204);
    header('Access-Control-Allow-Origin: https://appassets.androidplatform.net');
}
else{
    showHttpError(400, 'Missing or invalid POST data');
}
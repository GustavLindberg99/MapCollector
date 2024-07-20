<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/error-handler.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/user.php');

try{
    if(isset($_POST['search'])){
        $users = User::userSearch($_POST['search']);
    }
    else{
        $loggedInUser = LoggedInUser::userFromCookies();
        if($loggedInUser === null){
            $users = [];
        }
        else{
            $users = $loggedInUser->contacts();
        }
    }
}
catch(PDOException $e){
    showHttpError(503, 'Database error: ' . $e->getMessage());
}

$json = [];
foreach($users as $user){
    $json[] = $user->toJSON();
}
echo json_encode($json);

header('Content-type: application/json');
header('Access-Control-Allow-Origin: https://appassets.androidplatform.net');
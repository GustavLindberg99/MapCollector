<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/error-handler.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/user.php');

if(!isset($_GET['uid']) || !is_numeric($_GET['uid'])){
    showHttpError(400);
}

try{
    redirect(303, (new User($_GET['uid']))->profilePicture());
}
catch(UserNotFoundException $e){
    showHttpError(404);
}
catch(PDOException $e){
    showHttpError(503, 'Database error: ' . $e->getMessage());
}
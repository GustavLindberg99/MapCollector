<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/user.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/qtranslator/init.php');

if($_SERVER['REQUEST_METHOD'] !== 'POST'){
    showHttpError(405);
}

$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';

function showError(string $message): void{
    echo json_encode([
        'status' => 'error',
        'message' => $message
    ]);
    exit();
}

if(!filter_var($email, FILTER_VALIDATE_EMAIL)){    //We need to check this here (instead of letting the User class do it) in case the user enters a number that would get interpreted as an ID
    showError(QObject::tr('Please enter a valid e-mail address.'));
}
if($password === ''){
    showError(QObject::tr('Please enter your password.'));
}

try{
    $user = new LoggedInUser($email, $password, false);
    $profilePicture = $user->profilePicture();
    if(!preg_match('/https?:\/\//i', $profilePicture)){
        $profilePicture = 'https://' . $_SERVER['HTTP_HOST'] . $profilePicture;
    }
    echo json_encode([
        'status' => 'success',
        'email' => $user->email(),
        'password' => $user->password(),
        'userId' => $user->id()
    ]);
}
catch(PDOException $e){
    showHttpError(503, 'Database error: ' . $e->getMessage());
}
catch(InvalidEmailException $e){
    showError(QObject::tr('Please enter a valid e-mail address.'));
}
catch(UserNotFoundException $e){
    showError(QObject::htr('This e-mail address is not registered.'));
}
catch(WrongPasswordException $e){
    showError(sprintf(QObject::tr('This password is incorrect. If you forgot your password, you can reset it by <a href="%s">contacting us</a>.'), 'mailto:95423695+GustavLindberg99@users.noreply.github.com'));
}
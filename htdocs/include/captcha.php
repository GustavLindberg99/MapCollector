<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/defines.php');

//Settings for captcha are at https://www.google.com/recaptcha/admin#site/343332115?setup
define('SITEKEY', IS_LOCALHOST ? '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI' : '6LcT1XYUAAAAANoYbTyw0vip6e4pfYis3PSFuNMj');

/**
 * Verifies that the user completed the captcha correctly.
 *
 * @return True if the user completed the captha correctly, false if they didn't.
 */
function verifyCaptcha(): bool {
    //The localhost key is a test key which Google made public (see https://developers.google.com/recaptcha/docs/faq#id-like-to-run-automated-tests-with-recaptcha.-what-should-i-do), so it doesn't matter if it's in an open source file
    $secretKey = IS_LOCALHOST ? '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe' : file_get_contents($_SERVER['DOCUMENT_ROOT'] . '/secret/captcha-key.txt');

    if(!isset($_POST['g-recaptcha-response'])){
        return false;
    }

    try{
        $data = [
            'secret'   => $secretKey,
            'response' => $_POST['g-recaptcha-response'],
            'remoteip' => $_SERVER['REMOTE_ADDR']
        ];

        $verify = curl_init();
        curl_setopt($verify, CURLOPT_URL, 'https://www.google.com/recaptcha/api/siteverify');
        curl_setopt($verify, CURLOPT_POST, true);
        curl_setopt($verify, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($verify, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($verify, CURLOPT_RETURNTRANSFER, true);
        $result = curl_exec($verify);

        return json_decode($result, false)->success;
    }
    catch(Exception $e){
        return false;
    }
}
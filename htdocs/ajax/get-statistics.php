<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/error-handler.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/user.php');

$loggedInUser = LoggedInUser::userFromCookies(401);
$statistics = $loggedInUser->statistics();

echo json_encode([
    'userName' => $loggedInUser->name(),
    'score' => $statistics->score(),
    'numberOfMaps' => $statistics->numberOfMaps(),
    'winningRate' => intval($statistics->winningRate() * 100),
    'easyChallenges' => $statistics->numberOfCompletedChallenges(Level::Easy),
    'mediumChallenges' => $statistics->numberOfCompletedChallenges(Level::Medium),
    'difficultChallenges' => $statistics->numberOfCompletedChallenges(Level::Difficult)
]);

header('Content-type: application/json');
header('Access-Control-Allow-Origin: https://appassets.androidplatform.net');
<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/error-handler.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/html.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/user.php');

$loggedInUser = LoggedInUser::userFromCookies();
$user = User::userFromGetParams($loggedInUser);
$statistics = $user === null ? null : $user->statistics();
if($user !== null && !$user->profileVisibleTo($loggedInUser)){
    showHttpError(401);
}

//This can't be in include/user/challenges.php because the User class needs stuff from that file and needs to be initialized in order to know which language to translate the strings to.
define('CHALLENGE_DESCRIPTIONS', [
    0x001 => translator()->trans('Collect at least # maps in total', ['count' => CHALLENGE_VALUES[0x001]]),
    0x002 => translator()->trans('Collect at least # maps in total', ['count' => CHALLENGE_VALUES[0x002]]),
    0x003 => translator()->trans('Collect at least # maps in total', ['count' => CHALLENGE_VALUES[0x003]]),
    0x011 => translator()->trans('Win # games in a row', ['count' => CHALLENGE_VALUES[0x011]]),
    0x012 => translator()->trans('Win # games in a row', ['count' => CHALLENGE_VALUES[0x012]]),
    0x013 => translator()->trans('Win # games in a row', ['count' => CHALLENGE_VALUES[0x013]]),
    0x014 => translator()->trans('Win # difficult games in a row', ['count' => CHALLENGE_VALUES[0x014]]),
    0x021 => translator()->trans('Win a multiplayer game'),
    0x022 => translator()->trans('Win a multiplayer game against someone who has a higher score than you'),
    0x031 => translator()->trans('Play Map Collector # days in a row', ['count' => CHALLENGE_VALUES[0x031]]),
    0x032 => translator()->trans('Play Map Collector # days in a row', ['count' => CHALLENGE_VALUES[0x032]]),
    0x033 => translator()->trans('Play Map Collector # days in a row', ['count' => CHALLENGE_VALUES[0x033]]),
    0x101 => translator()->trans('Collect all maps and have at least # seconds left', ['count' => CHALLENGE_VALUES[0x101]]),
    0x102 => translator()->trans('Collect all maps and have at least # seconds left', ['count' => CHALLENGE_VALUES[0x102]]),
    0x103 => translator()->trans('Collect all maps and have at least # seconds left', ['count' => CHALLENGE_VALUES[0x103]]),
    0x111 => sprintf(translator()->trans('Collect all maps and have at least $%d left'), CHALLENGE_VALUES[0x111]),
    0x112 => sprintf(translator()->trans('Collect all maps and have at least $%d left'), CHALLENGE_VALUES[0x112]),
    0x113 => sprintf(translator()->trans('Collect all maps and have at least $%d left'), CHALLENGE_VALUES[0x113])
]);
?>

<!DOCTYPE html>
<html lang="<?= LANGUAGE ?>">
<head>
    <?php insertMetaTags(translator()->trans('Challenges'), [translator()->trans('challenges')]); ?>
    <title>Map Collector - <?= translator()->trans('Challenges') ?></title>

    <script type="module" src="<?= STATIC_DOMAIN ?>/js/challenges/main.js" async crossorigin></script>
    <link rel="stylesheet" type="text/css" href="<?= STATIC_DOMAIN ?>/css/challenges.css"/>

    <script type="module" src="<?= STATIC_DOMAIN ?>/js/header/main.js" async crossorigin></script>
    <link rel="stylesheet" type="text/css" href="<?= STATIC_DOMAIN ?>/css/general/main.css"/>
</head>
<body>
    <?php insertHeader(); ?>
    <section class="challengeList">
        <?php if($user === null){ ?>
            <h1><?= translator()->trans('Challenges') ?></h1>
            <p><?= sprintf(translator()->trans('<a href="%s">Create a free account</a> to track your challenge progress. Below is a list of all challenges.'), localizedUrl('/users/signup.php')) ?></p>
        <?php } else{ ?>
            <h1><?= $user->equals($loggedInUser) ? translator()->trans("Your challenges") : htmlspecialchars(sprintf(translator()->trans('%s\'s challenges'), $user->name())) ?></h1>
            <p>
                <?php
                echo translator()->trans('Completed challenges:');
                if($statistics->numberOfCompletedChallenges(Level::All) > 0){
                    foreach([Level::Easy, Level::Medium, Level::Difficult] as $level){
                        if($statistics->numberOfCompletedChallenges($level) > 0){
                            ?>
                            <span role="button" class="toggleChallengeButton" id="<?= levelToString($level, false) ?>ChallengeButton" title="<?= translator()->trans('# {level} challenges completed', ['count' => $statistics->numberOfCompletedChallenges($level), 'level' => levelToString($level, true)]) ?>">
                                <img src="<?= STATIC_DOMAIN ?>/images/<?= levelToString($level, false) ?>badge.svg" class="inline" alt="<?= levelToString($level, true) . ' ' . translator()->trans('challenge') ?>"/>
                                <?= $statistics->numberOfCompletedChallenges($level) ?>
                            </span>
                            <?php
                        }
                    }
                    ?><br/>
                    <a href="javascript:void(0)" role="button" id="notCompletedChallengeButton">
                        <span class="show"><?= translator()->trans('Show only non-completed challenges') ?></span>
                        <span class="hide"><?= translator()->trans('Show all challenges') ?></span>
                    </a>
                    <?php
                }
                else{
                    echo ' ' . translator()->trans('none');
                }
                ?>
            </p>
            <a href="<?= localizedUrl('/users/profile.php?uid=' . $user->id()) ?>"><?= translator()->trans('Back to user page') ?></a>
        <?php } ?>
        <h2><?= translator()->trans('Overall challenges') ?></h2>
        <p><?= translator()->trans('These challenges can only be completed once.') ?></p>
        <div class="challengeHolder">
            <?php
            foreach(CHALLENGE_DESCRIPTIONS as $challengeNumber => $challengeDescription){
                if($challengeNumber === 0x101){
                    ?>
                    </div>
                        <h2><?= translator()->trans('Game-specific challenges') ?></h2>
                        <p><?= translator()->trans('These challenges can be completed once per game.') ?></p>
                    <div class="challengeHolder">
                    <?php
                }
                $challengeValue = CHALLENGE_VALUES[$challengeNumber];
                $challengeLevel = levelToString(CHALLENGE_LEVELS[$challengeNumber], false);
                ?>
                <div class="challenge <?= $challengeLevel . ($statistics != null && $statistics->hasCompletedChallenge($challengeNumber) ? ' completedChallenge'  : ' notCompletedChallenge') ?>">
                    <h3><?= htmlspecialchars($challengeDescription) ?></h3>
                    <?php
                    if($user !== null){
                        if($statistics->hasCompletedChallenge($challengeNumber)){
                            ?>
                                <p class="completedChallengeMessage">
                                    <?php
                                    if($challengeNumber < 0x100){
                                        echo $user->equals($loggedInUser) ? translator()->trans('You have completed this challenge!') : sprintf(translator()->trans('%s has completed this challenge.'), htmlspecialchars($user->name()));
                                    }
                                    else{
                                        echo $user->equals($loggedInUser) ? translator()->trans('You have completed this challenge # times!', ['count' => $statistics->numberOfTimesChallengeCompleted($challengeNumber)]) : translator()->trans('{name} has completed this challenge # times.', ['count' => $statistics->numberOfTimesChallengeCompleted($challengeNumber), 'name' => htmlspecialchars($user->name())]);
                                    }
                                    ?>
                                </p>
                            <?php
                        }
                        else{
                            ?>
                                <p><?= sprintf(translator()->trans('Progress: %1d out of %2d'), $statistics->challengeProgress($challengeNumber), $challengeValue) ?></p>
                                <div class="progressBar <?= $challengeLevel ?>ProgressBar">
                                    <?php if($statistics->challengeProgressRatio($challengeNumber) > 0){ ?>
                                        <span style="width:<?= 100 * $statistics->challengeProgressRatio($challengeNumber) ?>%"></span>
                                    <?php } ?>
                                </div>
                            <?php
                        }
                    }
                    ?>
                </div>
                <?php
            }
            ?>
        </div>
    </section>
    <?php insertFooter(); ?>
</body>
</html>
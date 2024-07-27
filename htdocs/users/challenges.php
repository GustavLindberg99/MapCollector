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
    0x001 => QObject::tr('Collect at least %n maps in total', null, CHALLENGE_VALUES[0x001]),
    0x002 => QObject::tr('Collect at least %n maps in total', null, CHALLENGE_VALUES[0x002]),
    0x003 => QObject::tr('Collect at least %n maps in total', null, CHALLENGE_VALUES[0x003]),
    0x011 => QObject::tr('Win %n games in a row', null, CHALLENGE_VALUES[0x011]),
    0x012 => QObject::tr('Win %n games in a row', null, CHALLENGE_VALUES[0x012]),
    0x013 => QObject::tr('Win %n games in a row', null, CHALLENGE_VALUES[0x013]),
    0x014 => QObject::tr('Win %n difficult games in a row', null, CHALLENGE_VALUES[0x014]),
    0x021 => QObject::tr('Win a multiplayer game'),
    0x022 => QObject::tr('Win a multiplayer game against someone who has a higher score than you'),
    0x031 => QObject::tr('Play Map Collector %n days in a row', null, CHALLENGE_VALUES[0x031]),
    0x032 => QObject::tr('Play Map Collector %n days in a row', null, CHALLENGE_VALUES[0x032]),
    0x033 => QObject::tr('Play Map Collector %n days in a row', null, CHALLENGE_VALUES[0x033]),
    0x101 => QObject::tr('Collect all maps and have at least %n seconds left', null, CHALLENGE_VALUES[0x101]),
    0x102 => QObject::tr('Collect all maps and have at least %n seconds left', null, CHALLENGE_VALUES[0x102]),
    0x103 => QObject::tr('Collect all maps and have at least %n seconds left', null, CHALLENGE_VALUES[0x103]),
    0x111 => sprintf(QObject::tr('Collect all maps and have at least $%d left'), CHALLENGE_VALUES[0x111]),
    0x112 => sprintf(QObject::tr('Collect all maps and have at least $%d left'), CHALLENGE_VALUES[0x112]),
    0x113 => sprintf(QObject::tr('Collect all maps and have at least $%d left'), CHALLENGE_VALUES[0x113])
]);
?>

<!DOCTYPE html>
<html lang="<?= LANGUAGE ?>">
<head>
    <?php insertMetaTags(QObject::tr('Challenges'), [QObject::tr('challenges')]); ?>
    <title>Map Collector - <?= QObject::tr('Challenges') ?></title>

    <script type="module" src="<?= STATIC_DOMAIN ?>/js/challenges/main.js" async crossorigin></script>
    <link rel="stylesheet" type="text/css" href="<?= STATIC_DOMAIN ?>/css/challenges.css"/>

    <script type="module" src="<?= STATIC_DOMAIN ?>/js/header/main.js" async crossorigin></script>
    <link rel="stylesheet" type="text/css" href="<?= STATIC_DOMAIN ?>/css/general/main.css"/>
</head>
<body>
    <?php insertHeader(); ?>
    <section class="challengeList">
        <?php if($user === null){ ?>
            <h1><?= QObject::htr('Challenges') ?></h1>
            <p><?= sprintf(QObject::tr('<a href="%s">Create a free account</a> to track your challenge progress. Below is a list of all challenges.'), localizedUrl('/users/signup.php')) ?></p>
        <?php } else{ ?>
            <h1><?= $user->equals($loggedInUser) ? QObject::htr("Your challenges") : htmlspecialchars(sprintf(QObject::tr('%s\'s challenges'), $user->name())) ?></h1>
            <p>
                <?php
                echo QObject::htr('Completed challenges:');
                if($statistics->numberOfCompletedChallenges(Level::All) > 0){
                    foreach([Level::Easy, Level::Medium, Level::Difficult] as $level){
                        if($statistics->numberOfCompletedChallenges($level) > 0){
                            ?>
                            <span role="button" class="toggleChallengeButton" id="<?= levelToString($level, false) ?>ChallengeButton" title="<?= sprintf(QObject::htr('%n %s challenges completed', null, $statistics->numberOfCompletedChallenges($level)), levelToString($level, true)) ?>">
                                <img src="<?= STATIC_DOMAIN ?>/images/<?= levelToString($level, false) ?>badge.svg" class="inline" alt="<?= levelToString($level, true) . ' ' . QObject::htr('challenge') ?>"/>
                                <?= $statistics->numberOfCompletedChallenges($level) ?>
                            </span>
                            <?php
                        }
                    }
                    ?><br/>
                    <a href="javascript:void(0)" role="button" id="notCompletedChallengeButton">
                        <span class="show"><?= QObject::htr('Show only non-completed challenges') ?></span>
                        <span class="hide"><?= QObject::htr('Show all challenges') ?></span>
                    </a>
                    <?php
                }
                else{
                    echo ' ' . QObject::htr('none');
                }
                ?>
            </p>
            <a href="<?= localizedUrl('/users/profile.php?uid=' . $user->id()) ?>"><?= QObject::htr('Back to user page') ?></a>
        <?php } ?>
        <h2><?= QObject::htr('Overall challenges') ?></h2>
        <p><?= QObject::htr('These challenges can only be completed once.') ?></p>
        <div class="challengeHolder">
            <?php
            foreach(CHALLENGE_DESCRIPTIONS as $challengeNumber => $challengeDescription){
                if($challengeNumber === 0x101){
                    ?>
                    </div>
                        <h2><?= QObject::htr('Game-specific challenges') ?></h2>
                        <p><?= QObject::htr('These challenges can be completed once per game.') ?></p>
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
                                        echo $user->equals($loggedInUser) ? QObject::htr('You have completed this challenge!') : sprintf(QObject::htr('%s has completed this challenge.'), $user->name());
                                    }
                                    else{
                                        echo $user->equals($loggedInUser) ? QObject::tr('You have completed this challenge %n times!', null, $statistics->numberOfTimesChallengeCompleted($challengeNumber)) : sprintf(QObject::htr('%s has completed this challenge %n times.', null, $statistics->numberOfTimesChallengeCompleted($challengeNumber)), $user->name());
                                    }
                                    ?>
                                </p>
                            <?php
                        }
                        else{
                            ?>
                                <p><?= sprintf(QObject::htr('Progress: %1d out of %2d'), $statistics->challengeProgress($challengeNumber), $challengeValue) ?></p>
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
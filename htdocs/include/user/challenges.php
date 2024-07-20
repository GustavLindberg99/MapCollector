<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/level.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/qtranslator/qtranslator.php');

define('CHALLENGE_VALUES', [
    0x001 => 200,
    0x002 => 2000,
    0x003 => 20000,
    0x011 => 3,
    0x012 => 10,
    0x013 => 50,
    0x014 => 25,
    0x021 => 1,
    0x022 => 1,
    0x031 => 3,
    0x032 => 30,
    0x033 => 90,
    0x101 => 60,
    0x102 => 120,
    0x103 => 180,
    0x111 => 20,
    0x112 => 30,
    0x113 => 50
]);

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

define('CHALLENGE_LEVELS', [
    0x001 => Level::Easy,
    0x002 => Level::Medium,
    0x003 => Level::Difficult,
    0x011 => Level::Easy,
    0x012 => Level::Medium,
    0x013 => Level::Difficult,
    0x014 => Level::Difficult,
    0x021 => Level::Easy,
    0x022 => Level::Medium,
    0x031 => Level::Easy,
    0x032 => Level::Medium,
    0x033 => Level::Difficult,
    0x101 => Level::Easy,
    0x102 => Level::Medium,
    0x103 => Level::Difficult,
    0x111 => Level::Easy,
    0x112 => Level::Medium,
    0x113 => Level::Difficult
]);
<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/level.php');

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
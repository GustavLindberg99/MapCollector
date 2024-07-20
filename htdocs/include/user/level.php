<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/statistics.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/qtranslator/qtranslator.php');

abstract class Level{
    const Easy = 0x1;
    const Medium = 0x2;
    const Difficult = 0x4;
    const All = Level::Easy | Level::Medium | Level::Difficult;
}

/**
 * Converts a level enum instance to a string.
 *
 * @param $level        The level enum instance to convert to a string.
 * @param $translate    True if the level name should be translated, false if it should always be in English.
 *
 * @return A string corresponding to the given level.
 */
function levelToString(int $level, bool $translate = false): string {
    switch($level){
    case Level::Easy:
        return $translate ? QObject::tr('easy') : 'easy';
    case Level::Medium:
        return $translate ? QObject::tr('medium') : 'medium';
    case Level::Difficult:
        return $translate ? QObject::tr('difficult') : 'difficult';
    }
    return $translate ? QObject::tr('none') : 'none';
}
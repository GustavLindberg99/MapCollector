<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/statistics.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/translations.php');

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
        return $translate ? translator()->trans('easy') : 'easy';
    case Level::Medium:
        return $translate ? translator()->trans('medium') : 'medium';
    case Level::Difficult:
        return $translate ? translator()->trans('difficult') : 'difficult';
    }
    return $translate ? translator()->trans('none') : 'none';
}
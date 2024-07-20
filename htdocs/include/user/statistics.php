<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/challenges.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/level.php');

class Statistics{
    private $_numberOfMaps;
    private $_numberOfWonGames;
    private $_numberOfLostGames;
    private $_currentWinningStreak;
    private $_longestWinningStreak;
    private $_numberOfWonMultiplayerGames;
    private $_numberOfWonMultiplayerGamesAgainstHigherScore;
    private $_remainingTime;
    private $_remainingMoney;
    private $_lastPlayed;
    private $_currentDaysInARow;
    private $_highestDaysInARow;

    /**
     * Constructs a Statistics object from the corresponding JSON. If no parameter is passed, constructs an empty Statistics object, i.e. statistics corresponding to a user that has never played before.
     *
     * @param $json The JSON representation of the statistics.
     */
    public function __construct(string $json = '{}'){
        $jsonArray = json_decode($json, true);

        $this->_numberOfMaps = $jsonArray['numberOfMaps'] ?? $this->defaultStatistics(0);
        $this->_numberOfWonGames = $jsonArray['numberOfWonGames'] ?? $this->defaultStatistics(0);
        $this->_numberOfLostGames = $jsonArray['numberOfLostGames'] ?? $this->defaultStatistics(0);
        $this->_currentWinningStreak = $jsonArray['currentWinningStreak'] ?? $this->defaultStatistics(0);
        $this->_longestWinningStreak = $jsonArray['longestWinningStreak'] ?? $this->defaultStatistics(0);
        $this->_numberOfWonMultiplayerGames = $jsonArray['numberOfWonMultiplayerGames'] ?? $this->defaultStatistics(0);
        $this->_numberOfWonMultiplayerGamesAgainstHigherScore = $jsonArray['numberOfWonMultiplayerGamesAgainstHigherScore'] ?? $this->defaultStatistics(0);
        $this->_remainingTime = $jsonArray['remainingTime'] ?? $this->defaultStatistics([]);
        $this->_remainingMoney = $jsonArray['remainingMoney'] ?? $this->defaultStatistics([]);
        $this->_lastPlayed = $jsonArray['lastPlayed'] ?? $this->defaultStatistics(0);
        $this->_currentDaysInARow = $jsonArray['currentDaysInARow'] ?? $this->defaultStatistics(0);
        $this->_highestDaysInARow = $jsonArray['highestDaysInARow'] ?? $this->defaultStatistics(0);
    }

    /**
     * Creates an associative array corresponding to an empty statistic.
     *
     * @param $defaultValue The default value to put at all levels.
     *
     * @return An associative array with "easy", "medium", "difficult" and "all" as keys and $defaultValue for all values.
     */
    private function defaultStatistics($defaultValue): array {
        return [
            'easy' => $defaultValue,
            'medium' => $defaultValue,
            'difficult' => $defaultValue,
            'all' => $defaultValue
        ];
    }

    /**
     * Converts the current statistics object to a JSON string.
     *
     * @return A JSON string corresponding to this object.
     */
    public function toJSON(): string {
        return json_encode([
            'numberOfMaps' => $this->_numberOfMaps,
            'numberOfWonGames' => $this->_numberOfWonGames,
            'numberOfLostGames' => $this->_numberOfLostGames,
            'currentWinningStreak' => $this->_currentWinningStreak,
            'longestWinningStreak' => $this->_longestWinningStreak,
            'numberOfWonMultiplayerGames' => $this->_numberOfWonMultiplayerGames,
            'numberOfWonMultiplayerGamesAgainstHigherScore' => $this->_numberOfWonMultiplayerGamesAgainstHigherScore,
            'remainingTime' => $this->_remainingTime,
            'remainingMoney' => $this->_remainingMoney,
            'lastPlayed' => $this->_lastPlayed,
            'currentDaysInARow' => $this->_currentDaysInARow,
            'highestDaysInARow' => $this->_highestDaysInARow
        ]);
    }

    /**
     * Gets the total number of maps that the user has collected.
     *
     * @return The total number of maps that the user has collected.
     */
    public function numberOfMaps(): int {
        return $this->_numberOfMaps['all'];
    }

    /**
     * Gets the score of the user.
     *
     * @return The score of the user.
     */
    public function score(): int {
        $mapsScore = floor($this->_numberOfMaps['all'] / 10);
        $easyWinScore = 5 * $this->_numberOfWonGames['easy'];
        $mediumWinScore = 10 * $this->_numberOfWonGames['medium'];
        $difficultWinScore = 25 * $this->_numberOfWonGames['difficult'];
        $loseScore = -2 * $this->_numberOfLostGames['all'];
        return max(0, $mapsScore + $easyWinScore + $mediumWinScore + $difficultWinScore + $loseScore);
    }

    /**
     * Gets the winning rate of the user.
     *
     * @return A number between 0 and 1, where 0 means they never one and 1 means they won all the games they played.
     */
    public function winningRate(): float {
        $totalNumberOfGames = $this->_numberOfWonGames['all'] + $this->_numberOfLostGames['all'];
        if($totalNumberOfGames === 0){
            return 0;
        }
        return round($this->_numberOfWonGames['all'] / $totalNumberOfGames, 2);
    }

    /**
     * Gets the progress towards the given challenge in absolute numbers, regardless of what the goal of the challenge is.
     *
     * @param $challenge    The challenge to get the progress towards.
     *
     * @return The progress towards that challenge in absolute numbers.
     */
    public function challengeProgress(int $challenge): int {
        switch($challenge){
        case 0x001:
        case 0x002:
        case 0x003:
            return $this->_numberOfMaps['all'];
        case 0x011:
        case 0x012:
        case 0x013:
            return $this->_longestWinningStreak['all'] >= CHALLENGE_VALUES[$challenge] ? $this->_longestWinningStreak['all'] : $this->_currentWinningStreak['all'];
        case 0x014:
            return $this->_longestWinningStreak['difficult'] >= CHALLENGE_VALUES[$challenge] ? $this->_longestWinningStreak['difficult'] : $this->_currentWinningStreak['difficult'];
        case 0x021:
            return $this->_numberOfWonMultiplayerGames['all'];
        case 0x022:
            return $this->_numberOfWonMultiplayerGamesAgainstHigherScore['all'];
        case 0x031:
        case 0x032:
        case 0x033:
            return $this->_highestDaysInARow['all'] >= CHALLENGE_VALUES[$challenge] ? $this->_highestDaysInARow['all'] : $this->_currentDaysInARow['all'];
        case 0x101:
        case 0x102:
        case 0x103:
            return max($this->_remainingTime['all'] ?: [0]);
        case 0x111:
        case 0x112:
        case 0x113:
            return max($this->_remainingMoney['all'] ?: [0]);
        }
    }

    /**
     * Gets the progress towards the given challenge relative to how much is needed to complete the challenge.
     *
     * @param $challenge    The challenge to get the progress towards.
     *
     * @return A number between 0 and 1, where 0 means no progress at all and 1 means that the challenge is completed.
     */
    public function challengeProgressRatio(int $challenge): float {
        return min(1, $this->challengeProgress($challenge) / CHALLENGE_VALUES[$challenge]);
    }

    /**
     * Gets the number of times the given challenge has been completed.
     *
     * @param $challenge    The challenge to check for.
     *
     * @return The number of times the challenge has been completed. For challenges that can only be completed once, this is 0 or 1, but for challenges that can be completed multiple times, this can be a higher number.
     */
    public function numberOfTimesChallengeCompleted(int $challenge): int {
        switch($challenge){
        case 0x101:
        case 0x102:
        case 0x103:
            return sizeof(array_filter($this->_remainingTime['all'], function($it) use(&$challenge){return $it >= CHALLENGE_VALUES[$challenge];}));
        case 0x111:
        case 0x112:
        case 0x113:
            return sizeof(array_filter($this->_remainingMoney['all'], function($it) use(&$challenge){return $it >= CHALLENGE_VALUES[$challenge];}));
        default:
            return $this->challengeProgress($challenge) >= CHALLENGE_VALUES[$challenge];
        }
    }

    /**
     * Checks whether or not the user has completed a challenge, regardless of how many times they completed it.
     *
     * @param $challenge    The challenge to check for.
     *
     * @return True if the user has completed the challenge, false if not.
     */
    public function hasCompletedChallenge(int $challenge): bool {
        return $this->numberOfTimesChallengeCompleted($challenge) > 0;
    }

    /**
     * Gets the number of challenges of a specific level that the user has completed.
     *
     * @param $level    The level of challenges to search for.
     *
     * @return The number of challenges of a specific level that the user has completed.
     */
    public function numberOfCompletedChallenges(int $level): int {
        $result = 0;
        foreach(CHALLENGE_LEVELS as $challenge => $challengeLevel){
            if($challengeLevel & $level){
                $result += $this->numberOfTimesChallengeCompleted($challenge);
            }
        }
        return $result;
    }

    /**
     * Updates all necessary statistics when the user is finished with a game and saves them to the database. Needs to be called twice, once with the actual level and once with "all".
     *
     * @param $won                      True if the user won this game, false otherwise.
     * @param $level                    The level of the place the user was playing in as a string, or "all".
     * @param $numberOfMaps             The number of maps the user collected during this game (can be less than the number of maps in the place if they lost).
     * @param $remainingTime            The amount of seconds the user had left when they won, zero if not playing with time.
     * @param $money                    The amount of money the user had at the end of the game, zero if not playing with money.
     * @param $opponentHasHigherScore   True if the opponent has higher score, false if they don't, null if not playing a multiplayer game.
     */
    public function updateStatistics(bool $won, string $level, int $numberOfMaps, int $remainingTime, int $remainingMoney, ?bool $opponentHasHigherScore): void {

        $this->addMaps($numberOfMaps, $level);
        if($won){
            $this->addWonGame($level);
            $this->addWonMultiplayerGame($level, $opponentHasHigherScore);
            $this->updateRemainingTime($level, $remainingTime);
            $this->updateRemainingMoney($level, $remainingMoney);
        }
        else{
            $this->addLostGame($level);
        }
        $this->addPlayingDay($level);
    }

    /**
     * Increases or the total number of maps the user has collected.
     *
     * @param $number   The number of maps the user collected.
     * @param $level    The level of the place the user was playing in as a string, or "all".
     */
    private function addMaps(int $number, string $level): void {
        $this->_numberOfMaps[$level] += $number;
    }

    /**
     * Increments how many games the user has won and increases the streaks of won games.
     *
     * @param $level    The level of the place the user was playing in as a string, or "all".
     */
    private function addWonGame(string $level): void {
        $this->_numberOfWonGames[$level]++;
        $this->_currentWinningStreak[$level]++;
        $this->_longestWinningStreak[$level] = max($this->_longestWinningStreak[$level], $this->_currentWinningStreak[$level]);
    }

    /**
     * Increments how many games the user has lost and rests the streaks of won games.
     *
     * @param $level    The level of the place the user was playing in as a string, or "all".
     */
    private function addLostGame(string $level): void {
        $this->_numberOfLostGames[$level]++;
        $this->_currentWinningStreak[$level] = 0;
    }

    /**
     * Increments how many multiplayer games the user has won.
     *
     * @param $level        The level of the place the user was playing in as a string, or "all".
     * @param $opponentId   True if the opponent has higher score, false if they don't, null if not playing a multiplayer game (if null, nothing happens).
     */
    private function addWonMultiplayerGame(string $level, ?bool $opponentHasHigherScore): void {
        if($opponentHasHigherScore !== null){
            $this->_numberOfWonMultiplayerGames[$level]++;
            if($opponentHasHigherScore){
                $this->_numberOfWonMultiplayerGamesAgainstHigherScore[$level]++;
            }
        }
    }

    /**
     * Increases or resets the number of days in a row the player has played Map Collector.
     *
     * @param $level    The level of the place the user was playing in as a string, or "all".
     */
    private function addPlayingDay(string $level): void {
        $today = (int)(new DateTime('now', getTimezone()))->diff(new DateTime('1999-03-09', getTimezone()))->format('%a');
        $yesterday = $today - 1;
        if($this->_lastPlayed[$level] === $yesterday){
            $this->_currentDaysInARow[$level]++;
        }
        else if($this->_lastPlayed[$level] < $yesterday){
            $this->_currentDaysInARow[$level] = 1;
        }
        $this->_highestDaysInARow[$level] = max($this->_highestDaysInARow[$level], $this->_currentDaysInARow[$level]);
        $this->_lastPlayed[$level] = $today;
    }

    /**
     * Updates the most time the user has had left when winning.
     *
     * @param $level            The level of the place the user was playing in as a string, or "all".
     * @param $remainingTime    The amount of time the user had left at the end of the game, zero if not playing with time (if zero, nothing happens).
     */
    private function updateRemainingTime(string $level, int $remainingTime): void {
        if($remainingTime > 0){
            $this->_remainingTime[$level][] = $remainingTime;
        }
    }

    /**
     * Updates the most money the user has had.
     *
     * @param $level            The level of the place the user was playing in as a string, or "all".
     * @param $remainingMoney   The amount of money the user had at the end of the game, zero if not playing with money (if zero, nothing happens).
     */
    private function updateRemainingMoney(string $level, int $remainingMoney): void {
        if($remainingMoney > 0){
            $this->_remainingMoney[$level][] = $remainingMoney;
        }
    }
}
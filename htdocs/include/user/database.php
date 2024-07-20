<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/defines.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/utils.php');

/**
 * Connects to the database.
 *
 * @return A PDO object allowing to access the database.
 *
 * @throws PDOException if the attempt to connect to the database fails.
 */
function connectToDatabase(): PDO {
    static $bdd = null;    //Reuse the database variable in order to save resources
    if($bdd === null){
        //If the script is being run on localhost
        if(IS_LOCALHOST){
            $bdd = new PDO('mysql:host=localhost;dbname=mapcollector;charset=utf8', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        }
        //If the script is being run online
        else{
            $username = file_get_contents($_SERVER['DOCUMENT_ROOT'] . '/secret/database-username.txt');
            $password = file_get_contents($_SERVER['DOCUMENT_ROOT'] . '/secret/database-password.txt');
            $bdd = new PDO('mysql:host=localhost;dbname=' . $username . ';charset=utf8', $username, $password, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        }
        $bdd->query('SET time_zone = \'+00:00\'');
    }
    return $bdd;
}
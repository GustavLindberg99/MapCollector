"use strict";

import typechecked from "https://gustavlindberg99.github.io/Typecheck.js/min/typecheck-v1.min.js";
import {QObject} from "https://gustavlindberg99.github.io/QtLinguistWeb/qtranslator-v1.min.js";

import {ajaxDomain, sendRequest, staticDomain} from "../utils/ajax-utils.js";
import {wait} from "../utils/async-utils.js";
import {imgToBase64} from "../utils/graphic-utils.js";

import Station from "./station.js";
import ToolbarButton from "./toolbar-button.js";

export default class Player{
    currentStation /*: Station | null */;
    maps /*: Set<LineWithMaps> */ = new Set();
    remainingTime /*: Number */;
    remainingMoney /*: Number */;
    fastingForward /*: Boolean */ = false;
    opponent /*: Opponent | null */;

    #place /*: Place */;
    #timer /*: Number | null */ = null;

    static FARE_EVASION_FINE_FACTOR = 10;
    static REFRESH_FREQUENCY = 0.05;    //The frequency at which the position gets refreshed in seconds

    static #happyMap = document.createElement("img");
    static #sadMap = document.createElement("img");
    static {
        Player.#happyMap.src = staticDomain() + "/images/happymap.svg";
        Player.#happyMap.width = Player.#happyMap.height = 32;
        Player.#happyMap.style.verticalAlign = "middle";
        Player.#sadMap.src = staticDomain() + "/images/sadmap.svg";
        Player.#sadMap.width = Player.#sadMap.height = 32;
        Player.#sadMap.style.verticalAlign = "middle";
    }

    /**
     * Constructs a Player object.
     *
     * @param place             The place to play in.
     * @param startingStation   The station to start at.
     * @param opponent          The opponent if playing a two-player game, or null if playing a one-player game.
     */
    constructor(place /*: Place */, startingStation /*: Station */, opponent /*: Opponent | null */){
        Object.seal(this);

        this.#place = place;
        this.remainingMoney = opponent === null ? place.startingMoney : 0;    //In two-player games, remainingMoney is negative and equals minus the amount of spent money
        this.remainingTime = place.startingTime;
        this.opponent = opponent;

        this.currentStation = startingStation;
        const startingLine = this.#place.lines.find(it => it.stopsAt(startingStation));
        const [startingPoint] = startingLine.pointsAtStation(startingStation);
        const opponentStartingLine = opponent === null ? null : this.#place.lines.find(it => it.stopsAt(opponent.currentStation));
        const [opponentStartingPoint] = opponentStartingLine?.pointsAtStation(opponent.currentStation) ?? [null];
        this.#place.gameView.setStartingPosition(startingPoint, opponentStartingPoint);
    }

    /**
     * Goes to a station assuming the line to get there has already been selected. Does not select a line or deduct the cost when playing with money, that's done in the GameView class. This is an async function that returns when the player has reached the destination.
     *
     * @param lineToTake    The line to take to get to the destination.
     * @param destination   The station to go to.
     * @param lookForLast   False if it should go the way it thinks is natural and true otherwise. Only useful for loops and circular lines.
     * @param fareEvade     True if the player is fare evading on this trip, false otherwise. Ignored if not playing with money.
     */
    async goToStation(lineToTake /*: Line */, destination /*: Station */, lookForLast /*: Boolean */, fareEvade /*: Boolean */) /*: void */ {
        //Start the timer if playing with time (do that here and not in the constructor to make sure that the timer only starts when the player actually starts playing)
        this.startTimer();

        //If not playing with money, the cost will be zero, so the fare evasion cost will be set to zero meaning no fare evasion
        const fareEvasionFine = fareEvade ? lineToTake.costBetweenStations(this.currentStation, destination, lookForLast) * Player.FARE_EVASION_FINE_FACTOR : 0;
        const fareEvasionCaughtProbabilityPerSecond = 0.05;
        const fareEvasionCaughtProbabilityAtArrival = 0.05;

        const branchToTake = lineToTake.branchBetweenStations(this.currentStation, destination);
        const segments = branchToTake.segmentsBetweenStations(this.currentStation, destination, lookForLast);

        this.currentStation = null;
        let alreadyCaughtFareEvading = false;
        this.fastingForward = false;

        this.opponent?.sendGoingToStationSignal(lineToTake, destination, lookForLast);

        this.#place.gameView.disableStationClickEvents();
        ToolbarButton.FastForwardButton.disabled = this.opponent !== null;

        for(let segment of segments){
            const speed = lineToTake.speed(segment);
            for(
                let position = 0;
                position < segment.length;
                position += this.#place.gameIsPaused ? 0 : Player.REFRESH_FREQUENCY * speed * lineToTake.speedFactor(branchToTake, segment, position)
            ){
                this.#place.gameView.setMyPosition(segment.pointAtLength(position));
                if(this.fastingForward){
                    this.decreaseTime(Player.REFRESH_FREQUENCY);
                }
                else{
                    await wait(Player.REFRESH_FREQUENCY * 1000);
                }
                if(!alreadyCaughtFareEvading && Math.random() < fareEvasionCaughtProbabilityPerSecond * Player.REFRESH_FREQUENCY){
                    alreadyCaughtFareEvading = true;
                    this.getCaughtFareEvading(fareEvasionFine);
                }
                if(!this.#place.isPlayingGame()){
                    break;
                }
            }
        }
        ToolbarButton.FastForwardButton.disabled = true;

        this.currentStation = destination;
        this.#place.gameView.enableStationClickEvents();
        const [point] = lineToTake.pointsAtStation(destination);
        this.#place.gameView.setMyPosition(point);

        if(!alreadyCaughtFareEvading && Math.random() < fareEvasionCaughtProbabilityAtArrival){
            this.getCaughtFareEvading(fareEvasionFine);
        }
    }

    /**
     * Collects a map and checks if the player won the game.
     *
     * @param map   The map to collect.
     */
    collect(map /*: LineWithMaps */) /*: void */ {
        this.startTimer();

        this.maps.add(map);
        this.#place.gameView.gameInfoBox.setNumberOfMaps(this.maps.size, this.#place.maps.length);

        this.opponent?.sendCollectSignal(map);

        //The player wins if they have all maps, except when playing with money in a two-player game and the opponent has less money in which case it's still possible that the opponent gets all maps later without spending more money
        if(this.maps.size === this.#place.maps.length && (this.opponent === null || !this.#place.playingWithMoney || this.opponent.remainingMoney < this.remainingMoney)){
            this.endGame(true);
        }
        //If it's a two-player game and both players have the same amount of money and all maps, it's a draw, in that case both players are considered to win
        else if(this.opponent !== null && this.maps.size === this.#place.maps.length && this.opponent.maps.size === this.#place.maps.length && this.#place.playingWithMoney && this.opponent.remainingMoney === this.remainingMoney){
            this.endGame(true);
        }
    }

    /**
     * Makes the player lose the money equal to the fine, shows a message that they got caught fare evading, and checks if they lost the game. If fine is zero, does nothing.
     *
     * @param fine  The fine that the player got for fare evading.
     */
    getCaughtFareEvading(fine /*: Number */) /*: void */ {
        this.spendMoney(fine);

        if(fine > 0){
            const policeOfficerIndex = Math.ceil(Math.random() * 6) - 1;
            Toastify({
                text: QObject.tr("You got caught fare evading and need to pay a fine of $%1.").arg(fine),
                close: true,
                duration: 5000,
                style: {
                    backgroundImage: `url(${staticDomain()}/images/police_officers/${policeOfficerIndex}.svg)`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "32px",
                    backgroundPosition: "center left",
                    paddingLeft: "32px",
                    backgroundColor: "orange"
                }
            }).showToast();
        }
    }

    /**
     * Starts the timer when playing with time. If not playing with time or if the timer is already started, does nothing.
     */
    startTimer() /*: void */ {
        if(!this.#place.playingWithMoney && this.#timer === null && this.opponent === null){
            this.#timer = setInterval(() => this.decreaseTime(), 1000);
        }
    }

    /**
     * Stops the timer when playing with time. If not playing with time or if the timer is already stopped, does nothing.
     */
    stopTimer() /*: void */ {
        clearInterval(this.#timer);
    }

    /**
     * Decreases the amount of available time left and checks if the player lost the game.
     *
     * @param time  The time in seconds to decrease the timer by.
     */
    decreaseTime(time /*: Number */ = 1) /*: void */ {
        if(!this.#place.gameIsPaused){
            this.remainingTime -= time;
            this.#place.gameView.gameInfoBox.setTime(this.remainingTime, this.#place.startingTime);

            if(!this.#place.playingWithMoney && this.remainingTime <= 0 && this.opponent === null){
                this.endGame(false);
            }
        }
    }

    /**
     * Decreases the amount of money the player has, and updates the game info box accordingly.
     *
     * @param moneySpent    The amount of money to spend.
     */
    spendMoney(moneySpent /*: Number */) /*: void */ {
        this.remainingMoney -= moneySpent;
        this.opponent?.sendSpentMoneySignal(moneySpent);

        const playerMoney = Math.abs(this.remainingMoney);
        const opponentMoney = Math.abs(this.opponent?.remainingMoney);
        const maxMoney = this.opponent === null ? this.#place.startingMoney : Math.max(playerMoney, opponentMoney, 1);
        this.#place.gameView.gameInfoBox.setMoney(playerMoney, maxMoney, this.opponent !== null, null);
        if(this.opponent !== null){
            this.#place.gameView.gameInfoBox.setMoney(opponentMoney, maxMoney, true, this.opponent);
        }

        if(this.#place.playingWithMoney && this.remainingMoney < (this.opponent?.remainingMoney ?? 0) && (this.opponent === null || this.opponent.maps.size === this.#place.maps.length)){
            this.endGame(false);
        }
    }

    /**
     * Shows the "you won" or "you lost" dialog, stops the timer and saves the statistics.
     *
     * @param won   True if the user won, false if the user lost.
     */
    async endGame(won /*: Boolean */) /*: void */ {
        this.stopTimer();
        this.fastingForward = false;
        let dialogText = won ? QObject.tr("Congratulations! You won!") : QObject.tr("Unfortunately you lost. Better luck next time!");

        if(won){
            dialogText += "<br/><br/>";
            const isLoggedIn = document.querySelector("meta[name=user-id]") !== null;
            if(isLoggedIn){
                dialogText += QObject.tr("Your statistics have been saved.");
            }
            else{
                dialogText += QObject.tr("You are not logged in, so your statistics haven't been saved.<br/><a href=\"%1\">Create a free account</a> if you want your statistics to be saved next time.").arg(ajaxDomain() + "/users/signup.php");
            }
        }

        const mapImage = won ? Player.#happyMap : Player.#sadMap;

        xdialog.open({
            title: won ? QObject.tr("You won") : QObject.tr("You lost"),
            body: "<span id=\"imagePlaceholder\"></span>" + dialogText,
            buttons: ["ok"],
            onok: () => this.#place.closeGame(),
            oncancel: () => this.#place.closeGame(),
            android_icon: window.Android ? imgToBase64(mapImage) : null
        });

        document.getElementById("imagePlaceholder")?.appendChild(mapImage);

        const statisticsToSave = {
            "won": won,
            "level": this.#place.level.toString(),
            "numberOfMaps": this.maps.size,
            "remainingTime": !this.#place.playingWithMoney && this.opponent === null ? this.remainingTime : 0,
            "remainingMoney": this.#place.playingWithMoney && this.opponent === null ? this.remainingMoney : 0,
            "opponentId": this.opponent?.userId ?? 0
        };
        const response = await sendRequest(ajaxDomain() + "/ajax/save-statistics.php", new URLSearchParams(statisticsToSave));
        if(response === null){
            const failedStatistics = JSON.parse(localStorage.getItem("failedStatistics") ?? "[]");
            failedStatistics.push(statisticsToSave);
            localStorage.setItem("failedStatistics", JSON.stringify(failedStatistics));
        }
    }
}
Player = typechecked(Player);
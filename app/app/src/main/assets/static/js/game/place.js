"use strict";

import typechecked from "https://gustavlindberg99.github.io/Typecheck.js/min/typecheck-v1.min.js";
import lodash from 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/+esm';
import {QObject} from "https://gustavlindberg99.github.io/QtLinguistWeb/qtranslator-v1.min.js";
import {Box} from "https://unpkg.com/@flatten-js/core@1.4.8/dist/main.mjs";
typechecked.add(Box);

import LoadingView from "../utils/loading-view.js";
import {staticDomain} from "../utils/ajax-utils.js";
import {refreshUI} from "../utils/async-utils.js";

import GameView from "./game-view.js";
import LineWithMaps from "./line-with-maps.js";
import NewGameView from "./new-game-view.js";
import PlaceParser from "./place-parser.js";
import Player from "./player.js";
import ToolbarButton from "./toolbar-button.js";
import TrainLine from "./train-line.js";

export default class Place{
    name /*: String */;
    flag /*: String */;
    filename /*: String */;
    latitude /*: Number */;
    longitude /*: Number */;
    level /*: Place.Level */;
    website /*: String */;
    startingTime /*: Number */;
    startingMoney /*: Number */;
    extras /*: Array<Place> */;

    stations /*: Array<Station> | null */ = null;
    lines /*: Array<Line> | null */ = null;
    zones /*: Array<Zone> | null */ = null;
    lakes /*: Array<Polygon> | null */ = null;
    rivers /*: Array<Multiline> | null */ = null;
    linesAreSimilar /*: function | null */ = null;

    gameView /*: GameView | null */ = null;
    playingWithMoney /*: Boolean | null */ = null;
    player /*: Player | null */ = null;
    opponent /*: Player | null */ = null;

    gameIsPaused /*: Boolean */ = false;

    #xmlDocument /*: XMLDocument | null */ = null;
    #parent /*: Place | null */ = null;

    static Level = class{
        static Easy = new this();
        static Medium = new this();
        static Difficult = new this();

        /**
         * Returns the color that should be displayed on the world map for places with this level.
         *
         * @return The color as a CSS string.
         */
        color() /*: String */ {
            switch(this){
            case Place.Level.Easy:
                return "green";
            case Place.Level.Medium:
                return "yellow";
            case Place.Level.Difficult:
                return "red";
            }
        }

        /**
         * Returns a human-readable string corresponding to this level.
         *
         * @returns A human-readable string corresponding to this level.
         */
        name() /*: String */ {
            switch(this){
            case Place.Level.Easy:
                return QObject.tr("Easy");
            case Place.Level.Medium:
                return QObject.tr("Medium");
            case Place.Level.Difficult:
                return QObject.tr("Difficult");
            }
        }

        /**
         * Returns a machine-readable string corresponding to this level.
         *
         * @returns A machine-readable string corresponding to this level.
         */
        toString() /*: String */ {
            switch(this){
            case Place.Level.Easy:
                return "easy";
            case Place.Level.Medium:
                return "medium";
            case Place.Level.Difficult:
                return "difficult";
            }
        }
    }

    /**
     * Constructs a Place object.
     *
     * @param name          The human-readable name of this place.
     * @param flag          The file name of the flag of the country this place is in.
     * @param filename      The file name of the XML file containing this place's stations and lines. If this place is an extra, a : character followed by the extra's id should be added to the end.
     * @prarm latitude      The latitude of this place in degrees.
     * @param longitude     The longitude of this place in degrees.
     * @param level         The level of difficulty of this place.
     * @param website       The URL to the website of the company that operates public transportation in this place in real life.
     * @param startingTime    The length of a game in seconds when playing with time.
     * @param startingMoney The money that is available at the start of the game when playing with money.
     * @param extras        An array with all the extras contained in this place. If this place doesn't have extras or is itself an extra, this array should be empty.
     */
    constructor(
        name /*: String */,
        flag /*: String */,
        filename /*: String */,
        latitude /*: Number */,
        longitude /*: Number */,
        level /*: Place.Level */,
        website /*: String */,
        startingTime /*: Number */,
        startingMoney /*: Number */,
        extras /*: Array<Place> */ = []
    ){
        Object.seal(this);

        this.name = name;
        this.flag = flag;
        this.filename = filename;
        this.latitude = latitude;
        this.longitude = longitude;
        this.level = level;
        this.website = website;
        this.startingTime = startingTime;
        this.startingMoney = startingMoney;
        this.extras = extras;
        for(let extra of extras){
            extra.#parent = this;
        }
    }

    /**
     * A human-readable string containing the country this place is in.
     */
    get country() /*: String */ {
        switch(this.flag){
        case "denmark.svg":
            return QObject.tr("Denmark");
        case "finland.svg":
            return QObject.tr("Finland");
        case "france.svg":
            return QObject.tr("France");
        case "germany.svg":
            return QObject.tr("Germany");
        case "hungary.svg":
            return QObject.tr("Hungary");
        case "italy.svg":
            return QObject.tr("Italy");
        case "portugal.svg":
            return QObject.tr("Portugal");
        case "sweden.svg":
            return QObject.tr("Sweden");
        case "united_states.svg":
            return QObject.tr("United States");
        }
    }

    /**
     * All the maps at this place. Null if the place hasn't been loaded yet.
     */
    get maps() /*: Array<LineWithMaps> | null */ {
        return this.lines?.filter(it => it instanceof LineWithMaps) ?? null;
    }

    /**
     * Returns a box containing which part of the map area should be shown based on which coordinates lines and stations are at.
     *
     * @return A box containing which part of the map area should be shown.
     */
    box() /*: Box */ {
        const stationsX = this.stations.map(it => it.point.x);
        const stationsY = this.stations.map(it => it.point.y);
        const textMinX = this.stations.map(it => it.textBox().xmin);
        const textMaxX = this.stations.map(it => it.textBox().xmax);
        const textMinY = this.stations.map(it => it.textBox().ymin);
        const textMaxY = this.stations.map(it => it.textBox().ymax);

        const MARGIN_X = 64;
        const MARGIN_Y = 16;

        return new Box(
            Math.min(...stationsX, ...textMinX) - MARGIN_X,
            Math.min(...stationsY, ...textMinY) - MARGIN_Y,
            Math.max(...stationsX, ...textMaxX) + MARGIN_X,
            Math.max(...stationsY, ...textMaxY) + MARGIN_Y
        );
    }

    /**
     * Checks if a game in this place is currently in progress.
     *
     * @return True if a game is in progress, false if it isn't.
     */
    isPlayingGame() /*: Boolean */ {
        return this.player !== null;
    }

    /**
     * Starts a new game.
     *
     * @param useMoney          True if playing with money, false if playing with time.
     * @param opponent          The opponent if playing a two-player game, or null if playing a one-player game.
     * @param sendInvitation    If true, send an invitation to the opponent if playing a two-player game. If false, don't send an invitation (useful if the opponent already sent the invitation). This parameter doesn't have any effect when playing a one-player game (i.e. opponent is null).
     *
     * @return True on success, false on failure.
     */
    async startGame(useMoney /*: Boolean */, opponent /*: Opponent | null */, sendInvitation /*: Boolean */) /*: Boolean */ {
        const loadingView = new LoadingView(document.querySelector("section[role=application]"), true);
        let cancelled = false;
        const cancelButtonPromise = loadingView.waitForCancelButtonPressed().then(() => {
            cancelled = true;
            loadingView.close();
            opponent?.disconnect();
        });

        this.playingWithMoney = useMoney;
        await Promise.race([cancelButtonPromise, refreshUI()]);    //Use Promise.race instead of Promise.any because if one of the promises throws, Promise.race throws whereas Promise.any does nothing (none of the promises are supposed to throw, but if they do, it's easier to debug with Promise.race)
        if(cancelled){
            return true;
        }

        let dataFromOpponent = null;
        if(opponent !== null && sendInvitation){
            dataFromOpponent = await opponent.sendInvitation();
            if(dataFromOpponent === null){    //If the invitation was declined
                loadingView.close();
                return true;
            }
        }

        const downloadSucceeded = await Promise.race([cancelButtonPromise, this.download()]);
        if(cancelled){
            return true;
        }
        else if(!downloadSucceeded){
            loadingView.close();
            return false;
        }

        await this.parse();

        const possibleStartingStations = this.stations.filter(it => !it.zone.isOutside());
        let startingStation;
        if(opponent !== null && !sendInvitation){
            startingStation = lodash.sample(possibleStartingStations);
            opponent.currentStation = lodash.sample(possibleStartingStations);
        }
        if(dataFromOpponent === null){
            startingStation = lodash.sample(possibleStartingStations);
            this.initializeAvailableMaps();
        }
        else{
            const [opponentStartingStation, myStartingStation, stationMaps, lineMaps] = dataFromOpponent;
            startingStation = this.stations.find(it => it.id === myStartingStation);
            opponent.currentStation = this.stations.find(it => it.id === opponentStartingStation);
            for(let i = 0; i < this.stations.length; i++){
                this.stations[i].availableMaps = stationMaps[i].map(it => this.lines[it]);
            }
            for(let i = 0; i < this.lines.length; i++){
                if(this.lines[i] instanceof LineWithMaps){
                    this.lines[i].availableMaps = lineMaps[i].map(it => this.lines[it]);
                }
            }
        }
        await refreshUI();

        this.gameView = new GameView(this, startingStation, opponent);
        this.player = new Player(this, startingStation, opponent);

        loadingView.close();

        this.gameView.enableStationClickEvents();

        if(!cancelled){
            this.gameView.show();
        }

        ToolbarButton.NewGameButton.onclick = () => xdialog.open({
            title: QObject.tr("Exit game?"),
            body: QObject.tr("Do you really want to exit the game? It will not be saved."),
            buttons: {ok: QObject.tr("Yes"), cancel: QObject.tr("No")},
            onok: () => {
                this.player.opponent?.disconnect();
                this.closeGame();
            }
        });
        ToolbarButton.PauseButton.onclick = () => this.gameIsPaused = !this.gameIsPaused;
        ToolbarButton.FastForwardButton.onclick = () => this.player.fastingForward = true;

        ToolbarButton.NewGameButton.disabled = false;
        ToolbarButton.PauseButton.disabled = opponent !== null;

        if(cancelled){
            this.player = null;    //So that the Opponent class knows to send a decline signal
        }

        return true;
    }

    /**
     * Closes the game and shows the new game view.
     */
    closeGame() /*: void */ {
        this.player.stopTimer();
        this.player = null;
        this.gameIsPaused = false;
        this.gameView.closeBubble();

        ToolbarButton.NewGameButton.onclick = null;
        ToolbarButton.PauseButton.onclick = null;
        ToolbarButton.FastForwardButton.onclick = null;
        ToolbarButton.NewGameButton.disabled = true;
        ToolbarButton.PauseButton.disabled = true;
        ToolbarButton.FastForwardButton.disabled = true;

        for(let button of document.querySelectorAll(".toolbar > button:not(:last-child)")){
            button.disabled = true;
        }

        NewGameView.show();
    }

    /**
     * Randomly initializes which maps are available at each station and on each line.
     */
    initializeAvailableMaps() /*: void */ {
        const hiddenMap = lodash.sample(this.maps);

        //Initialize maps at stations
        for(let station of this.stations){
            station.initializeAvailableMaps(hiddenMap);
        }

        //Initialize maps on lines
        for(let line of this.maps){
            //Make sure each map is available at at least one station on the line
            const stations = [...line.stations()].filter(it => it.canHaveMaps());
            if(stations.length > 0 && !stations.some(it => it.availableMaps.includes(line))){
                lodash.sample(stations).availableMaps.push(line);
            }

            //Initialize maps on this line
            const forceOwnMap = stations.length === 0;  //If the line only stops at bus stops, we can't guarantee that it will be available at a station, so the map must be available on the line itself
            line.initializeAvailableMaps(hiddenMap, forceOwnMap);
        }
    }

    /**
     * Downloads all the information about this place needed to start a game. If all the information needed is already downloaded, just returns true.
     *
     * @return True on success, false on failure.
     */
    async download() /*: Boolean */ {
        if(this.#xmlDocument !== null){
            return true;
        }

        let response;
        try{
            response = await fetch(staticDomain() + "/places/" + this.filename.split(":")[0]);
        }
        catch{
            return false;
        }
        const responseText = await response.text();
        const xmlDocument = new DOMParser().parseFromString(responseText, "text/xml");
        const parserError = xmlDocument.querySelector("parsererror");
        if(parserError !== null){
            console.error("Error parsing XML: " + parserError.textContent);
            return false;
        }

        if(this.#xmlDocument !== null){
            //If another instance of this async function is already done, we don't need to do anything
            return true;
        }

        this.#xmlDocument = xmlDocument;
        for(let extra of this.extras){
            extra.#xmlDocument = xmlDocument;
        }
        if(this.#parent !== null){
            this.#parent.#xmlDocument = xmlDocument;
        }
        return true;
    }

    /**
     * Parses the information about this place from XML and fills the member variables of this object with that information. Assumes that download() has already been called.
     */
    async parse() /*: void */ {
        if(this.zones !== null){
            return;
        }

        const parser = new PlaceParser(this.#xmlDocument, this.filename);

        //To avoid race conditions, first assign to local variables, then if everything is still null assing to the member variables
        const zones = parser.zones();
        const lakes = parser.lakes();
        const rivers = parser.rivers();
        const stations = await parser.stations(this);
        const lines = await parser.lines(this);
        const linesAreSimilar = parser.linesAreSimilar();

        this.zones ??= zones;
        this.lakes ??= lakes;
        this.rivers ??= rivers;
        this.stations ??= stations;
        this.lines ??= lines;
        this.linesAreSimilar ??= linesAreSimilar;
    }
}
Place = typechecked(Place);
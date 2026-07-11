import lodash from "https://cdn.jsdelivr.net/npm/lodash@4.17.21/+esm";
import i18next from "https://unpkg.com/i18next@25.6.0/dist/esm/i18next.js";
import {Box, Multiline, Polygon} from "https://unpkg.com/@flatten-js/core@1.4.8/dist/main.mjs";

import {refreshUI, staticDomain} from "../utils.js";

import GameView from "./game-view.js";
import Line from "./line.js";
import LineWithMaps from "./line-with-maps.js";
import LoadingView from "../loading-view.js";
import NewGameView from "./new-game-view.js";
import Opponent from "./opponent.js";
import PlaceParser from "./place-parser.js";
import PlaceParseException from "./place-parse-exception.js";
import Player from "./player.js";
import Station from "./station.js";
import ToolbarButton from "./toolbar-button.js";
import Zone from "./zone.js";

class Place{
    name: string;
    flag: string;
    filename: string;
    latitude: number;
    longitude: number;
    level: Place.Level;
    website: string;
    startingTime: number;
    startingMoney: number;
    extras: Array<Place>;

    stations: Array<Station> | null = null;
    lines: Array<Line> | null = null;
    zones: Array<Zone> | null = null;
    lakes: Array<Polygon> | null = null;
    rivers: Array<Multiline> | null = null;
    linesAreSimilar: ((line1: Line, line2: Line) => boolean) | null = null;

    gameView: GameView | null = null;
    playingWithMoney: boolean | null = null;
    player: Player | null = null;
    opponent: Player | null = null;

    gameIsPaused: boolean = false;

    #xmlDocument: XMLDocument | null = null;
    #parent: Place | null = null;

    /**
     * Constructs a Place object.
     *
     * @param name          The human-readable name of this place.
     * @param flag          The file name of the flag of the country this place is in.
     * @param filename      The file name of the XML file containing this place's stations and lines. If this place is an extra, a : character followed by the extra's id should be added to the end.
     * @param latitude      The latitude of this place in degrees.
     * @param longitude     The longitude of this place in degrees.
     * @param level         The level of difficulty of this place.
     * @param website       The URL to the website of the company that operates public transportation in this place in real life.
     * @param startingTime  The length of a game in seconds when playing with time.
     * @param startingMoney The money that is available at the start of the game when playing with money.
     * @param extras        An array with all the extras contained in this place. If this place doesn't have extras or is itself an extra, this array should be empty.
     */
    constructor(
        name: string,
        flag: string,
        filename: string,
        latitude: number,
        longitude: number,
        level: Place.Level,
        website: string,
        startingTime: number,
        startingMoney: number,
        extras: Array<Place> = []
    ){
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
    get country(): string {
        switch(this.flag){
        case "denmark.svg":
            return i18next.t("Denmark");
        case "finland.svg":
            return i18next.t("Finland");
        case "france.svg":
            return i18next.t("France");
        case "germany.svg":
            return i18next.t("Germany");
        case "hungary.svg":
            return i18next.t("Hungary");
        case "italy.svg":
            return i18next.t("Italy");
        case "portugal.svg":
            return i18next.t("Portugal");
        case "spain.svg":
            return i18next.t("Spain");
        case "sweden.svg":
            return i18next.t("Sweden");
        case "united_kingdom.svg":
            return i18next.t("United Kingdom");
        case "united_states.svg":
            return i18next.t("United States");
        default:
            throw new PlaceParseException("Unknown country: " + this.flag);
        }
    }

    /**
     * All the maps at this place. Null if the place hasn't been loaded yet.
     */
    get maps(): Array<LineWithMaps> | null {
        return this.lines?.filter(it => it instanceof LineWithMaps) ?? null;
    }

    /**
     * Returns a box containing which part of the map area should be shown based on which coordinates lines and stations are at.
     *
     * @return A box containing which part of the map area should be shown.
     */
    box(): Box {
        const stationsX = this.stations!!.map(it => it.point.x);
        const stationsY = this.stations!!.map(it => it.point.y);
        const textMinX = this.stations!!.map(it => it.textBox().xmin);
        const textMaxX = this.stations!!.map(it => it.textBox().xmax);
        const textMinY = this.stations!!.map(it => it.textBox().ymin);
        const textMaxY = this.stations!!.map(it => it.textBox().ymax);

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
    isPlayingGame(): boolean {
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
    async startGame(useMoney: boolean, opponent: Opponent | null, sendInvitation: boolean): Promise<boolean> {
        const loadingView = new LoadingView(document.querySelector("section[role=application]")!!, true);
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

        let dataFromOpponent: [string, string, Array<Array<number>>, Array<Array<number>>] | null = null;
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

        const stations = this.stations!!;
        const lines = this.lines!!;
        const possibleStartingStations = stations.filter(it => !it.zone.isOutside());
        let startingStation: Station;
        if(opponent !== null && !sendInvitation){
            startingStation = lodash.sample(possibleStartingStations)!!;
            opponent.currentStation = lodash.sample(possibleStartingStations)!!;
        }
        if(dataFromOpponent === null){
            startingStation = lodash.sample(possibleStartingStations)!!;
            this.initializeAvailableMaps();
        }
        else{
            const [opponentStartingStation, myStartingStation, stationMaps, lineMaps] = dataFromOpponent;
            startingStation = stations.find(it => it.id === myStartingStation)!!;
            opponent!!.currentStation = stations.find(it => it.id === opponentStartingStation)!!;
            for(let i = 0; i < stations.length; i++){
                this.stations!![i].availableMaps = stationMaps[i].map(it => this.lines!![it]).filter(it => it instanceof LineWithMaps);
            }
            for(let [i, line] of lines.entries()){
                if(line instanceof LineWithMaps){
                    line.availableMaps = lineMaps[i].map(it => lines[it]).filter(it => it instanceof LineWithMaps);
                }
            }
        }
        await refreshUI();

        loadingView.close();

        this.gameView = new GameView(this, startingStation, opponent);
        this.player = new Player(this, startingStation, opponent);

        this.gameView.enableStationClickEvents();

        if(!cancelled){
            this.gameView.show();
        }

        ToolbarButton.NewGameButton.onclick = () => xdialog.open({
            title: i18next.t("Exit game?"),
            body: i18next.t("Do you really want to exit the game? It will not be saved."),
            buttons: {ok: i18next.t("Yes"), cancel: i18next.t("No")},
            onok: () => {
                this.player!!.opponent?.disconnect();
                this.closeGame();
            }
        });
        ToolbarButton.PauseButton.onclick = () => this.gameIsPaused = !this.gameIsPaused;
        ToolbarButton.FastForwardButton.onclick = () => this.player!!.fastingForward = true;

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
    closeGame(): void {
        this.player!!.stopTimer();
        this.player = null;
        this.gameIsPaused = false;
        this.gameView!!.closeBubble();

        ToolbarButton.NewGameButton.onclick = null;
        ToolbarButton.PauseButton.onclick = null;
        ToolbarButton.FastForwardButton.onclick = null;
        ToolbarButton.NewGameButton.disabled = true;
        ToolbarButton.PauseButton.disabled = true;
        ToolbarButton.FastForwardButton.disabled = true;

        for(let button of document.querySelectorAll<HTMLButtonElement>(".toolbar > button:not(:last-child)")){
            button.disabled = true;
        }

        NewGameView.show();
    }

    /**
     * Randomly initializes which maps are available at each station and on each line.
     */
    initializeAvailableMaps(): void {
        const hiddenMap = lodash.sample(this.maps);

        //Initialize maps at stations
        for(let station of this.stations!!){
            station.initializeAvailableMaps(hiddenMap!!);
        }

        //Initialize maps on lines
        for(let line of this.maps!!){
            //Make sure each map is available at at least one station on the line
            const stations = [...line.stations()].filter(it => it.canHaveMaps());
            if(stations.length > 0 && !stations.some(it => it.availableMaps.includes(line))){
                lodash.sample(stations)!!.availableMaps.push(line);
            }

            //Initialize maps on this line
            const forceOwnMap = stations.length === 0;  //If the line only stops at bus stops, we can't guarantee that it will be available at a station, so the map must be available on the line itself
            line.initializeAvailableMaps(hiddenMap!!, forceOwnMap);
        }
    }

    /**
     * Downloads all the information about this place needed to start a game. If all the information needed is already downloaded, just returns true.
     *
     * @return True on success, false on failure.
     */
    async download(): Promise<boolean> {
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
    async parse(): Promise<void> {
        if(this.zones !== null){
            return;
        }

        const parser = new PlaceParser(this.#xmlDocument!!, this.filename);

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

namespace Place {
    export class Level {
        static readonly Easy = new this("green");
        static readonly Medium = new this("yellow");
        static readonly Difficult = new this("red");

        readonly color: string;

        /**
         * Private constructor as this class is enum-like.
         *
         * @param color Returns the color that should be displayed on the world map for places with this level.
         */
        private constructor(color: string){
            this.color = color;
        }

        /**
         * Returns a human-readable string corresponding to this level.
         *
         * @returns A human-readable string corresponding to this level.
         */
        name(): string {
            switch(this){
            case Place.Level.Easy:
                return i18next.t("Easy");
            case Place.Level.Medium:
                return i18next.t("Medium");
            case Place.Level.Difficult:
                return i18next.t("Difficult");
            default:
                throw new TypeError("Unknown level");
            }
        }

        /**
         * Returns a machine-readable string corresponding to this level.
         *
         * @returns A machine-readable string corresponding to this level.
         */
        id(): string {
            switch(this){
            case Place.Level.Easy:
                return "easy";
            case Place.Level.Medium:
                return "medium";
            case Place.Level.Difficult:
                return "difficult";
            default:
                throw new TypeError("Unknown level");
            }
        }
    }
}

export default Place;

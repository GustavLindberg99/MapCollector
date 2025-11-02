import lodash from "https://cdn.jsdelivr.net/npm/lodash@4.17.21/+esm";
import i18next from "https://unpkg.com/i18next@25.6.0/dist/esm/i18next.js";
import {Point} from "https://unpkg.com/@flatten-js/core@1.4.8/dist/main.mjs";

import Branch from "./branch.js";
import Line from "./line.js";
import Place from "./place.js";
import Station from "./station.js";

export default abstract class LineWithMaps extends Line {
    viaStation: string | null;
    availableMaps: Array<LineWithMaps> = [];

    #place: Place;

    /**
     * Constructs a LineWithMaps object. Can only be used by subclasses since this class is abstract.
     *
     * @param place         The place that this line belongs to.
     * @param name          The name of the line.
     * @param color         The color of the line in hex format starting with a # character (for example #abcdef).
     * @param branches      An array with all the branches of the line.
     * @param labels        An array with the points at which labels for this line should be drawn.
     * @param viaStation    The station to be displayed as "via" on maps, or null if this line doesn't have any.
     */
    constructor(place: Place, name: string, color: string, branches: Array<Branch>, labels: Array<Point>, viaStation: string | null){
        super(name, color, branches, labels);

        this.#place = place;
        this.viaStation = viaStation;
    }

    /**
     * Randomly initializes the available maps on this line. Can't be done in the constructor beecause all lines need to be constructed first.
     *
     * @param hiddenMap     The map that's hidden, i.e. has is harder to find than the other ones.
     * @param forceOwnMap   If this parameter is true, the map of this line itself will always be available on this line. Useful for bus lines that only stop at bus stops in order to be able to guarantee that all maps are available somewhere.
     */
    initializeAvailableMaps(hiddenMap: LineWithMaps, forceOwnMap: boolean): void {
        const probabilities =
              //Hidden  //Not hidden
            [[0,        0.005],     //Unrelated line of a different type (train or bus line)
             [0.02,     0.03],      //Unrelated line of the same type
             [0.02,     0.2],       //Similar line
             [0.1,      0.5]];      //Same line

        for(let map of this.#place.maps!!){
            const similarity = Number(map.constructor === this.constructor) + Number(this.#place.linesAreSimilar!!(map, this)) + Number(map === this);
            const isHidden = Number(map !== hiddenMap);
            if((forceOwnMap && map === this) || Math.random() < probabilities[similarity][isHidden]){
                this.availableMaps.push(map);
            }
        }
    }

    /**
     * Returns which end stations should be displayed on maps. Includes potential via stations, dashes to separate the station names and "circular" for circular lines.
     *
     * @return The string that should be displayed on maps.
     */
    endStations(): string {
        const startStations = new Set(this.branches.map(it => it.stations()[0].name));
        const endStations = new Set(this.branches.map(it => it.stations().at(-1)!!.name));
        if(lodash.isEqual(startStations, endStations)){
            const [endStation] = startStations;
            return endStation + " " + i18next.t("(Circular)");
        }
        let result = [...startStations].join(" / ") + " - " + [...endStations].join(" / ");
        if(this.viaStation !== null){
            result += " " + i18next.t("(via {{arg}})", {arg: this.viaStation});
        }
        return result;
    }

    /**
     * Calculates the cost to go between two stations. If not playing with money, always returns 0.
     *
     * @param start         The station the player is starting at.
     * @param end           The station to calculate the cost to go to.
     * @param lookForLast   False if it should go the way it thinks is natural and true otherwise. Only useful for loops and circular lines.
     *
     * @return The cost to go from start to end, or 0 if not playing with money.
     */
    override costBetweenStations(start: Station, end: Station, lookForLast: boolean): number {
        if(!this.#place.playingWithMoney){
            return 0;
        }
        return this.branchBetweenStations(start, end)!!.costBetweenStations(start, end, lookForLast, this.#place.zones!!);
    }

    /**
     * Checks if this line's map is in the player's collection.
     *
     * @return True if the player has this map, false otherwise.
     */
    inCollection(): boolean {
        return this.#place.player?.maps.has(this) ?? false;
    }
}

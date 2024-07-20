"use strict";

import typechecked from "https://gustavlindberg99.github.io/Typecheck.js/min/typecheck-v1.min.js";
import {Box, Point} from "https://unpkg.com/@flatten-js/core@1.4.8/dist/main.mjs";
typechecked.add(Box, Point);

import {getTextWidth} from "../utils/graphic-utils.js";

import PlaceParseException from "./place-parse-exception.js";
import Zone from "./zone.js";

export default class Station{
    nameAsInFile /*: String */;
    id /*: String */;
    point /*: Point */;
    alignment /*: Station.Alignment */;
    width /*: Number | null */;
    height /*: Number | null */;
    zone /*: Zone */;
    implicit /*: Boolean */;
    availableMaps /*: Array<LineWithMaps> */ = [];

    #place /*: Place */;
    #cachedTextBox /*: Box | null */ = null;

    static FONT_SIZE = 12;
    static MARKER_SIZE = 5;
    static PARAGRAPH_SEPARATION = 1.4;

    /**
     * Enum representing which side of the station the station name should be displayed on.
     */
    static Alignment = class{
        static Right = new this();
        static Left = new this();
        static Top = new this();
        static Bottom = new this();
        static Invisible = new this();

        /**
         * Converts a string to an Alignment enum instance. Useful for parsing XML files where everything is stored as strings.
         *
         * @param str   The string to convert to an enum instance.
         *
         * @return The enum instance that corresponds to the given string.
         */
        static fromString(str /*: String */) /*: Station.Alignment */ {
            switch(str[0]){
            case "r":
                return Station.Alignment.Right;
            case "l":
                return Station.Alignment.Left;
            case "t":
                return Station.Alignment.Top;
            case "b":
                return Station.Alignment.Bottom;
            case "n":
                return Station.Alignment.Invisible;
            default:
                throw new PlaceParseException("Unknown station alignment " + str);
            }
        }

        /**
         * Returns a string that can be used in the text-anchor SVG attribute.
         *
         * @return "start" for right alignment, "end" for left alignment and "middle" for top or bottom alignment.
         */
        textAnchor() /*: String */ {
            switch(this){
            case Station.Alignment.Right:
                return "start";
            case Station.Alignment.Left:
                return "end";
            case Station.Alignment.Top:
            case Station.Alignment.Bottom:
                return "middle";
            }
        }
    }

    /**
     * Constructs a Station object.
     *
     * @param place     The place that this station belongs to.
     * @param allZones  All the zones in the place. Used to determine which zone this station is in. We can't use place.zones because that's not initialized yet.
     * @param name      The name of this station, with line breaks and with hyphens encoded as soft hyphen characters (\xad).
     * @param id        The id of the station.
     * @param x         The x coordinate of this station.
     * @param y         The y coordinate of this station.
     * @param alignment The side of the station that the station name should be displayed on.
     * @param width     If this station is a large white rectangle with black border, the width of that rectangle. If each line has a separate station marker, this parameter should be null.
     * @param width     If this station is a large white rectangle with black border, the height of that rectangle. If each line has a separate station marker, this parameter should be null.
     * @param implicit  True if this station was created with an <autostation> tag, false otherwise.
     */
    constructor(
        place /*: Place */,
        allZones /*: Array<Zone> */,
        name /*: String */,
        id /*: String */,
        x /*: Number */,
        y /*: Number */,
        alignment /*: Station.Alignment */,
        width /*: Number | null */,
        height /*: Number | null */,
        implicit /*: Boolean */
    ){
        Object.seal(this);

        this.#place = place;
        this.nameAsInFile = name;
        this.id = id;
        this.point = new Point(x, y);
        this.alignment = alignment;
        this.implicit = implicit;

        if((width === null) !== (height === null)){
            throw new PlaceParseException(`Width and height for station ${this.name} must either both be null or both be non-null`);
        }

        this.width = width === null ? width : width * Station.MARKER_SIZE;
        this.height = height === null ? height : height * Station.MARKER_SIZE;

        if(this.name.length === 0){
            throw new PlaceParseException("A station has an empty name");
        }

        //Zones
        this.zone = Zone.zoneAtPoint(allZones, this.point);

        if(this.zone === undefined){    //If the station is not in any zone at all
            throw new PlaceParseException(`Station ${this.name} is not in a zone`);
        }
    }

    /**
     * The name of the station without line breaks or hyphens.
     */
    get name() /*: String */ {
        return this.nameAsInFile.replace(/[\n\xad]/g, "");
    }

    /**
     * The name of the station with line breaks and with soft hyphens replaced with a - character followed by a line break.
     */
    get nameWithLineBreaks() /*: String */ {
        return this.nameAsInFile.replaceAll("\xad", "-\n");
    }

    /**
     * Gets the box that contains all station markers for this station, but not the text.
     *
     * @return A box object with that box.
     */
    stationBox() /*: Box */ {
        if(this.width !== null && this.height !== null){
            return new Box(
                this.point.x - this.width / 2,
                this.point.y - this.height / 2,
                this.point.x + this.width / 2,
                this.point.y + this.height / 2
            );
        }
        let result = new Box();
        for(let line of this.#place.lines){
            if(line.stopsAt(this)){
                for(let point of line.pointsAtStation(this)){
                    result = result.merge(new Box(
                        point.x + Station.MARKER_SIZE / 2,
                        point.y + Station.MARKER_SIZE / 2,
                        point.x - Station.MARKER_SIZE / 2,
                        point.y - Station.MARKER_SIZE / 2
                    ));
                }
            }
        }
        if(result.xmin === undefined){
            throw new PlaceParseException("No line stops at station " + this.id);
        }
        return result;
    }

    /**
     * Gets the box that contains all the text for this station, but not the station markers.
     *
     * @return A box object with that box.
     */
    textBox() /*: Box */ {
        if(this.#cachedTextBox === null){
            const numberOfLineBreaks = this.nameWithLineBreaks.match(/\n/g)?.length ?? 0;
            const textWidth = getTextWidth(this.nameWithLineBreaks, "sans-serif", Station.FONT_SIZE + "px");
            const textHeight = numberOfLineBreaks * Station.FONT_SIZE * Station.PARAGRAPH_SEPARATION + Station.FONT_SIZE;

            const MARGIN = 8;

            let x, y;
            switch(this.alignment){
            case Station.Alignment.Right:
                x = this.stationBox().xmax + MARGIN;
                y = this.stationBox().center.y - Station.FONT_SIZE / 2;
                break;
            case Station.Alignment.Left:
                x = this.stationBox().xmin - MARGIN - textWidth;
                y = this.stationBox().center.y - Station.FONT_SIZE / 2;
                break;
            case Station.Alignment.Top:
                x = this.stationBox().center.x - textWidth / 2;
                y = this.stationBox().ymin - textHeight - MARGIN;
                break;
            case Station.Alignment.Bottom:
                x = this.stationBox().center.x - textWidth / 2;
                y = this.stationBox().ymax + MARGIN;
                break;
            }

            this.#cachedTextBox = new Box(x, y, x + textWidth, y + textHeight);
        }
        return this.#cachedTextBox;
    }

    /**
     * Checks if this station can have maps, i.e. if it's a train station
     *
     * @return True if it can have maps, false if it can't.
     */
    canHaveMaps() /*: Boolean */ {
        return this.#place.lines.some(it => it.allStationsCanHaveMaps() && it.stopsAt(this));
    }

    /**
     * Randomly initializes the available maps at this station.
     *
     * @param hiddenMap The map that's hidden, i.e. has is harder to find than the other ones.
     */
    initializeAvailableMaps(hiddenMap /*: LineWithMaps */) /*: void */ {
        this.availableMaps = [];
        if(!this.canHaveMaps()){
            return;
        }

        const isMajor = this.#place.maps.filter(it => it.stopsAt(this)).length >= 5;
        const probabilities =
            isMajor ?
              //Hidden  //Not hidden
            [[0.7,      0.9],       //Stops here
             [0.04,     0.1]]       //Doesn't stop here
            :
              //Hidden  //Not hidden
            [[0.1,      0.8],       //Stops here
             [0.04,     0.04]];     //Doesn't stop here

        for(let map of this.#place.maps){
            const stopsHere = Number(!map.stopsAt(this));
            const isHidden = Number(map !== hiddenMap);
            if(Math.random() < probabilities[stopsHere][isHidden]){
                this.availableMaps.push(map);
            }
        }
    }
}
Station = typechecked(Station);
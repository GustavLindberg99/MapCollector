"use strict";

import typechecked from "https://gustavlindberg99.github.io/Typecheck.js/min/typecheck-v1.min.js";

import LineWithMaps from "./line-with-maps.js";

export default class BusLine extends LineWithMaps{
    /**
     * Constructs a train line.
     *
     * @param place         The place that this line belongs to.
     * @param name          The name of the line.
     * @param color         The color of the line in hex format starting with a # character (for example #abcdef).
     * @param branches      An array with all the branches of the line.
     * @param labels        An array with the points at which labels for this line should be drawn.
     * @param viaStation    The station to be displayed as "via" on maps, or null if this line doesn't have any.
     */
    constructor(place /*: Place */, name /*: String */, color /*: String */, branches /*: Array<Branch> */, labels /*: Array<Point> */, viaStation /*: String | null */){
        super(place, name, color, branches, labels, viaStation);
        Object.seal(this);
    }

    /**
     * Gets the speed associated to this line type.
     *
     * @param segment   The segment to get the speed for. Not used in this class' version of this method.
     *
     * @return The speed in pixels per second, 25 for walking lines.
     */
    speed(segment /*: Segment */) /*: Number */ {
        return 25;
    }
}
BusLine = typechecked(BusLine);
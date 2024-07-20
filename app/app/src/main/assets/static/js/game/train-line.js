"use strict";

import typechecked from "https://gustavlindberg99.github.io/Typecheck.js/min/typecheck-v1.min.js";

import LineWithMaps from "./line-with-maps.js";
import Station from "./station.js";

export default class TrainLine extends LineWithMaps{
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
     * This method overrides the method from the Line class, and is meant to be used in Station.canHaveMaps(). We can't just use instanceof Trainline in the Station class because that would cause circular imports which Javascript doesn't support for some reason.
     *
     * @return True since this is a train line.
     */
    allStationsCanHaveMaps() /*: Boolean */ {
        return true;
    }

    /**
     * Gets the width of the line, i.e. its thickness when drawn. Overrides the default width from the Line class.
     *
     * @return The width of the line in pixels.
     */
    width() /*: Number */ {
        return Station.MARKER_SIZE * 0.8;
    }

    /**
     * Gets the font size to use in this line's labels. Overrides the default font size from the Line class.
     *
     * @return The font size in pixels.
     */
    labelFontSize() /*: Number */ {
        return 10;
    }

    /**
     * Gets the speed associated to this line type.
     *
     * @param segment   The segment to get the speed for, used to determine whether to use the regular speed or the TGV speed.
     *
     * @return The speed in pixels per second, 40 for regular train lines and 80 for TGV segments.
     */
    speed(segment /*: Segment */) /*: Number */ {
        return this.branches.some(it => it.segmentIsTGV(segment)) ? 80 : 40;
    }
}
TrainLine = typechecked(TrainLine);
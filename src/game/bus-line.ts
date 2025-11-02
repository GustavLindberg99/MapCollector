import {Point, Segment} from "https://unpkg.com/@flatten-js/core@1.4.8/dist/main.mjs";

import Branch from "./branch.js";
import LineWithMaps from "./line-with-maps.js";
import Place from "./place.js";

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
    constructor(place: Place, name: string, color: string, branches: Array<Branch>, labels: Array<Point>, viaStation: string | null){
        super(place, name, color, branches, labels, viaStation);
    }

    /**
     * Gets the speed associated to this line type.
     *
     * @param segment   The segment to get the speed for. Not used in this class' version of this method.
     *
     * @return The speed in pixels per second, 25 for walking lines.
     */
    override speed(segment: Segment): number {
        return 25;
    }
}

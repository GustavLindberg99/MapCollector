import i18next from "https://unpkg.com/i18next@25.6.0/dist/esm/i18next.js";
import {Segment} from "https://unpkg.com/@flatten-js/core@1.4.8/dist/main.mjs";

import Branch from "./branch.js";
import Line from "./line.js";
import Station from "./station.js";

export default class WalkingLine extends Line{
    /**
     * Constructs a walking line.
     *
     * @param branches  An array with all the branches of the line.
     */
    constructor(branches: Array<Branch>){
        super(i18next.t("Walking line"), "#a0a0a0", branches, []);
    }

    /**
     * Gets the speed associated to this line type.
     *
     * @param segment   The segment to get the speed for. Not used in this class' version of this method.
     *
     * @return The speed in pixels per second, 20 for walking lines.
     */
    override speed(segment: Segment): number {
        return 20;
    }

    /**
     * Overrides the speedFactor method of the Line class.
     *
     * @param branch            The branch to check the speed factor on. Not used in this class' version of this method.
     * @param segment           The segment to check the speed factor on. Not used in this class' version of this method.
     * @param positionOnSegment The posistion on the segment in pixels. Not used in this class' version of this method.
     *
     * @return Always returns 1 since people usually don't slow down while walking past stations.
     */
    override speedFactor(branch: Branch, segment: Segment, positionOnSegment: number): number {
        return 1;
    }

    /**
     * Calculates the cost to go between two stations. Exists for compatibility with the LineWithMaps class.
     *
     * @param start         The station the player is starting at. Not used in this class' version of this method.
     * @param end           The station to calculate the cost to go to. Not used in this class' version of this method.
     * @param lookForLast   False if it should go the way it thinks is natural and true otherwise. Not used in this class' version of this method.
     *
     * @return Always returns 0 since walking is always free.
     */
    override costBetweenStations(start: Station, end: Station, lookForLast: boolean): number {
        return 0;
    }
}

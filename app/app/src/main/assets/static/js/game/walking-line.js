"use strict";

import typechecked from "https://gustavlindberg99.github.io/Typecheck.js/min/typecheck-v1.min.js";
import {QObject} from "https://gustavlindberg99.github.io/QtLinguistWeb/qtranslator-v1.min.js";

import Line from "./line.js";

export default class WalkingLine extends Line{
    /**
     * Constructs a walking line.
     *
     * @param branches  An array with all the branches of the line.
     */
    constructor(branches /*: Array<Branch> */){
        super(QObject.tr("Walking line"), "#a0a0a0", branches, []);
        Object.seal(this);
    }

    /**
     * Gets the speed associated to this line type.
     *
     * @param segment   The segment to get the speed for. Not used in this class' version of this method.
     *
     * @return The speed in pixels per second, 20 for walking lines.
     */
    speed(segment /*: Segment */) /*: Number */ {
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
    speedFactor(branch /*: Branch */, segment /*: Segment */, positionOnSegment /*: Number */) /*: Number */ {
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
    costBetweenStations(start /*: Station */, end /*: Station */, lookForLast /*: Boolean */) /*: Number */ {
        return 0;
    }
}
WalkingLine = typechecked(WalkingLine);
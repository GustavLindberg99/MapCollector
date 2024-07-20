"use strict";

import typechecked from "https://gustavlindberg99.github.io/Typecheck.js/min/typecheck-v1.min.js";
import {Point, Segment} from "https://unpkg.com/@flatten-js/core@1.4.8/dist/main.mjs";
typechecked.add(Point, Segment);

import Branch from "./branch.js";
import Station from "./station.js";

export default class Line{
    name /*: String */;
    color /*: Color */;
    branches /*: Array<Branch> */;
    labels /*: Array<Point> */;

    static TRAIN_LINE_WIDTH = 5;

    /**
     * Constructs a Line object. Can only be used by subclasses since this class is abstract.
     *
     * @param name      The name of the line.
     * @param color     The color of the line in hex format starting with a # character (for example #abcdef).
     * @param branches  An array with all the branches of the line.
     * @param labels    An array with the points at which labels for this line should be drawn.
     */
    constructor(name /*: String */, color /*: String */, branches /*: Array<Branch> */, labels /*: Array<Point> */){
        if(this.constructor.name === "Line"){
            throw new TypeError("Cannot instantiate abstract class Line");
        }

        this.name = name;
        this.color = color;
        this.branches = branches;
        this.labels = labels;
    }

    /**
     * Gets the points at which the vertices for the given station on this line are located.
     *
     * @param station   The station to get the point at.
     *
     * @return A set with all the points for the given station. Can contain more than one element if the line has a loop. Returns an empty set if this line doesn't stop at the station.
     */
    pointsAtStation(station /*: Station */) /*: Set<Point> */ {
        //Return a set to avoid duplicates in case there are several branches (the different branches will have references to the same Point object)
        return new Set(this.branches.flatMap(it => it.pointsAtStation(station)));
    }

    /**
     * Checks if this line stops at the station.
     *
     * @param station   The station to check if the line stops at.
     *
     * @return True if this line stops at station, false otherwise.
     */
    stopsAt(station /*: Station */) /*: Boolean */ {
        return this.pointsAtStation(station).size > 0;
    }

    /**
     * Gets all the stations this line stops at.
     *
     * @return A set with all the stations that this line stops at.
     */
    stations() /*: Set<Station> */ {
        return new Set(this.branches.flatMap(it => it.stations()));
    }

    /**
     * Finds a branch of this line that stops at two stations.
     *
     * @param start One of the stations the branch should stop at.
     * @param end   The other station the branch should stop at.
     *
     * @return  The branch of this line that stops at both start and end. Returns null if no branches on this line stop at both those stations. If multiple branches on this line stops at both those stations, returns any one of them.
     */
    branchBetweenStations(start /*: Station */, end /*: Station */) /*: Branch | null */ {
        return this.branches.find(it => it.segmentsBetweenStations(start, end, false) !== null) ?? null;
    }

    /**
     * This method is meant to be overridden in TrainLine, and is meant to be used in Station.canHaveMaps(). We can't just use instanceof Trainline in the Station class because that would cause circular imports which Javascript doesn't support for some reason.
     *
     * @return True if all stations on this line are train stations and can have maps (i.e. this line is a train line), and false otherwise.
     */
    allStationsCanHaveMaps() /*: Boolean */ {
        return false;
    }

    /**
     * Gets the speed factor at a specific point on a segment, which can be less than 1 if the point is close to a station.
     *
     * @param branch            The branch to check the speed factor on.
     * @param segment           The segment to check the speed factor on.
     * @param positionOnSegment The posistion on the segment in pixels.
     *
     * @return A number on a scale of 0 to 1, where 0 is completely stopped and 1 is the normal speed on the segment.
     */
    speedFactor(branch /*: Branch */, segment /*: Segment */, positionOnSegment /*: Number */) /*: Number */ {
        return branch.speedFactor(segment, positionOnSegment);
    }

    /**
     * Gets a string that can be put in an SVG path's d attribute.
     *
     * @return A string containing the points of this line in the SVG path format.
     */
    svgPath() /*: String */ {
        let result = "";
        const drawnSegments = [];
        const multilines = this.branches.flatMap(it => it.multilines());
        for(let multiline of multilines){
            let previousSegmentDrawn = false;
            for(let edge of multiline.edges){
                const segment = edge.shape;
                if(drawnSegments.some(it => it.equalTo(segment))){
                    previousSegmentDrawn = false;
                    continue;
                }
                if(!previousSegmentDrawn){
                    result += "M" + segment.start.x + " " + segment.start.y;
                }
                result += "L" + segment.end.x + " " + segment.end.y;
                previousSegmentDrawn = true;
                drawnSegments.push(segment);
            }
        }
        return result;
    }

    /**
     * Gets the width of the line, i.e. its thickness when drawn.
     *
     * @return The width of the line in pixels.
     */
    width() /*: Number */ {
        return Station.MARKER_SIZE * 0.3;
    }

    /**
     * Gets the font size to use in this line's labels.
     *
     * @return The font size in pixels.
     */
    labelFontSize() /*: Number */ {
        return 8;
    }
}
Line = typechecked(Line);
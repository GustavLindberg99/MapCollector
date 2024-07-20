"use strict";

import typechecked from "https://gustavlindberg99.github.io/Typecheck.js/min/typecheck-v1.min.js";
import {Multiline, Point, Segment, Vector} from "https://unpkg.com/@flatten-js/core@1.4.8/dist/main.mjs";
typechecked.add(Multiline, Point, Segment, Vector);

import {multilineFromPoints} from "../utils/utils.js";

import Zone from "./zone.js";

export default class Branch{
    #vertices /*: Array<Branch.Vertex | Branch.OneWayLoop> */ = [];

    /**
     * Represents a two-way point or station on a branch.
     */
    static Vertex = class{
        point /*: Point */;
        station /*: Station | null */;
        nextSegmentIsTGV /*: Boolean */ = false;

        /**
         * Constructs a vertex.
         *
         * @param point     The point at which the vertex is located, whether it's a station or not.
         * @param station   The station located at the vertex, or null if it's just a point.
         */
        constructor(point /*: Point */, station /*: Station | null */){
            this.point = point;
            this.station = station;
        }

        /**
         * Returns this vertex object itself, exists for compatibility with the OneWayLoop class.
         *
         * @param direction Not used in the version of the method for this class.
         *
         * @return This vertex itself.
         */
        vertexWithDirection(direction /*: Number */) /*: Branch.Vertex */ {
            return this;
        }

        /**
         * Gets the station of this vertex in the form of an array.
         *
         * @return An array with the station located at this vertex as its only element, or an empty array if this vertex is just a point. Can never return more than one element, but returns an array for compatibility with the OneWayLoop class.
         */
        stations() /*: Array<Station> */ {
            if(this.station === null){
                return [];
            }
            return [this.station];
        }
    }

    /**
     * Represents a pair of one-way points or stations on a branch.
     */
    static OneWayLoop = class{
        leftbound /*: Branch.Vertex */;
        rightbound /*: Branch.Vertex */;

        /**
         * Constructs a one-way loop from the two one-way vertices
         *
         * @param leftbound     The vertex at which this branch stops when going towards the station speficied first in the list of stations.
         * @param rightbound    The vertex at which this branch stops when going towards the station speficied last in the list of stations.
         */
        constructor(leftbound /*: Branch.Vertex */, rightbound /*: Branch.Vertex */){
            this.leftbound = leftbound;
            this.rightbound = rightbound;
        }

        /**
         * Returns this vertex in the specified direction.
         *
         * @param direction Negative if going towards the left, positive if going towards the right.
         *
         * @return The leftbound vertex if direction is negative, and the rightbound vertex if direction is positive.
         */
        vertexWithDirection(direction /*: Number */) /*: Branch.Vertex */ {
            return direction < 0 ? this.leftbound : this.rightbound;
        }

        /**
         * Gets the stations in this one-way loop.
         *
         * @return An array with the stations in this one-way loop. Contains two elements if both vertices are stations, one element if one is a station and the other is just a point, and an empty array if both vertices are just points.
         */
        stations() /*: Array<Station> */ {
            return [this.leftbound, this.rightbound].flatMap(it => it.stations());
        }
    }

    /**
     * Constructs a branch with the given vertices.
     *
     * @param vertices  The vertices of the branch.
     */
    constructor(vertices /*: Array<Branch.Vertex | Branch.OneWayLoop> */){
        this.#vertices = vertices;
    }

    /**
     * Gets the points at which the vertices for the given station on this line are located.
     *
     * @param station   The station to get the point at.
     *
     * @return An array with all the points for the given station. Can contain more than one element if the line has a loop. Returns an empty set if this line doesn't stop at the station.
     */
    pointsAtStation(station /*: Station */) /*: Array<Point> */ {
        return [
            ...this.#vertices.filter(it => it.station === station).map(it => it.point),
            ...this.#vertices.filter(it => it.leftbound?.station === station).map(it => it.leftbound.point),
            ...this.#vertices.filter(it => it.rightbound?.station === station).map(it => it.rightbound.point)
        ];
    }

    /**
     * Gets the station located at a given point on this branch.
     *
     * @param point The point to get the station at.
     *
     * @return The station located at point, or null if no station on this branch is located at the given point.
     */
    stationAtPoint(point /*: Point */) /*: Station | null */ {
        return this.#vertices.find(it => it.point?.equalTo(point))?.station ??
               this.#vertices.find(it => it.leftbound?.point.equalTo(point))?.leftbound.station ??
               this.#vertices.find(it => it.rightbound?.point.equalTo(point))?.rightbound.station ??
               null;
    }

    /**
     * Checks if this branch stops at the station.
     *
     * @param station   The station to check if the branch stops at.
     *
     * @return True if this branch stops at station, false otherwise.
     */
    stopsAt(station /*: Station */) /*: Boolean */ {
        return this.pointsAtStation(station).length > 0;
    }

    /**
     * Gets all the stations this branch stops at.
     *
     * @return An array with all the stations that this branch stops at in order.
     */
    stations() /*: Array<Station> */ {
        return this.#vertices.flatMap(it => it.stations());
    }

    /**
     * Gets the path between two stations on this branch.
     *
     * @param start         The station to start at.
     * @param end           The station to end at.
     * @param lookForLast   False if it should go the way it thinks is natural and true otherwise. Only useful for loops and circular lines.
     *
     * @return The path between the two stations in the form of an array of segments. Returns null if it's not possible to get from start to end on this branch, which can happen if the branch doesn't stop at both stations or if at least one of the stations is a one-way station in the wrong direction.
     */
    segmentsBetweenStations(start /*: Station */, end /*: Station */, lookForLast /*: Boolean */) /*: Array<Segment> | null */ {
        const findFunction = callback => lookForLast ? this.#vertices.findLastIndex(callback) : this.#vertices.findIndex(callback);
        const startIndex = findFunction(it => it.station === start || it.leftbound?.station === start || it.rightbound?.station === start);
        const endIndex = findFunction(it => it.station === end || it.leftbound?.station === end || it.rightbound?.station === end);

        if(startIndex === -1 || endIndex === -1){
            return null;
        }

        let direction;
        if(this.#vertices[startIndex] instanceof Branch.OneWayLoop){
            if(this.#vertices[startIndex].leftbound.station === start){
                direction = -1;
            }
            else{
                direction = 1;
            }
        }
        else{
            direction = Math.sign(endIndex - startIndex);
        }
        if(direction === 0){
            return null;
        }

        let result = [];
        for(let i = startIndex; this.#vertices[i].vertexWithDirection(direction).station !== end; i += direction){
            const point1 = this.#vertices[i].vertexWithDirection(direction).point;
            const point2 = this.#vertices[i + direction]?.vertexWithDirection(direction).point;
            if(point2 === undefined){
                //If we've reached the end station and it's a two-way vertex, we haven't found a path, so return null
                if(this.#vertices[i] instanceof Branch.Vertex){
                    return null;
                }
                //If we've reached the end of the line but it's a one-way vertex, the line ends in a loop, so continue around the loop
                const point2 = this.#vertices[i].vertexWithDirection(-direction).point;
                const point3 = this.#vertices[i - direction].vertexWithDirection(-direction).point;
                direction = -direction;
                result.push(new Segment(point1, point2));    //Segment between leftbound and rightbound end stations
                if(this.#vertices[i].vertexWithDirection(direction).station === end){
                    break;
                }
                result.push(new Segment(point2, point3));    //Segment between rightbound end station and second rightbound station from the end
            }
            else{
                result.push(new Segment(point1, point2));
            }
        }
        return result;
    }

    /**
     * Gets the stations between two stations on this branch, excluding the two stations passed as parameters.
     *
     * @param start         The station to start at.
     * @param end           The station to end at.
     * @param lookForLast   False if it should go the way it thinks is natural and true otherwise. Only useful for loops and circular lines.
     *
     * @return The stations between the two stations in the form of an array of segments. Returns null if it's not possible to get from start to end on this branch, which can happen if the branch doesn't stop at both stations or if at least one of the stations is a one-way station in the wrong direction.
     */
    stationsBetweenStations(start /*: Station */, end /*: Station */, lookForLast /*: Boolean */) /*: Array<Station> | null */ {
        return this.segmentsBetweenStations(start, end, lookForLast)?.slice(1).map(it => this.stationAtPoint(it.start)).filter(it => it !== null) ?? null;
    }

    /**
     * Calculates the cost to go between two stations, even if not playing with money (since this class doesn't have access to that information).
     *
     * @param start         The station the player is starting at.
     * @param end           The station to calculate the cost to go to.
     * @param lookForLast   False if it should go the way it thinks is natural and true otherwise. Only useful for loops and circular lines.
     * @param zones         An array containing all the zones in this place.
     *
     * @return The cost to go from start to end.
     */
    costBetweenStations(start /*: Station */, end /*: Station */, lookForLast /*: Boolean */, allZones /*: Array<Zone> */) /*: Number */ {
        let multiZoneCost = 0;
        const zoneBoundaryIntersections /*: Array<Point> */ = [];
        for(let segment of this.segmentsBetweenStations(start, end, lookForLast)){
            for(let zone of allZones){
                for(let intersectionPoint of segment.intersect(zone.completePolygon())){
                    //Sometimes it says there are two intersection points very close to each other, so only count intersection points that aren't too close to a previous intersection point
                    const tolerance = 1e-5;
                    if(!zoneBoundaryIntersections.some(it => it.distanceTo(intersectionPoint)[0] < tolerance) && Zone.zoneAtPoint(allZones, intersectionPoint) === zone){
                        zoneBoundaryIntersections.push(intersectionPoint);
                        multiZoneCost += zone.isOutside() ? 25 : 10;
                    }
                }
            }
        }
        const singleZoneCost = start.zone.isOutside() ? 3 : 1;
        return multiZoneCost || singleZoneCost;
    }

    /**
     * Checks if a given segment on this branch is a TGV segment.
     *
     * @param segment   The segment to check whether it's a TGV segment.
     *
     * @return True if the segment is a TGV segment, false if it's a non-TGV segment or if it's not part of this branch.
     */
    segmentIsTGV(segment /*: Segment */) /*: Boolean */ {
        return this.#vertices.some((it, i) =>
            it.nextSegmentIsTGV
            && (it.point.equalTo(segment.start) || it.point.equalTo(segment.end))
            && (this.#vertices[i + 1]?.point?.equalTo(segment.start) || this.#vertices[i + 1]?.point?.equalTo(segment.end))
        );
    }

    /**
     * Gets the speed factor at a specific point on a segment, which can be less than 1 if the point is close to a station.
     *
     * @param segment           The segment to check the speed factor on.
     * @param positionOnSegment The posistion on the segment in pixels.
     *
     * @return A number on a scale of 0 to 1, where 0 is completely stopped and 1 is the normal speed on the segment.
     */
    speedFactor(segment /*: Segment */, positionOnSegment /*: Number */) /*: Number */ {
        const startIndex = this.#vertices.findIndex(it => it.point?.equalTo(segment.start) || it.leftbound?.point.equalTo(segment.start) || it.rightbound?.point.equalTo(segment.start));
        const startVertex = this.#vertices[startIndex];
        const endIndex = this.#vertices.findIndex(it => it.point?.equalTo(segment.end) || it.leftbound?.point.equalTo(segment.end) || it.rightbound?.point.equalTo(segment.end));
        const endVertex = this.#vertices[endIndex];
        const direction = Math.sign(endIndex - startIndex);

        let distanceToClosestStation = Infinity;
        for(let vertex of [startVertex.vertexWithDirection(direction || 1), endVertex.vertexWithDirection(direction || -1)]){
            let station;
            if(vertex.station !== null){
                distanceToClosestStation = Math.min(distanceToClosestStation, new Vector(segment.pointAtLength(positionOnSegment), vertex.point).length);
            }
        }
        return Math.min(Math.max(0.2, distanceToClosestStation / 10), 1);
    }

    /**
     * Gets the direction in which a one-way station is pointing.
     *
     * @param station   The station to check for.
     *
     * @return Returns the angle in degrees in which the direction of the station points. Returns null if it's a two-directional station or if this branch doesn't stop at the station.
     */
    directionAtStation(station /*: Station */) /*: Number | null */ {
        let direction = 0;
        const currentIndex = this.#vertices.findIndex(typechecked((vertex /*: Branch.Vertex | Branch.OneWayLoop */) /*: Boolean */ => {
            if(vertex.leftbound?.station === station){
                direction = -1;
                return true;
            }
            else if(vertex.rightbound?.station === station){
                direction = 1;
                return true;
            }
            else{
                return false;
            }
        }));

        if(direction === 0){
            return null;
        }

        const previousIndex = currentIndex - direction;
        let previousVertex;
        switch(previousIndex){
        case -1:
            previousVertex = this.#vertices[0].leftbound;
            break;
        case this.#vertices.length:
            previousVertex = this.#vertices.at(-1).rightbound;
            break;
        default:
            previousVertex = this.#vertices[previousIndex];
            if(previousVertex instanceof Branch.OneWayLoop){
                previousVertex = direction === -1 ? previousVertex.leftbound : previousVertex.rightbound;
            }
            break;
        }

        const nextIndex = currentIndex + direction;
        let nextVertex;
        switch(nextIndex){
        case -1:
            nextVertex = this.#vertices[0].rightbound;
            break;
        case this.#vertices.length:
            nextVertex = this.#vertices.at(-1).leftbound;
            break;
        default:
            nextVertex = this.#vertices[nextIndex];
            if(nextVertex instanceof Branch.OneWayLoop){
                nextVertex = direction === -1 ? nextVertex.leftbound : nextVertex.rightbound;
            }
            break;
        }

        const currentVertex = direction === -1 ? this.#vertices[currentIndex].leftbound : this.#vertices[currentIndex].rightbound;
        const vector1 = new Vector(previousVertex.point, currentVertex.point).normalize();
        const vector2 = new Vector(currentVertex.point, nextVertex.point).normalize();
        const radiansResult = vector1.add(vector2).slope;
        return radiansResult * 180 / Math.PI;
    }

    /**
     * Returns the multilines necessary to draw this branch. Often only returns one element, but can return several elements if the line contains one-way loops.
     *
     * @return An array with the multilines necessary to draw this branch.
     */
    multilines() /*: Array<Multiline> */ {
        let result /*: Array<Array<Point>> */ = [];
        let previousVertex = null;
        for(let vertex of this.#vertices){
            if(vertex instanceof Branch.OneWayLoop){
                switch(previousVertex?.constructor){
                case Branch.Vertex:
                    for(let oneWayVertex of [vertex.leftbound, vertex.rightbound]){
                        result.push([previousVertex.point, oneWayVertex.point]);
                    }
                    break;
                case Branch.OneWayLoop:
                    result.push([previousVertex.leftbound.point, vertex.leftbound.point]);
                    result.push([previousVertex.rightbound.point, vertex.rightbound.point]);
                    break;
                case undefined:    //Beginning of the line
                    result.push([vertex.leftbound.point, vertex.rightbound.point]);
                    break;
                }
            }
            else if(vertex.station?.implicit){
                continue;
            }
            else{
                switch(previousVertex?.constructor){
                case Branch.Vertex:
                    result.at(-1).push(vertex.point);
                    break;
                case Branch.OneWayLoop:
                    for(let previousOneWayVertex of [previousVertex.leftbound, previousVertex.rightbound]){
                        result.push([previousOneWayVertex.point, vertex.point]);
                    }
                    break;
                case undefined:    //Beginning of the line
                    result.push([vertex.point]);
                    break;
                }
            }
            previousVertex = vertex;
        }
        if(this.#vertices.at(-1) instanceof Branch.OneWayLoop){    //If the line ends with a one way vertex, close the loop
            result.at(-1).push(this.#vertices.at(-1).leftbound.point);
        }
        return result.map(it => multilineFromPoints(it));
    }
}
Branch = typechecked(Branch);
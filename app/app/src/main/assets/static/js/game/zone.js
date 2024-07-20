"use strict";

import typechecked from "https://gustavlindberg99.github.io/Typecheck.js/min/typecheck-v1.min.js";
import {BooleanOperations, Point, Polygon} from "https://unpkg.com/@flatten-js/core@1.4.8/dist/main.mjs";
typechecked.add(Point, Polygon);

import PlaceParseException from "./place-parse-exception.js";

export default class Zone{
    name /*: String */;
    color /*: String */;
    polygon /*: Polygon | null */;
    islands /*: Array<Polygon> */ = [];

    /**
     * Constructs a Zone object.
     *
     * @param name          The name of the zone.
     * @param colorIndex    The color index of the zone: "1" for white, "2" for green, "3" for yellowish and "outside" for red (the outside zone).
     * @param points        The points of the polygon that contains this zone. The actual zone can be smaller than this if zones on top of it overlap with it.
     */
    constructor(name /*: String | null */, colorIndex /*: String */, points /*: Array<Point> */){
        Object.seal(this);

        this.name = name;

        switch(colorIndex){
        case "1":
            this.color = "white";
            break;
        case "2":
            this.color = "#bfb";
            break;
        case "3":
            this.color = "#df6";
            break;
        case "outside":
            this.color = "#fbb";
            const MAX_COORDINATE = 1000000;
            this.polygon = new Polygon([
                new Point(MAX_COORDINATE, MAX_COORDINATE),
                new Point(MAX_COORDINATE, -MAX_COORDINATE),
                new Point(-MAX_COORDINATE, -MAX_COORDINATE),
                new Point(-MAX_COORDINATE, MAX_COORDINATE),
            ]);
            this.polygon.addFace(points);
            break;
        default:
            throw new PlaceParseException("Unknown zone color: " + colorIndex);
        }

        if(points.length > 0){
            this.polygon ??= new Polygon(points);
        }
        else{
            this.polygon ??= null;
        }
    }

    /**
     * Checks if this is the outside zone.
     *
     * @return True if it's the outside zone, false if it isn't.
     */
    isOutside() /*: Boolean */ {
        return this.color === "#fbb";
    }

    /**
     * Gets the polygon containing the entire zone, including islands.
     *
     * @return The complete polygon of the zone.
     */
    completePolygon() /*: Polygon */ {
        //The outside zone can't have islands, and if we try to use the code below it will cause strange errors
        if(this.isOutside()){
            return this.polygon;
        }

        //Get the polygons
        const polygons = this.islands.map(it => it.clone());
        if(this.polygon !== null){
            polygons.push(this.polygon.clone());
        }

        //We need to make sure that all polygons have the same orientation, see https://github.com/alexbol99/flatten-js/issues/61
        for(let polygon of polygons){
            const [face] = polygon.faces;
            if(face.orientation() < 0){
                polygon.reverse();
            }
        }

        if(polygons.length === 1){
            return polygons[0];
        }
        else{
            return polygons.reduce((a, b) => BooleanOperations.unify(a, b), polygons[0]);
        }
    }

    /**
     * Finds the zone at a given point.
     *
     * @param allZones  The array of zones to search in.
     * @param point     The point to find the zone at.
     *
     * @return The zone at the given point.
     */
    static zoneAtPoint(allZones /*: Array<Zone> */, point /*: Point */) /*: Zone */ {
        return allZones.findLast(zone => zone.islands.some(island => island.contains(point))) ?? allZones.findLast(zone => zone.polygon?.contains(point));
    }
}
Zone = typechecked(Zone);
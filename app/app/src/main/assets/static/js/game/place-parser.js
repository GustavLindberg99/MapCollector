"use strict";

import typechecked from "https://gustavlindberg99.github.io/Typecheck.js/min/typecheck-v1.min.js";
import {Multiline, Point, Polygon, Segment, Vector} from "https://unpkg.com/@flatten-js/core@1.4.8/dist/main.mjs";
typechecked.add(Multiline, Point, Polygon, Segment, Vector);

import {refreshUI} from "../utils/async-utils.js";
import {getTextWidth} from "../utils/graphic-utils.js";
import {multilineFromPoints} from "../utils/utils.js";

import Branch from "./branch.js";
import BusLine from "./bus-line.js";
import Line from "./line.js";
import PlaceParseException from "./place-parse-exception.js";
import Station from "./station.js";
import TrainLine from "./train-line.js";
import WalkingLine from "./walking-line.js";
import Zone from "./zone.js";

export default class PlaceParser{
    #xmlDocument /*: XMLDocument */;
    #filename /*: String */;
    #zones /*: Array<Zone> | null */ = null;
    #stations /*: Array<Station> | null */ = null;

    /**
     * Constructs a PlaceParser object that can extract information from an XML document.
     *
     * @param xmlDocument   The XML document to extract information about the place from.
     * @param fileName      The file name of the place, including the extra name (extra names are places after a : character). Used to determine which extras to include.
     */
    constructor(xmlDocument /*: XMLDocument */, filename /*: String */){
        this.#xmlDocument = xmlDocument;
        this.#filename = filename;
    }

    /**
     * Extracts the stations. Creates a new station object for each station (both autostations and regular stations).
     *
     * @param place The place to create the stations in.
     *
     * @return An array containing all the stations of this place.
     */
    async stations(place /*: Place */) /*: Array<Station> */ {
        this.#stations = [];
        const lineStations = [];

        //Order the stations to have autostations last, since we need the other stations to find the coordinates of the autostations
        const stationNodes = [...this.#xmlDocument.querySelectorAll(
            this.#extraQuery("place > stations > station, place > lines > trainLine autoStation, place > lines > busLine autoStation"))].sort((a, b) => {
            if(a.tagName.toLowerCase() === b.tagName.toLowerCase()){
                return 0;
            }
            else if(a.tagName.toLowerCase() === "autostation"){
                return 1;
            }
            else{
                return -1;
            }
        });

        //Create the stations and check for duplicate ids
        for(let stationNode of stationNodes){
            const station = this.#stationFromXml(stationNode, place);
            if(this.#stations.some(it => it.id === station.id)){
                throw new PlaceParseException(`Two stations have the id '${station.id}', but station names must be unique`);
            }
            this.#stations.push(station);
            await refreshUI();
        }

        return this.#stations;
    }

    /**
     * Extracts the lines.
     *
     * @param place The place to create the lines in.
     *
     * @return An array containing all the lines in this place.
     */
    async lines(place /*: Place */) /*: Array<Line> */ {
        const lines = [];

        const lineNodes = this.#xmlDocument.querySelectorAll(this.#extraQuery("place > lines > *"));
        for(let lineNode of lineNodes){
            const name = lineNameFromNode(lineNode);
            const color = lineNode.getAttribute("color");
            const [branches, labels] = this.#parseStationList(lineNode);
            switch(lineNode.tagName.toLowerCase()){
            case "trainline":
                if(color === null){
                    throw new PlaceParseException(`Line ${name} is missing a color.`);
                }
                lines.push(new TrainLine(
                    place,
                    name,
                    color,
                    branches.map(it => new Branch(it)),
                    labels,
                    lineNode.getAttribute("via")
                ));
                break;
            case "busline":
                if(color === null){
                    throw new PlaceParseException(`Line ${name} is missing a color.`);
                }
                lines.push(new BusLine(
                    place,
                    name,
                    color,
                    branches.map(it => new Branch(it)),
                    labels,
                    lineNode.getAttribute("via")
                ));
                break;
            case "walkingline":
                if(labels.length !== 0){
                    throw new PlaceParseException("Walking lines can't have labels");
                }
                lines.push(new WalkingLine(branches.map(it => new Branch(it))));
                break;
            default:
                throw new PlaceParseException("Unkown line type: " + lineNode.tagName);
            }
            await refreshUI();
        }

        return lines;
    }

    /**
     * Extracts the zones.
     *
     * @return An array containing all the zones in this place, including the outside zone if it exists.
     */
    zones() /*: Array<Zone> */ {
        const zones = [];

        const zoneNodes = this.#xmlDocument.querySelectorAll(this.#extraQuery("place > background > zone"));
        for(let zoneNode of zoneNodes){
            const name = zoneNode.getAttribute("name");
            if(name === ""){
                throw new PlaceParseException("Zones can't have empty names");
            }
            zones.push(new Zone(name, zoneNode.getAttribute("color"), parsePointString(zoneNode.getAttribute("points") ?? "")));
        }

        if(zones.length === 0){
            zones.push(new Zone("main", "1", parsePointString("l t, l b, r b, r t")));
        }

        const boundary = this.#xmlDocument.querySelector(this.#extraQuery("place > background > boundary"));
        if(boundary !== null){
            zones.push(new Zone("", "outside", parsePointString(boundary.getAttribute("points"))));
        }

        const islandNodes = this.#xmlDocument.querySelectorAll(this.#extraQuery("place > background > island"));
        for(let islandNode of islandNodes){
            const zone = zones.length === 1 ? zones[0] : zones.find(it => it.name === islandNode.getAttribute("zone"));
            if(zone === undefined){
                throw new PlaceParseException("Island has unknown zone " + islandNode.getAttribute("zone"));
            }
            zone.islands.push(new Polygon(parsePointString(islandNode.getAttribute("points"))));
        }

        this.#zones = zones;
        return zones;
    }

    /**
     * Extracts the lakes and seas.
     *
     * @return An array of polygons, where each polygon represents a lake or sea.
     */
    lakes() /*: Array<Polygon> */ {
        const lakes = [];

        const seaNodes = this.#xmlDocument.querySelectorAll(this.#extraQuery("place > background > sea"));
        for(let seaNode of seaNodes){
            lakes.push(new Polygon(parsePointString(seaNode.getAttribute("points"))));
        }

        return lakes;
    }

    /**
     * Extracts the rivers.
     *
     * @return An array of multilines, where each multiline represents a river.
     */
    rivers() /*: Array<Multiline> */ {
        const rivers = [];

        const riverNodes = this.#xmlDocument.querySelectorAll(this.#extraQuery("place > background > river"));
        for(let riverNode of riverNodes){
            const points = parsePointString(riverNode.getAttribute("points"));
            rivers.push(multilineFromPoints(points));
        }

        return rivers;
    }

    /**
     * Extracts which lines are considered similar.
     *
     * @return A function that takes two lines and returns true if they're similar according to this place's sililarLines XML attribute and false otherwise. If no similarLines attribute is specified, the function simply checks if the lines are the same type.
     */
    linesAreSimilar() /*: function */ {
        const similarLines = this.#xmlDocument.querySelector(this.#extraQuery("place")).getAttribute("similarLines");
        switch(similarLines){
        case "name":
            return typechecked((line1 /*: Line */, line2 /*: Line */) /*: Boolean */ => line1.constructor === line2.constructor && line1.name === line2.name);
        case "color":
            return typechecked((line1 /*: Line */, line2 /*: Line */) /*: Boolean */ => line1.constructor === line2.constructor && line1.color === line2.color);
        case null:
            return typechecked((line1 /*: Line */, line2 /*: Line */) /*: Boolean */ => line1.constructor === line2.constructor);
        default:
            throw new PlaceParseException(`Unrecongized value for similarLines: '${similarLines}'`);
        }
    }

    /**
     * Converts a CSS query to also select objects inside this place's extras.
     *
     * @param query The CSS query that only selects stuff that aren't in extras.
     *
     * @return The corresponding CSS query that also selects stuff in this place's extras.
     */
    #extraQuery(query /*: String */) /*: String */ {
        const extraName = this.#filename.split(":")[1] ?? null;
        if(/[^0-9a-z]/i.test(extraName)){
            throw new PlaceParseException("Invalid character in extra name");
        }
        if(extraName !== null){
            query += ", " + query.replaceAll("place > ", `place > extra[id=${extraName}] > `);
        }
        return query;
    }

    /**
     * Finds the point represented by the <point> or <stationRef> node closest to the given autostation in the given direction.
     *
     * @param stationNode   The autostation to search around.
     * @param direction     Positive if we want the next vertex, negative if we want the previous vertex.
     *
     * @return A tuple containing the point closest to the node in the given direction and the number of autostations in between (excluding stationNode itself).
     */
    #pointNextToAutostation(stationNode /*: Element */, direction /*: Number */) /*: [Point, Number] */ {
        let autostationsBetween = 0;
        let adjacentNode = stationNode;
        let stationName = stationNode.getAttribute("name");
        do{
            const newAdjacentNode = direction < 0 ? adjacentNode.previousElementSibling : adjacentNode.nextElementSibling;
            if(newAdjacentNode === null && adjacentNode.parentElement.tagName.toLowerCase() === "branch"){
                adjacentNode = adjacentNode.parentElement;
                while(adjacentNode.tagName.toLowerCase() === "branch"){
                    adjacentNode = direction < 0 ? adjacentNode.previousElementSibling : adjacentNode.nextElementSibling;
                }
            }
            else{
                adjacentNode = newAdjacentNode;
            }
            if(adjacentNode === null){
                throw new PlaceParseException(`Autostation ${stationName} can't be an end station`);
            }
            if(adjacentNode.tagName.toLowerCase() === "branch"){
                throw new PlaceParseException(`Autostation ${stationName} can't be a branching point`);
            }
            if(adjacentNode.tagName.toLowerCase() === "autostation"){
                autostationsBetween++;
            }
            stationName = adjacentNode.getAttribute("id") ?? adjacentNode.getAttribute("name");
        } while(adjacentNode.tagName.toLowerCase() !== "point" && adjacentNode.tagName.toLowerCase() !== "stationref");

        const lineName = lineNameFromNode(stationNode);
        if(adjacentNode.tagName.toLowerCase() === "point"){
            return [this.#pointFromXml(adjacentNode, lineName), autostationsBetween];
        }

        const station = this.#stations.find(it => it.id === stationName);
        if(station === undefined){
            throw new PlaceParseException(`Line ${lineName} references nonexistent station ${stationName}`);
        }
        return [station.point, autostationsBetween];
    }

    /**
     * Creates a new Station object from a <station> or <autostation> node.
     *
     * @param stationNode   The <station> or <autostation> node.
     * @param place         The place that the station belongs to.
     *
     * @return A new Station object corresponding to the station represented by the node.
     */
    #stationFromXml(stationNode /*: Element */, place /*: Place */) /*: Station */ {
        const name = stationNode.getAttribute("name-" + document.documentElement.lang) ?? stationNode.getAttribute("name");
        let x, y;
        if(stationNode.tagName.toLowerCase() === "autostation"){
            const [previousPoint, autostationsBefore] = this.#pointNextToAutostation(stationNode, -1);
            const [nextPoint, autostationsAfter] = this.#pointNextToAutostation(stationNode, 1);
            const vector = new Vector(previousPoint, nextPoint);        //Vector between previous point and next point
            const point = previousPoint.translate(vector.multiply((autostationsBefore + 1) / (autostationsBefore + autostationsAfter + 2)));
            x = point.x;
            y = point.y;
        }
        else{
            x = stationNode.getAttribute("x");
            y = stationNode.getAttribute("y");
        }
        if(x === null || y === null){
            throw new PlaceParseException(`Station ${name} is missing x or y coordinate`);
        }

        return new Station(
            place,
            this.#zones,
            name,
            stationNode.getAttribute("id") ?? stationNode.getAttribute("name").replace(/[\n\xad]/g, ""),
            parseFloat(x),
            parseFloat(y),
            Station.Alignment.fromString(stationNode.getAttribute("a")?.[0] ?? "r"),
            parseFloat(stationNode.getAttribute("w")) || null,
            parseFloat(stationNode.getAttribute("h")) || null,
            stationNode.tagName.toLowerCase() === "autostation"
        );
    }

    /**
     * Extracts the coordinates from a <point> node contained in a line.
     *
     * @param lineNode  The <point> node.
     *
     * @return The point represented by the node.
     */
    #pointFromXml(pointNode /*: Element */) /*: Point */ {
        const lineName = lineNameFromNode(pointNode);
        if(pointNode.hasAttribute("station")){
            if(pointNode.hasAttribute("x") || pointNode.hasAttribute("y")){
                throw new PlaceParseException(`Line ${lineName} has a point with both coordinates and a station`);
            }
            const stationName = pointNode.getAttribute("station");
            const station = this.#stations.find(it => it.id === stationName);
            if(station === undefined){
                throw new PlaceParseException(`Line ${lineName} references nonexistent station ${stationName}`);
            }
            return station.point;
        }
        else{
            const x = parseFloat(pointNode.getAttribute("x"));
            const y = parseFloat(pointNode.getAttribute("y"));
            if(Number.isNaN(x)){
                throw new PlaceParseException(`Point in line ${lineName} is missing an x coordinate`);
            }
            if(Number.isNaN(y)){
                throw new PlaceParseException(`Point in line ${lineName} is missing an y coordinate`);
            }
            return new Point(x, y);
        }
    }

    /**
     * Extracts the vertex from a <point>, <stationRef> or <autoStation> node contained in a line. If the node is a <stationRef> or an <autoStation>, it's assumed that the corresponding station object has already been created.
     *
     * @param vertexNode    The <point> node.
     *
     * @return The vertex represented by the node, or null if vertexNode is a node that doesn't represent a vertex.
     */
    #vertexFromXml(vertexNode /*: Element */) /*: Branch.Vertex | Branch.OneWayLoop | null */ {
        const lineName = lineNameFromNode(vertexNode);
        const directions = new Map([
            ["mu", new Vector(0, -1)],
            ["md", new Vector(0, 1)],
            ["ml", new Vector(-1, 0)],
            ["mr", new Vector(1, 0)],
            ["mul", new Vector(-0.7, -0.7)],    //Round 1/sqrt(2) to exactly 0.7 to make it easier to specify the exact number explicitly
            ["mur", new Vector(0.7, -0.7)],
            ["mdl", new Vector(-0.7, 0.7)],
            ["mdr", new Vector(0.7, 0.7)],
            ["mull", new Vector(-1, -0.4)],
            ["muul", new Vector(-0.4, -1)],
            ["murr", new Vector(1, -0.4)],
            ["muur", new Vector(0.4, -1)],
            ["mdll", new Vector(-1, 0.4)],
            ["mddl", new Vector(-0.4, 1)],
            ["mdrr", new Vector(1, 0.4)],
            ["mddr", new Vector(0.4, 1)]
        ]);
        let translationVector = new Vector(0, 0);
        for(let [direction, vector] of directions){
            if(vertexNode.hasAttribute(direction)){
                const factor = parseFloat(vertexNode.getAttribute(direction)) * Line.TRAIN_LINE_WIDTH;
                translationVector = translationVector.add(vector.multiply(factor));
            }
        }

        switch(vertexNode.tagName.toLowerCase()){
        case "autostation":
        case "stationref":
            const stationName = (vertexNode.tagName.toLowerCase() === "autostation" ? vertexNode.getAttribute("id") : null) ?? vertexNode.getAttribute("name");
            let station = this.#stations.find(it => it.id === stationName);
            if(station === undefined){
                if(vertexNode.tagName.toLowerCase() === "autostation"){
                    station = this.#stations.find(it => it.nameAsInFile === stationName);
                }
                if(station === undefined){
                    throw new PlaceParseException(`Line ${lineName} references nonexistent station ${stationName}`);
                }
            }
            return new Branch.Vertex(
                station.point.translate(translationVector),
                station
            );

        case "point":
            return new Branch.Vertex(
                this.#pointFromXml(vertexNode).translate(translationVector),
                null
            );

        case "oneway":
            if(vertexNode.children.length !== 2){
                throw new PlaceParseException(`Oneway node on line ${lineName} has ${vertexNode.children.length} children, expected 2`);
            }
            const leftbound = this.#vertexFromXml(vertexNode.children[0]);
            const rightbound = this.#vertexFromXml(vertexNode.children[1]);
            if(leftbound === null || rightbound === null){
                throw new PlaceParseException(`Unexpected child node type in oneway node on line ${lineName}`);
            }
            return new Branch.OneWayLoop(leftbound, rightbound);
        }
        return null;
    }

    /**
     * Finds the vertex represented by the <point>, <stationRef> or <autoStation> node closest to the given node in the given direction.
     *
     * @param node      The node to search around (often a <label> or a <branch>).
     * @param direction Positive if we want the next vertex, negative if we want the previous vertex.
     *
     * @return The vertex closest to the node in the given direction, or null if there is none (which can happen if the node is a child of a <branch>).
     */
    #vertexNextToNode(node /*: Element */, direction /*: Number */) /*: Branch.Vertex | Branch.OneWayLoop | null */ {
        let adjacentNode = node;
        let adjacentVertex = null;
        while(adjacentVertex === null){
            adjacentNode = direction < 0 ? adjacentNode.previousElementSibling : adjacentNode.nextElementSibling;
            if(adjacentNode === null){
                return null;
            }
            else{
                adjacentVertex = this.#vertexFromXml(adjacentNode);
            }
        }
        return adjacentVertex;
    }

    /**
     * Extracts the information about stations, labels, etc contained in the child nodes of a line or branch node.
     *
     * @param lineNode          The XML node that contains the information about the line.
     * @param previousVertex    If parsing a branch node, the last vertex before the branch. Can be null if parsing a line node or if the line begins with multiple branches.
     * @param nextVertex        If parsing a branch node, the first vertex after the branch. Can be null if parsing a line node or if the line ends with multiple branches.
     *
     * @return A tuple where the first element contains the vertices of the line by branch, and the second element contains the points at which the labels should be drawn.
     */
    #parseStationList(
        lineNode /*: Element */,
        previousVertex /*: Branch.Vertex | Branch.OneWayLoop | null */ = null,
        nextVertex /*: Branch.Vertex | Branch.OneWayLoop | null */ = null
    ) /*: [Array<Array<Branch.Vertex | Branch.OneWayLoop>>, Array<Point>] */ {
        const lineName = lineNameFromNode(lineNode);

        if(previousVertex === null && nextVertex === null && lineNode.children.length < 2){
            throw new PlaceParseException(`Line ${lineName} has fewer than 2 stations`);
        }
        if(previousVertex === null && !["stationref", "branch", "oneway"].includes(lineNode.firstElementChild.tagName.toLowerCase())){
            throw new PlaceParseException(`Line ${lineName} starts with something else than a station reference`);
        }
        if(nextVertex === null && !["stationref", "branch", "oneway"].includes(lineNode.lastElementChild.tagName.toLowerCase())){
            throw new PlaceParseException(`Line ${lineName} ends with something else than a station reference`);
        }

        const verticesByBranch /*: Array<Array<Branch.Vertex | Branch.OneWayLoop>> */ = [[]];
        const labels /*: Array<Point> */ = [];

        for(let node of lineNode.children){
            switch(node.tagName.toLowerCase()){
            case "autostation":
            case "stationref":
            case "point":
            case "oneway":
                const vertex = this.#vertexFromXml(node, lineName);
                for(let branch of verticesByBranch){
                    branch.push(vertex);
                }
                break;

            case "label":
                const offset = parseFloat(node.getAttribute("offset") ?? 0);
                const vertexBeforeLabel = this.#vertexNextToNode(node, -1) ?? previousVertex;
                const vertexAfterLabel = this.#vertexNextToNode(node, 1) ?? nextVertex;
                labels.push(...getLabels(offset, lineName, vertexBeforeLabel, vertexAfterLabel));
                break;

            case "branch":
                //Parse the branch
                const vertexBeforeBranch = this.#vertexNextToNode(node, -1) ?? previousVertex;
                const vertexAfterBranch = this.#vertexNextToNode(node, 1) ?? nextVertex;
                const [verticesInBranch, labelsInBranch] = this.#parseStationList(node, vertexBeforeBranch, vertexAfterBranch);

                //Add the labels
                labels.push(...labelsInBranch);

                //Add the vertices
                for(let newBranch of verticesInBranch){
                    verticesByBranch.push(verticesByBranch.at(-1).slice());    //Add a new branch. If it isn't needed, it will be removed below.
                    verticesByBranch.at(-2).push(...newBranch);
                }

                //If the next vertex isn't a branch, we created a branch too many, so remove the last one. Also check that all branches are adjacent to each other.
                let nextNode = node.nextElementSibling;
                if(nextNode?.tagName.toLowerCase() !== "branch"){
                    verticesByBranch.pop();
                    while(nextNode !== null){
                        if(nextNode.tagName.toLowerCase() === "branch"){
                            throw new PlaceParseException(`Line ${lineName} contains non-adjacent branches`);
                        }
                        nextNode = nextNode.nextElementSibling;
                    }
                }
                break;

            case "tgv":
                for(let vertices of verticesByBranch){
                    const previousVertex = vertices.at(-1);
                    if(previousVertex instanceof Branch.OneWayLoop){
                        throw new PlaceParseException("TGV segments must be two-way");
                    }
                    previousVertex.nextSegmentIsTGV = true;
                }
                break;

            default:
                throw new PlaceParseException("Unknown line node: " + node.tagName);
            }
        }

        return [verticesByBranch, labels];
    }
}
PlaceParser = typechecked(PlaceParser);

/**
 * Parses a list of points in background elements.
 *
 * @param pointString   A string containing all the points, where different points are separated by commas and the coordinates of a point are separated by spaces.
 *
 * @return An array with all the points contained in the string.
 */
function parsePointString(pointsString /*: String */) /*: Array<Point> */ {
    if(pointsString === ""){
        return [];
    }

    const points = [];
    const MAX_COORDINATE = 1000000;
    for(let pointString of pointsString.split(",")){
        const pointArray = pointString.trim().split(/\s+/)
        if(pointArray.length !== 2){
            throw new PlaceParseException("Invalid format for point: " + pointString);
        }
        const [xStr, yStr] = pointArray;
        const x = xStr === "l" ? -MAX_COORDINATE : xStr === "r" ? MAX_COORDINATE : parseFloat(xStr);
        const y = yStr === "t" ? -MAX_COORDINATE : yStr === "b" ? MAX_COORDINATE : parseFloat(yStr);

        if(Number.isNaN(x)){
            throw new PlaceParseException("Invalid value for x coordinate: " + xStr);
        }
        if(Number.isNaN(y)){
            throw new PlaceParseException("Invalid value for y coordinate: " + yStr);
        }
        if(x > MAX_COORDINATE || x < -MAX_COORDINATE){
            throw new PlaceParseException("x coordinate out of bounds: " + x);
        }
        if(y > MAX_COORDINATE || y < -MAX_COORDINATE){
            throw new PlaceParseException("y coordinate out of bounds: " + y);
        }

        points.push(new Point(x, y));
    }
    return points;
}
parsePointString = typechecked(parsePointString);

/**
 * Finds at which point(s) a label should be. There can be multiple points if the label is on a segment between one-way points.
 *
 * @param offset            The offset at which the label should be compared to the center of the segment, as specified in the XML file.
 * @param lineName          The name of the line that the label belongs to. Used to determine the size of the label.
 * @param previousVertex    The vertex before the label.
 * @param nextVertex        The vertex after the label.
 *
 * @return An array of points where there should be labels (often only containing one element, but not always).
 */
function getLabels(offset /*: Number */, lineName /*: String */, previousVertex /*: Branch.Vertex | Branch.OneWayLoop */, nextVertex /*: Branch.Vertex | Branch.OneWayLoop */) /*: Array<Point> */ {
    let segments;
    if(previousVertex instanceof Branch.OneWayLoop || nextVertex instanceof Branch.OneWayLoop){
        segments = [new Segment(
            (previousVertex.leftbound ?? previousVertex).point,
            (nextVertex.leftbound ?? nextVertex).point
        ),
        new Segment(
            (previousVertex.rightbound ?? previousVertex).point,
            (nextVertex.rightbound ?? nextVertex).point
        )];
    }
    else{
        segments = [new Segment(previousVertex.point, nextVertex.point)];
    }

    const width = getTextWidth(lineName, "sans-serif", "10px") + 1;    //+1 for the margin
    const height = 10;

    const points = segments.map(typechecked((segment /*: Segment */) /*: Point | null */ => {
        let moveUnits;    //The number of pixels away from the center of the segment that a label defined as \l+1 or \l-1 should be
        if(segment.slope % Math.PI === 0){
            //If it's completely horizontal, ignore the height
            moveUnits = width;
        }
        else if(segment.slope % (Math.PI / 2) === 0){
            //If it's completely vertical, ignore the width
            moveUnits = height;
        }
        else{
            moveUnits = Math.max(width, height);
        }
        const distanceFromStart = offset * moveUnits + segment.length / 2;
        const result = segment.pointAtLength(distanceFromStart);
        if(result === null){
            console.warn(`Ignoring label ${offset} outside of segment on line ${lineName}`);
        }
        return result;
    }));
    return points.filter(it => it !== null);
}
getLabels = typechecked(getLabels);

/**
 * Gets the name of a line from its XML node, and returns a default value if the XML node has no name attribute. Also works on child nodes of line nodes, in which case it returns the name of the parent line. Throws an exception for all other nodes.
 *
 * @return The name as specified by the XML node, or if it doesn't exist, a train/bus emoji for train and bus lines and the string "Walking line" for walking lines.
 */
function lineNameFromNode(node /*: Element */) /*: String */ {
    switch(node.tagName.toLowerCase()){
    case "trainline":
        return node.getAttribute("name") ?? "🚆\ufe0e";    //\ufe0e makes the emoji the same color as the text
    case "busline":
        return node.getAttribute("name") ?? "🚌\ufe0e";
    case "walkingline":
        return "Walking line";
    case "autostation":
    case "stationref":
    case "point":
    case "oneway":
    case "label":
    case "branch":
    case "tgv":
        return lineNameFromNode(node.parentElement);
    default:
        throw new PlaceParseException("Unkown line type: " + node.tagName);
    }
}
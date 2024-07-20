"use strict";

import typechecked from "https://gustavlindberg99.github.io/Typecheck.js/min/typecheck-v1.min.js";
import lodash from 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/+esm';
import {QObject} from "https://gustavlindberg99.github.io/QtLinguistWeb/qtranslator-v1.min.js";
import {Multiline, Polygon} from "https://unpkg.com/@flatten-js/core@1.4.8/dist/main.mjs";
typechecked.add(Multiline, Polygon);

import {wait, refreshUI} from "../utils/async-utils.js";
import {getTextWidth, hexToRgb, rgbToHex, textColorOnBackground} from "../utils/graphic-utils.js";
import {makeDragScrollable, makeZoomable, createZoomBox} from "../utils/scroll.js";
import {deviceIsMobile} from "../utils/utils.js";

import BusLine from "./bus-line.js";
import GameInfoBox from "./game-info-box.js";
import MapListView from "./map-list-view.js";
import Player from "./player.js";
import Station from "./station.js";
import TrainLine from "./train-line.js";
import WalkingLine from "./walking-line.js";

export default class GameView{
    gameInfoBox /*: GameInfoBox */;
    closeBubble /*: function */ = () => {};

    #place /*: Place */;

    #dom /*: HTMLDivElement */ = document.createElement("div");
    #mainScrollArea /*: HTMLDivElement */ = document.createElement("div");
    #myPosition /*: SVGElement */;
    #opponentPosition /*: SVGElement | null */ = null;

    #availableMaps /*: MapListView */;
    #stillNeededMaps /*: MapListView */;
    #opponentStillNeededMaps /*: MapListView | null */ = null;

    #linePaths /*: Map<Line, SVGElement> */ = new Map();
    #lineLabels /*: Map<Line, Array<SVGElement>> */ = new Map();
    #stationMarkers /*: Map<Line, Array<[Station, SVGElement]> */ = new Map();
    #directionMarkers /*: Map<Line, Map<Station, SVGElement>> */ = new Map();
    #globalStationMarkers /*: Map<Line, Map<Station, SVGElement>> */ = new Map();
    #stationLabels /*: Map<Station, SVGElement> */ = new Map();
    #highlightedLine /*: Line | null */ = null;

    /**
     * Constructs a GameView object and draws the map list view, the map area and the game info box, but doesn't append the game view to anything.
     *
     * @param place             The place to play the game in.
     * @param startingStation   The station to start at.
     * @param opponent          The opponent if it's a multiplayer game, null if it's a single-player game.
     */
    constructor(place /*: Place */, startingStation /*: Station */, opponent /*: Opponent | null */){
        Object.seal(this);

        this.#place = place;

        this.#dom.className = "gameViewContainer";

        const mapArea = this.#createMapArea(place, opponent !== null);
        this.#dom.appendChild(this.#createMapList(startingStation, opponent !== null));

        const gameView = document.createElement("div");
        gameView.className = "gameView";
        const zoomBox = createZoomBox();
        gameView.appendChild(zoomBox);

        this.gameInfoBox = new GameInfoBox(gameView, this.#place.playingWithMoney, opponent);
        this.gameInfoBox.setNumberOfMaps(0, this.#place.maps.length);
        this.gameInfoBox.setNumberOfMaps(0, this.#place.maps.length, opponent);
        this.gameInfoBox.setCurrentStation(startingStation);
        if(opponent !== null){
            this.gameInfoBox.setCurrentStation(opponent.currentStation, opponent);
            this.gameInfoBox.setMoney(0, 1, true, null);
            this.gameInfoBox.setMoney(0, 1, true, opponent);
        }
        else{
            this.gameInfoBox.setTime(this.#place.startingTime, this.#place.startingTime);
            this.gameInfoBox.setMoney(this.#place.startingMoney, this.#place.startingMoney, false, null);
        }

        this.#mainScrollArea.className = "mainScrollArea";
        this.#mainScrollArea.appendChild(mapArea);
        gameView.appendChild(this.#mainScrollArea);
        this.#dom.appendChild(gameView);

        makeDragScrollable(mapArea);
        makeZoomable(mapArea, zoomBox, null, 1, startingStation.point.x - place.box().xmin, startingStation.point.y - place.box().ymin);
    }

    /**
     * Places the game view in the <section role="application"> DOM element, and removes any children that element had before.
     */
    show() /*: void */ {
        document.querySelector("section[role=application]").replaceChildren(this.#dom);
    }

    /**
     * Sets the position of the player to a given point.
     *
     * @param point The point to set the position to.
     */
    setMyPosition(point /*: Point */) /*: void */ {
        this.#myPosition.setAttribute("transform", `translate(${point.x}, ${point.y})`);
    }

    /**
     * Sets the position of the opponent to a given point.
     *
     * @param point The point to set the position to.
     */
    setOpponentPosition(point /*: Point */) /*: void */ {
        this.#opponentPosition.setAttribute("transform", `translate(${point.x}, ${point.y})`);
    }

    /**
     * Sets the position of the player to a given point and shows the animation shown at start. This is an async function that returns when the animation is done playing.
     *
     * @param myPosition        The point to set the position to.
     * @param opponentPosition  The point to set the opponent's position to, or null if playing a single-player game.
     */
    async setStartingPosition(myPosition /*: Point */, opponentPosition /*: Point | null */) /*: void */ {
        let elementPointPairs = [[this.#myPosition, myPosition], [this.#opponentPosition, opponentPosition]];
        for(let scale = 20; true; scale = Math.max(1, scale * 0.96)){
            for(let elementPointPair of elementPointPairs){
                const [positionElement, point] = elementPointPair;
                if(positionElement !== null && scale !== 20 && !/(^|\s)scale\s*\(/.test(positionElement.getAttribute("transform"))){    //If the position has changed, the scale attribute will be removed automatically, and if this is the case, the thing shouldn't continue shrinking
                    elementPointPairs = elementPointPairs.filter(it => it !== elementPointPair);
                }
                positionElement?.setAttribute("transform", `translate(${point.x}, ${point.y}) scale(${scale})`);
                if(scale === 1){
                    elementPointPairs = elementPointPairs.filter(it => it !== elementPointPair);;
                }
            }
            if(elementPointPairs.length === 0){
                break;
            }
            await wait(10);
        }
    }

    /**
     * Highlights a given line and unhighlights any other lines that were previously highlighted. If the line is already highlighted, unhighlights it instead without highlighting anything else.
     *
     * @param line  The line to toggle highlighting on.
     */
    highlightLine(line /*: Line */) /*: void */ {
        //If it's already highlighted, unhighlight it instead
        if(this.#highlightedLine === line){
            this.unhighlightAllLines();
            return;
        }

        //Gray out everything else
        for(let [otherLine, linePath] of this.#linePaths){
            linePath.setAttribute("stroke", grayedOutColor(otherLine.color));
            linePath.setAttribute("stroke-width", otherLine.width() + "px");
        }
        for(let [otherLine, lineLabels] of this.#lineLabels){
            for(let label of lineLabels){
                label.querySelector("rect").setAttribute("fill", grayedOutColor(otherLine.color));
                label.querySelector("text").setAttribute("fill", grayedOutColor(textColorOnBackground(otherLine.color)));
            }
        }
        for(let [otherLine, stationMarkers] of this.#stationMarkers){
            for(let [station, marker] of stationMarkers){
                marker.setAttribute("stroke", grayedOutColor(otherLine.color));
            }
        }
        for(let [otherLine, directionMarkers] of this.#directionMarkers){
            for(let marker of directionMarkers.values()){
                marker.setAttribute("fill", grayedOutColor("#000000"));
            }
        }
        for(let [otherLine, globalStationMarkers] of this.#globalStationMarkers){
            for(let marker of globalStationMarkers.values()){
                marker.setAttribute("stroke", grayedOutColor("#000000"));
            }
        }
        for(let [station, label] of this.#stationLabels){
            label.setAttribute("fill", grayedOutColor("#000000"));
        }

        //Highlight this line
        const linePath = this.#linePaths.get(line);
        linePath.setAttribute("stroke", line.color);
        linePath.setAttribute("stroke-width", line.width() * 1.5 + "px");
        for(let label of this.#lineLabels.get(line) ?? []){
            label.querySelector("rect").setAttribute("fill", line.color);
            label.querySelector("text").setAttribute("fill", textColorOnBackground(line.color));
        }
        for(let [station, marker] of this.#stationMarkers.get(line) ?? []){
            marker.setAttribute("stroke", line.color);
        }
        for(let marker of this.#directionMarkers.get(line)?.values() ?? []){
            marker.setAttribute("fill", "black");
        }
        for(let marker of this.#globalStationMarkers.get(line)?.values() ?? []){
            marker.setAttribute("stroke", "black");
        }
        for(let station of line.stations()){
            this.#stationLabels.get(station).setAttribute("fill", "black");
        }

        //Remove and append the line path so that it's on top
        const parent = linePath.parentElement;
        parent.removeChild(linePath);
        parent.appendChild(linePath);

        this.#highlightedLine = line;
        this.#stillNeededMaps.unhighlightAllMaps();
        this.#stillNeededMaps.highlightMap(line);
        this.#opponentStillNeededMaps?.unhighlightAllMaps();
        this.#opponentStillNeededMaps?.highlightMap(line);
    }

    /**
     * Unhighlights all lines.
     */
    unhighlightAllLines() /*: void */ {
        for(let [line, linePath] of this.#linePaths){
            linePath.setAttribute("stroke", line.color);
            linePath.setAttribute("stroke-width", line.width() + "px");
        }
        for(let [line, lineLabels] of this.#lineLabels){
            for(let label of lineLabels){
                label.querySelector("rect").setAttribute("fill", line.color);
                label.querySelector("text").setAttribute("fill", textColorOnBackground(line.color));
            }
        }
        for(let [line, stationMarkers] of this.#stationMarkers){
            for(let [station, marker] of stationMarkers){
                marker.setAttribute("stroke", line.color);
            }
        }
        for(let [line, globalStationMarkers] of this.#globalStationMarkers){
            for(let marker of globalStationMarkers.values()){
                marker.setAttribute("stroke", "black");
            }
        }
        for(let [line, directionMarkers] of this.#directionMarkers){
            for(let marker of directionMarkers.values()){
                marker.setAttribute("fill", "black");
            }
        }
        for(let [station, label] of this.#stationLabels){
            label.setAttribute("fill", "black");
        }

        this.#highlightedLine = null;
        this.#stillNeededMaps.unhighlightAllMaps();
        this.#opponentStillNeededMaps?.unhighlightAllMaps();
    }

    /**
     * Adds click events to all stations so that clicking on a station goes there.
     */
    enableStationClickEvents() /*: void */ {
        if(!this.#place.isPlayingGame()){
            return;
        }
        for(let [newStation, element] of this.#allStationElements()){
            if(newStation === this.#place.player.currentStation){
                element.onclick = null;
                element.style.cursor = "";
            }
            else{
                element.onclick = () => this.#clickOnStation(newStation);
                element.style.cursor = "pointer";
            }
        }
        if(this.#opponentPosition !== null){
            this.#opponentPosition.onclick = () => {
                if(!this.#place.player.opponent.currentlyRiding){
                    this.#clickOnStation(this.#place.player.opponent.currentStation);
                }
            }
        }
    }

    /**
     * Disables click events for all stations. Useful so that clicking on a station while moving doesn't allow you to jump off the train/bus.
     */
    disableStationClickEvents() /*: void */ {
        for(let [_, element] of this.#allStationElements()){
            element.onclick = null;
            element.style.cursor = "";
        }
        if(this.#opponentPosition !== null){
            this.#opponentPosition.onclick = null;
        }
    }

    /**
     * Updates which maps the opponent still needs in the map list view. Doesn't update anything in the game info box. Should only be called in two-player games, calling this in one-player games will cause an error.
     */
    updateOpponentStillNeededMaps() /*: void */ {
        this.#opponentStillNeededMaps.updateGrayedOut(this.#place.player.opponent.maps);
    }

    /**
     * Gets all station elements, including per-line markers, global markers, direction markers and labels.
     *
     * @return An array of tuples where the first element is the station and the second element is a corresponding SVG element. A given station can have multiple corresponding SVG elements, so multiple tuples can have the same station (so this is different from a map).
     */
    #allStationElements() /*: Array<[Station, SVGElement]> */ {
        return [
            ...this.#stationMarkers.values(),
            ...this.#globalStationMarkers.values(),
            ...this.#directionMarkers.values(),
            this.#stationLabels
        ].flatMap(it => [...it]);
    }

    /**
     * Shows a dialog to select which line to take.
     *
     * @param start The station the player is currently at.
     * @param end   The station the player wants to go to.
     *
     * @return A tuple containing the chosen line, the lookForLast parameter for circular lines, and whether the player chose to fare evade. If the player chose not to go anywhere, all three values are null.
     */
    async #selectLine(start /*: Station */, end /*: Station */) /*: [Line, Boolean, Boolean] | [null, null, null] */ {
        const possibleLines = this.#place.lines.filter(it => it.branchBetweenStations(start, end) !== null);

        if(possibleLines.length === 0){
            Toastify({
                text: QObject.tr("There is no direct line from your current position to this station."),
                close: true,
                style: {
                    background: "red"
                }
            }).showToast();
            return [null, null, null];
        }

        const possibleWays /*: Map<Array<Station>, Array<[Line, Boolean]>> */ = new Map();    //Maps a possible way (i.e. array of stations) to all the lines that go that way
        for(let line of possibleLines){
            for(let lookForLast of [false, true]){
                const branch = line.branchBetweenStations(start, end);
                const way = branch.stationsBetweenStations(start, end, lookForLast);
                const key = [...possibleWays.keys()].find(it => lodash.isEqual(it, way));
                if(key === undefined){
                    possibleWays.set(way, [[line, lookForLast]]);
                }
                else{
                    possibleWays.get(key).push([line, lookForLast]);
                }
            }
        }

        const linesAndViaStations /*: Array<[Line, Station | null, Boolean]> */ = [];    //Maps a randomly selected line to a via station and a lookForLast boolean
        for(let [way, lines] of possibleWays){
            //The via station is the station that the fewest other ways stop at
            let viaStation = null;
            let minimalWayCount = possibleWays.size;    //The number of other ways that stop at viaStation. Initialize to possibleWays.size because if all other ways stop at all possible via stations, we don't want to display any of them.
            for(let possibleViaStation of way){
                const otherWaysStoppingHere = [...possibleWays.keys()].filter(it => it.includes(possibleViaStation));
                const currentWayCount = [...otherWaysStoppingHere].length;
                if(currentWayCount < minimalWayCount){
                    viaStation = possibleViaStation;
                    minimalWayCount = currentWayCount;
                }
            }

            const [line, lookForLast] = lodash.sample(lines);
            linesAndViaStations.push([line, viaStation, lookForLast]);
        }

        if(linesAndViaStations.length === 1 && linesAndViaStations[0][0] instanceof WalkingLine){
            //If it's a walking line, don't ask for confirmation
            return [linesAndViaStations[0][0], linesAndViaStations[0][2], false];
        }

        let fareEvasionCheckboxStr = "";
        const text = (linesAndViaStations.length === 1 ? QObject.tr("Do you want to go to %1?") : QObject.tr("Which line do you want to ride to %1?")).arg(end.name);
        const buttons = linesAndViaStations.map(typechecked(([line /*: Line */, viaStation /*: Station | null */, lookForLast /*: Boolean */], i /*: Number */) /*: String */ => {
            const [red, green, blue] = hexToRgb(line.color);
            let lineStyle = "";
            if(linesAndViaStations.length > 1){
                lineStyle = `background-color: ${line.color}; color: ${textColorOnBackground(line.color)}; border: 1px solid ${rgbToHex(red / 2, green / 2, blue / 2)}`;
            }
            let result = `<button id="gotoButton${i}" style="width: 100%; ${lineStyle}">`;
            result += linesAndViaStations.length > 1 ? line.name : QObject.tr("Go");
            if(viaStation !== null){
                result += " " + QObject.tr("(via %1)").arg(viaStation.name);
            }
            const cost = line.costBetweenStations(start, end, lookForLast);
            if(cost > 0){
                fareEvasionCheckboxStr = "<label><input id=\"fareEvasionCheckbox\" type=\"checkbox\"/>" + QObject.tr("Fare evade") + "</label><br/>";
                result += " <span class=\"cost\">" + QObject.tr("(Cost: $%1)").arg(cost) + "</span>";
            }
            result += "</button>";
            return result;
        })).join("<br/>");
        const cancelButton = "<button id=\"cancelGoto\" style=\"width: 100%\">" + QObject.tr("Cancel") + "</button>";

        const marker = [...this.#globalStationMarkers.values(), ...this.#stationMarkers.values()].map(it => new Map(it)).find(it => it.has(end)).get(end);
        const color = getComputedStyle(document.documentElement).getPropertyValue("--background-color-light");

        //Wait for existing buttons to close
        while(document.getElementById("cancelGoto") !== null){
            await refreshUI();
        }

        const bubble = tippy(marker, {
            content: text + "<br/>" + fareEvasionCheckboxStr + buttons + "<br/>" + cancelButton,
            allowHTML: true,
            placement: "right",
            showOnCreate: true,
            trigger: "manual",
            hideOnClick: false
        });

        const selectedLine = await new Promise((resolvePromise) => {
            this.closeBubble = () => resolvePromise([null, null, null]);

            document.getElementById("cancelGoto").onclick = this.closeBubble;
            this.#mainScrollArea.addEventListener("scroll", this.closeBubble);
            for(let [_, element] of this.#allStationElements()){
                element.addEventListener("click", this.closeBubble);
            }

            for(let i = 0; i < linesAndViaStations.length; i++){
                const [line, _, lookForLast] = linesAndViaStations[i];
                const button = document.getElementById("gotoButton" + i);
                const fareEvasionCheckbox = document.getElementById("fareEvasionCheckbox");
                const cost = line.costBetweenStations(start, end, lookForLast);
                fareEvasionCheckbox?.addEventListener("change", () => button.querySelector("span.cost").textContent = fareEvasionCheckbox.checked ? QObject.tr("(Fine if you get caught: $%1)").arg(cost * Player.FARE_EVASION_FINE_FACTOR) : QObject.tr("(Cost: $%1)").arg(cost));
                button.onclick = () => resolvePromise([line, lookForLast, fareEvasionCheckbox?.checked ?? false]);
                if(linesAndViaStations.length > 1){
                    const [red, green, blue] = hexToRgb(line.color);
                    button.onmouseover = () => {
                        button.style.backgroundColor = rgbToHex((red + 255) / 2, (green + 255) / 2, (blue + 255) / 2);
                    };
                    button.onmouseout = button.onmouseup = () => {
                        button.style.backgroundColor = line.color;
                    };
                    button.onmousedown = () => {
                        button.style.backgroundColor = rgbToHex(red / 1.2, green / 1.2, blue / 1.2);
                    };
                }
            }
        });

        this.#mainScrollArea.removeEventListener("scroll", this.closeBubble);
        for(let [_, element] of this.#allStationElements()){
            element.removeEventListener("click", this.closeBubble);
        }

        bubble.hide();
        return selectedLine;
    }

    /**
     * Creates the left panel with the map lists without appending it to the game view's DOM.
     *
     * @param startingStation   The station to start at, useful for setting the available maps.
     * @param isMultiplayerGame True if it's a multiplayer game, false if it's a single-player game.
     *
     * @return The map list panel so that it can be appended to the DOM.
     */
    #createMapList(startingStation /*: Station */, isMultiplayerGame /*: Boolean */) /*: HTMLElement */ {
        const result = document.createElement("div");
        result.className = "mapListViews";

        this.#availableMaps = new MapListView(
            result,
            QObject.tr("Available maps"),
            QObject.tr("No maps available"),
            this.#myPosition
        );
        this.#availableMaps.setMaps(startingStation.availableMaps);
        this.#availableMaps.onmapclick = (map) => {
            if(this.#place.gameIsPaused){
                Toastify({
                    text: QObject.tr("You can't do this while the game is paused."),
                    close: true,
                    style: {
                        background: "red"
                    }
                }).showToast();
            }
            else if(this.#place.player.maps.has(map)){
                Toastify({
                    text: QObject.tr("You already have this map."),
                    close: true,
                    style: {
                        background: "red"
                    }
                }).showToast();
            }
            else{
                this.#place.player.collect(map);
                this.#availableMaps.updateGrayedOut(this.#place.player.maps);
                this.#stillNeededMaps.updateGrayedOut(this.#place.player.maps);
            }
        };

        this.#stillNeededMaps = new MapListView(
            result,
            QObject.tr("Maps you still need"),
            null
        );
        this.#stillNeededMaps.onmapclick = (map) => this.highlightLine(map);
        this.#stillNeededMaps.setMaps(this.#place.maps);
        this.#stillNeededMaps.isVisible = !deviceIsMobile();

        if(isMultiplayerGame){
            this.#opponentStillNeededMaps = new MapListView(
                result,
                QObject.tr("Maps your opponent still needs"),
                null
            );
            this.#opponentStillNeededMaps.onmapclick = (map) => this.highlightLine(map);
            this.#opponentStillNeededMaps.setMaps(this.#place.maps);
            this.#opponentStillNeededMaps.isVisible = !deviceIsMobile();
        }

        return result;
    }

    /**
     * Creates the SVG <path> element for a given line without appending it to the game view's DOM.
     *
     * @param line  The line to create the path for.
     *
     * @return The path element so that it can be appended to the DOM.
     */
    #createlinePath(line /*: Line */) /*: SVGElement */ {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", line.svgPath());
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", line.color);
        path.setAttribute("stroke-width", line.width() + "px");
        if(line instanceof WalkingLine){
            path.setAttribute("stroke-dasharray", "5 2");
        }
        else{
            path.setAttribute("stroke-linecap", "square");    //Otherwise lines with one-way loops look bad
        }

        this.#linePaths.set(line, path);
        return path;
    }

    /**
     * Creates a line label at a given point without appending it to the game view's DOM.
     *
     * @param line  The line that the label belongs to.
     * @param point The point to create the label at.
     *
     * @return The line label so that it can be appended to the DOM.
     */
    #createLineLabel(line /*: Line */, point /*: Point */) /*: SVGElement */ {
        const MARGIN = 3;
        const width = getTextWidth(line.name, "sans-serif", line.labelFontSize() + "px");
        const height = line.labelFontSize();

        const x = point.x - width / 2 - MARGIN;
        const y = point.y - height / 2 - MARGIN;

        const label = document.createElementNS("http://www.w3.org/2000/svg", "g");

        const highlightToolTip = document.createElementNS("http://www.w3.org/2000/svg", "title");
        highlightToolTip.textContent = QObject.tr("Highlight line %1").arg(line.name);
        label.appendChild(highlightToolTip);

        const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        background.setAttribute("fill", line.color);
        background.setAttribute("x", x);
        background.setAttribute("y", y);
        background.setAttribute("width", width + 2 * MARGIN);
        background.setAttribute("height", height + 2 * MARGIN);
        background.setAttribute("rx", 4);
        background.style.cursor = "pointer";
        label.appendChild(background);

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("text-anchor", "start");
        text.setAttribute("x", x + MARGIN);
        text.setAttribute("y", y + MARGIN + height);
        text.setAttribute("font-size", line.labelFontSize() + "px");
        text.setAttribute("fill", textColorOnBackground(line.color));
        text.textContent = line.name;
        text.style.cursor = "pointer";
        label.appendChild(text);

        label.onclick = () => this.highlightLine(line);

        if(!this.#lineLabels.has(line)){
            this.#lineLabels.set(line, []);
        }
        this.#lineLabels.get(line).push(label);
        return label;
    }

    /**
     * Creates all elements for a given station, including markers and labels, without appending them to the game view's DOM.
     *
     * @param place     The place that the station belongs to.
     * @param station   The station to create elements for.
     *
     * @return A <g> element with all the SVG elements for the station so that it can be appended to the DOM.
     */
    #createStationElement(place /*: Place */, station /*: Station */) /*: SVGElement */ {
        const result = document.createElementNS("http://www.w3.org/2000/svg", "g");

        if(station.width !== null && station.height !== null){
            const marker = createStationMarker(station.point, station.width, station.height, "black");
            result.appendChild(marker);
            for(let line of place.lines){
                if(line.stopsAt(station)){
                    if(!this.#globalStationMarkers.has(line)){
                        this.#globalStationMarkers.set(line, new Map());
                    }
                    this.#globalStationMarkers.get(line).set(station, marker);
                }
            }
        }
        else{
            for(let line of place.lines){
                if(line.stopsAt(station) && !(line instanceof WalkingLine)){
                    for(let point of line.pointsAtStation(station)){
                        const size = line instanceof BusLine ? Station.MARKER_SIZE * 0.75 : Station.MARKER_SIZE;
                        const marker = createStationMarker(point, size, size, line.color);
                        if(!this.#stationMarkers.has(line)){
                            this.#stationMarkers.set(line, []);
                        }
                        this.#stationMarkers.get(line).push([station, marker]);
                        result.appendChild(marker);

                        const direction = line.branches.find(it => it.stopsAt(station)).directionAtStation(station);
                        if(direction !== null){
                            const arrowSize = size / 2;
                            const arrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
                            arrow.setAttribute("d", `M${-arrowSize / 2} ${-arrowSize} L${arrowSize / 2} 0 L${-arrowSize / 2} ${arrowSize}`)
                            arrow.setAttribute("stroke", "none");
                            arrow.setAttribute("fill", "black");
                            arrow.setAttribute("transform", `translate(${point.x}, ${point.y}) rotate(${direction})`);
                            if(!this.#directionMarkers.has(line)){
                                this.#directionMarkers.set(line, new Map());
                            }
                            this.#directionMarkers.get(line).set(station, arrow);
                            result.appendChild(arrow);
                        }
                    }
                }
            }
        }

        if(station.alignment !== Station.Alignment.Invisible){
            const textLines = station.nameWithLineBreaks.split("\n");

            const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute("font-size", Station.FONT_SIZE + "px");
            switch(station.alignment){
            case Station.Alignment.Right:
                label.setAttribute("x", station.textBox().xmin);
                break;
            case Station.Alignment.Left:
                label.setAttribute("x", station.textBox().xmax);
                break;
            default:
                label.setAttribute("x", station.textBox().center.x);
                break;
            }
            label.setAttribute("y", station.textBox().ymin + Station.FONT_SIZE);
            label.setAttribute("text-anchor", station.alignment.textAnchor());

            for(let i = 0; i < textLines.length; i++){    //We need i to check if i > 0
                const textLineElement = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
                if(i > 0){
                    textLineElement.setAttribute("x", label.getAttribute("x"));
                    textLineElement.setAttribute("dy", Station.PARAGRAPH_SEPARATION + "em");
                }
                textLineElement.textContent = textLines[i].trim();
                label.appendChild(textLineElement);
            }

            this.#stationLabels.set(station, label);
            result.appendChild(label);
        }

        return result;
    }

    /**
     * Creates the map area for a place without appending them to the game view's DOM.
     *
     * @param place             The place to create the map area for.
     * @param isMultiplayerGame True if it's a multiplayer game, false if it's a single-player game.
     *
     * @return An <svg> element with the map area so that it can be appended to the DOM.
     */
    #createMapArea(place /*: Place */, isMultiplayerGame /*: Boolean */) /*: SVGSVGElement */ {
        const mapArea = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const xmin = place.box().xmin;
        const ymin = place.box().ymin;
        const width = place.box().width;
        const height = place.box().height;
        mapArea.setAttribute("viewBox", `${xmin} ${ymin} ${width} ${height}`);
        mapArea.setAttribute("width", width);
        mapArea.setAttribute("height", height);

        const background = document.createElementNS("http://www.w3.org/2000/svg", "g");
        background.setAttribute("opacity", 0.3);
        for(let zone of place.zones){
            if(zone.polygon !== null){
                background.appendChild(createBackgroundElement(zone.polygon, zone.color));
            }
        }

        for(let lake of place.lakes){
            background.appendChild(createBackgroundElement(lake, "#3bf"));
        }

        for(let zone of place.zones){
            for(let island of zone.islands){
                background.appendChild(createBackgroundElement(island, zone.color));
            }
        }
        mapArea.appendChild(background);

        for(let river of place.rivers){
            background.appendChild(createBackgroundElement(river, "#3bf"));
        }

        const linePaths = document.createElementNS("http://www.w3.org/2000/svg", "g");
        for(let line of place.lines){
            linePaths.appendChild(this.#createlinePath(line));
        }
        mapArea.appendChild(linePaths);

        const lineLabels = document.createElementNS("http://www.w3.org/2000/svg", "g");
        for(let line of place.lines){
            for(let point of line.labels){
                lineLabels.appendChild(this.#createLineLabel(line, point));
            }
        }
        mapArea.appendChild(lineLabels);

        const stations = document.createElementNS("http://www.w3.org/2000/svg", "g");
        for(let station of place.stations){
            stations.appendChild(this.#createStationElement(place, station));
        }
        mapArea.appendChild(stations);

        this.#myPosition = createPositionMarker("#2f45e6");
        mapArea.appendChild(this.#myPosition);
        if(isMultiplayerGame){
            this.#opponentPosition = createPositionMarker("#d21e17");
            mapArea.appendChild(this.#opponentPosition);
        }

        this.#setupUnighlightEventListeners(mapArea);

        return mapArea;
    }

    /**
     * Sets up the event listeners that unhighlight all lines when clicking in the background of the map area or pressing the Escape key.
     *
     * @param mapArea   The map area <svg> element.
     */
    #setupUnighlightEventListeners(mapArea /*: SVGSVGElement */) /*: void */ {
        //Unhighlight all lines when clicking somewhere unrelated in the map area
        let scrollLeft, scrollTop;
        mapArea.addEventListener("mousedown", () => {
            scrollLeft = mapArea.parentElement.scrollLeft;
            scrollTop = mapArea.parentElement.scrollTop;
        });
        mapArea.addEventListener("mouseup", (event) => {
            if(
                //Don't unhighlight everything if we're highlighting a line, otherwise it's not possible to know if the line was already highlighted when deciding whether to highlight or unhighlight it
                ![...this.#lineLabels.values()].flat().some(it => it.contains(event.target)) &&
                //Don't unhighlight when dragging the map area
                scrollLeft === mapArea.parentElement.scrollLeft && scrollTop === mapArea.parentElement.scrollTop
            ){
                this.unhighlightAllLines();
            }
        });

        //Unhighlight all lines when the Esc key is pressed
        document.addEventListener("keydown", (event) => {
            const key = event.which;
            if(key === 27){    //27 is the Escape key
                this.unhighlightAllLines();
            }
        });
    }

    /**
     * Event listenter that gets called when the player clicks on a station. This is an async function which returns when the user has arrived at their destination.
     *
     * @param newStation    The station the player clicked on.
     */
    async #clickOnStation(newStation /*: Station */) /*: void */ {
        const start = this.#place.player.currentStation;
        const [selectedLine, lookForLast, fareEvade] = await this.#selectLine(start, newStation);
        if(selectedLine !== null){
            const cost = fareEvade ? 0 : selectedLine.costBetweenStations(start, newStation, lookForLast);
            if(this.#place.gameIsPaused){
                Toastify({
                    text: QObject.tr("You can't do this while the game is paused."),
                    close: true,
                    style: {
                        background: "red"
                    }
                }).showToast();
            }
            else if(cost > this.#place.player.remainingMoney && this.#place.player.opponent === null){
                Toastify({
                    text: QObject.tr("You can't afford to do this. Try going somewhere cheaper or fare evading."),
                    close: true,
                    style: {
                        background: "red"
                    }
                }).showToast();
            }
            else{
                this.#place.player.spendMoney(cost);
                this.#availableMaps.setMaps(selectedLine.availableMaps ?? []);
                this.#availableMaps.updateGrayedOut(this.#place.player.maps);
                this.gameInfoBox.setCurrentLine(selectedLine, newStation);
                await this.#place.player.goToStation(selectedLine, newStation, lookForLast, fareEvade);
                if(this.#place.isPlayingGame()){
                    this.#availableMaps.setMaps(newStation.availableMaps);
                    this.#availableMaps.updateGrayedOut(this.#place.player.maps);
                    this.gameInfoBox.setCurrentStation(newStation);
                }
            }
        }
    }
}
GameView = typechecked(GameView);

/**
 * Creates an SVG element for a background element without appending it to the game view's DOM.
 *
 * @param points    The points corresponding to the vertices of the background element.
 * @param color     If points is a Polygon, the fill color, and if points is a Multiline, the stroke color.
 *
 * @return The SVG element so that it can be appended to the DOM.
 */
function createBackgroundElement(points /*: Polygon | Multiline */, color /*: String */) /*: SVGElement */ {
    const result = document.createElementNS("http://www.w3.org/2000/svg", "path");
    if(points instanceof Polygon){
        result.setAttribute("d", "M" + [...points.faces].map(face => face.toPolygon().vertices.map(point => point.x + " " + point.y).join("L")).join("M") + "Z");
        result.setAttribute("stroke", "none");
        result.setAttribute("fill", color);
        result.setAttribute("fill-rule", "evenodd");
    }
    else{
        result.setAttribute("d", "M" + points.vertices.map(point => point.x + " " + point.y).join("L"));
        result.setAttribute("fill", "none");
        result.setAttribute("stroke", color);
        result.setAttribute("stroke-width", "5px");
    }
    return result;
}
createBackgroundElement = typechecked(createBackgroundElement);

/**
 * Creates a station marker, which can be used either for all lines at that station or for a specific line.
 *
 * @param point     The point to center the marker at.
 * @param width     The width of the marker.
 * @param height    The height of the marker.
 * @param color     The stroke color of the marker.
 *
 * @return The SVG element for the marker so that it can be appended to the DOM.
 */
function createStationMarker(point /*: Point */, width /*: Number */, height /*: Number */, color /*: String */) /*: SVGElement */ {
    const frame = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    frame.setAttribute("x", point.x - width / 2);
    frame.setAttribute("y", point.y - height / 2);
    frame.setAttribute("width", width);
    frame.setAttribute("height", height);
    frame.setAttribute("rx", Math.min(width / 2, height / 2, Station.MARKER_SIZE / 1.5));
    frame.setAttribute("ry", Math.min(width / 2, height / 2, Station.MARKER_SIZE / 1.5));
    frame.setAttribute("fill", "white");
    frame.setAttribute("stroke", color);
    frame.setAttribute("stroke-width", 1.5);
    return frame;
}
createStationMarker = typechecked(createStationMarker);

/**
 * Creates a marker to display the position of a player.
 *
 * @param color The color of the marker.
 *
 * @return The SVG element for the marker so that it can be appended to the DOM.
 */
function createPositionMarker(color /*: String */) /*: SVGElement */ {
    const result = document.createElementNS("http://www.w3.org/2000/svg", "g");

    const toolTip = document.createElementNS("http://www.w3.org/2000/svg", "title");
    result.appendChild(toolTip);

    const outerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    outerCircle.setAttribute("r", 9);
    outerCircle.setAttribute("fill", color);
    outerCircle.setAttribute("fill-opacity", 0.49);
    outerCircle.setAttribute("stroke", "none");
    result.appendChild(outerCircle);

    const innerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    innerCircle.setAttribute("r", 4);
    innerCircle.setAttribute("fill", color);
    innerCircle.setAttribute("fill-opacity", 0.9);
    innerCircle.setAttribute("stroke", "none");
    result.appendChild(innerCircle);

    return result;
}
createPositionMarker = typechecked(createPositionMarker);

/**
 * Gets the color that a line should be when another line is highlighted.
 *
 * @param hexColor  The line's initial color in hex format (example: #abcdef).
 *
 * @return The grayed out color in hex format.
 */
function grayedOutColor(hexColor /*: String */) /*: String */ {
    let [r, g, b] = hexToRgb(hexColor).map(it => it * 1 / 3 + 255 * 2 / 3);
    return rgbToHex(r, g, b);
}
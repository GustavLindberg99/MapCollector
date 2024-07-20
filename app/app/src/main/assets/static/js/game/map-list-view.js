"use strict";

import typechecked from "https://gustavlindberg99.github.io/Typecheck.js/min/typecheck-v1.min.js";
import {QObject} from "https://gustavlindberg99.github.io/QtLinguistWeb/qtranslator-v1.min.js";

import {staticDomain} from "../utils/ajax-utils.js";
import {wait} from "../utils/async-utils.js";
import {textColorOnBackground} from "../utils/graphic-utils.js";
import {deviceIsMobile, getEaster} from "../utils/utils.js";

import BusLine from "./bus-line.js";

export default class MapListView{
    onmapclick /*: function | null */ = null;

    #showOnEmpty /*: String | null */;
    #parent /*: HTMLElement */;
    #positionElement /*: SVGElement | null */;

    #container /*: HTMLDivElement */ = document.createElement("div");
    #header /*: HTMLHeadingElement */ = document.createElement("h4");
    #numberSpan /*: HTMLSpanElement */ = document.createElement("span");
    #mapListContainer /*: HTMLDivElement */ = document.createElement("div");
    #arrow /*: HTMLSpanElement */ = document.createElement("span");
    #mapList /*: HTMLDivElement */ = document.createElement("div");
    #mapElements /*: Map<LineWithMaps, HTMLElement> */ = new Map();

    static #instances /*: Map<HTMLElement, Array<MapListView>> */ = new Map();    //Maps each parent to all its child views

    /**
     * Constructs a map list view and appends it to parent.
     *
     * @param parent            The DOM element to append the map list view to.
     * @param title             The title of the map list view, shown on the bar above the view. Should not include the number of maps, that will be added automatically.
     * @param showOnEmpty       A string to show instead of maps when setting the map list view to show no maps.
     * @param positionElement   If easter/christmas eggs should be shown, the SVG element marking the position of the player, otherwise null.
     */
    constructor(
        parent /*: HTMLElement */,
        title /*: String */,
        showOnEmpty /*: String | null */,
        positionElement /*: SVGElement | null */ = null
    ){
        Object.seal(this);

        this.#showOnEmpty = showOnEmpty;
        this.#parent = parent;
        this.#positionElement = positionElement;

        this.#container.className = "mapListView";

        this.#header.appendChild(document.createTextNode(title + " ("));
        this.#header.appendChild(this.#numberSpan);
        this.#header.appendChild(document.createTextNode(")"));
        this.#arrow.className = "arrow";
        this.#header.appendChild(this.#arrow);
        this.#header.onclick = () => this.isVisible = !this.isVisible;
        this.#container.appendChild(this.#header);

        this.#mapListContainer.className = "mapListContainer";
        this.#mapList.className = "mapList";
        this.#mapListContainer.appendChild(this.#mapList);
        this.#container.appendChild(this.#mapListContainer);

        parent.appendChild(this.#container);

        if(!MapListView.#instances.has(parent)){
            MapListView.#instances.set(parent, []);
            window.addEventListener("resize", () => this.#updateSizes());
        }
        MapListView.#instances.get(parent).push(this);

        setTimeout(() => this.#updateSizes(), 0);
    }

    /**
     * False if the map list view is collapsed, true if it isn't.
     */
    get isVisible() /*: Boolean */ {
        return !this.#container.classList.contains("collapsed");
    }
    set isVisible(visible /*: Boolean */){
        if(visible){
            this.#container.classList.remove("collapsed");
            if(deviceIsMobile()){    //Hide the other views on mobile devices because the screen is too small to get anything useful out of having several views open at once
                for(let otherView of MapListView.#instances.get(this.#parent)){
                    if(otherView !== this){
                        otherView.isVisible = false;
                    }
                }
            }
        }
        else{
            this.#container.classList.add("collapsed");
        }
        this.#updateSizes();
    }

    /**
     * Sets the maps displayed in the view to the specified maps. Does not update which maps are grayed out, that should be done manually if needed.
     *
     * @param maps  The maps that should be displayed.
     */
    setMaps(maps /*: Array<LineWithMaps> */) /*: void */ {
        const today = new Date();
        const easter = getEaster(today.getFullYear());
        const isChristmas = today.getMonth() === 11 && (today.getDate() === 24 || today.getDate() === 25);    //Since it starts with January = 0, December is 11 and not 12. The Easter egg (or Christmas egg) is visible on Christmas Eve and Christmas Day.
        const isEaster = today.getMonth() === easter.getMonth() && today.getDate() === easter.getDate();
        const showSantaHat = isChristmas && this.#positionElement !== null && this.#positionElement.getElementsByClassName("santaHat").length === 0 && maps.length === 0 && Math.random() <= 10.3;
        const mapInEasterEgg = maps[0];
        const showEasterEgg = isEaster && this.#positionElement !== null && this.#mapList.getElementsByClassName("easterEgg").length === 0 && maps.length === 1 && !mapInEasterEgg.inCollection();

        this.#numberSpan.textContent = maps.length;

        this.#mapElements = new Map();
        this.#mapList.replaceChildren();

        if(maps.length === 0){
            const emptyText = document.createElement("p");
            emptyText.textContent = this.#showOnEmpty;
            this.#mapList.appendChild(emptyText);
        }
        else for(let map of maps){
            const mapElement = createMapElement(map);
            mapElement.onclick = (event) => this.onmapclick?.(map, event);
            this.#mapList.appendChild(mapElement);
            this.#mapElements.set(map, mapElement);
        }

        if(showSantaHat){
            this.#mapList.replaceChildren(this.#createSantaHat());
        }
        if(showEasterEgg){
            this.#mapList.replaceChildren(this.#createEasterEgg(mapInEasterEgg));
        }
    }

    /**
     * Highlights a map to show that the corresponding line in the game view is highlighted. Does nothing if the map isn't part of the list currenlty shown in this view.
     *
     * @param map   The map to highlight.
     */
    highlightMap(map /*: Line */) /*: void */ {
        this.#mapElements.get(map)?.classList.add("selected");
    }

    /**
     * Unhighlights all maps, i.e. undoes what highlightMap() did.
     */
    unhighlightAllMaps() /*: void */ {
        for(let mapElement of this.#mapElements.values()){
            mapElement.classList.remove("selected");
        }
    }

    /**
     * Makes all maps that the specified player already has grayed out.
     *
     * @param maps  The maps that the player has.
     */
    updateGrayedOut(maps /*: Set<LineWithMaps> */) /*: void */ {
        let numberOfMaps = 0;
        for(let [map, mapElement] of this.#mapElements){
            if(maps.has(map)){
                mapElement.style.opacity = 0.3;
            }
            else{
                numberOfMaps++;
                mapElement.style.opacity = 1;
            }
        }
        this.#numberSpan.textContent = numberOfMaps;
    }

    /**
     * Adjusts the size of this view in case the window was resized or if views were collapsed/expanded.
     */
    #updateSizes() /*: void */ {
        let availableHeight = this.#parent.clientHeight;
        for(let view of MapListView.#instances.get(this.#parent)){
            availableHeight -= view.#header.clientHeight;
        }
        availableHeight = Math.max(0, availableHeight);
        const visibleViews = MapListView.#instances.get(this.#parent).filter(it => it.isVisible);
        for(let view of visibleViews){
            view.#mapListContainer.style.height = (availableHeight / visibleViews.length) + "px";
        }
    }

    /**
     * Creats a santa hat without appending it to the DOM. This santa hat is meant to be added to the map list (the one added to the position marker is created automatically in the event listener).
     *
     * @return The santa hat so that it can be appended to the map list.
     */
    #createSantaHat() /*: HTMLElement */ {
        const santaHat = document.createElement("img");
        santaHat.src = staticDomain() + "/images/winter-hat.svg";
        santaHat.alt = QObject.tr("Santa hat");
        santaHat.title = QObject.tr("Merry Christmas!");
        santaHat.width = santaHat.height = 100;
        santaHat.onclick = () => {
            const santaHatOnPosition = document.createElementNS("http://www.w3.org/2000/svg", "image");
            santaHatOnPosition.setAttribute("class", "santaHat");
            santaHatOnPosition.setAttributeNS("http://www.w3.org/1999/xlink", "href", staticDomain() + "/images/winter-hat.svg");
            santaHatOnPosition.setAttribute("width", 44);
            santaHatOnPosition.setAttribute("height", 44);
            santaHatOnPosition.setAttribute("style", "transform:translate(-18px, -42px)");
            this.#positionElement.appendChild(santaHatOnPosition);
            santaHat.parentElement.removeChild(santaHat);
        };
        return santaHat;
    }

    /**
     * Creats an easter egg without appending it to the DOM.
     *
     * @param mapInEasterEgg    The map that should be made available when the player opens the easter egg.
     *
     * @return The easter egg so that it can be appended to the map list.
     */
    #createEasterEgg(mapInEasterEgg /*: LineWithMaps */) /*: HTMLElement */ {
        const egg = Math.ceil(Math.random() * 5);

        const easterEgg = document.createElement("img");
        easterEgg.className = "easterEgg";
        easterEgg.src = staticDomain() + `/images/easter_eggs/${egg}.svg`;
        easterEgg.alt = QObject.tr("Easter egg");
        easterEgg.title = QObject.tr("Happy Easter!");
        easterEgg.width = easterEgg.height = 100;
        easterEgg.onclick = async () => {
            easterEgg.parentElement.removeChild(easterEgg);

            const easterEggDiv = document.createElement("div");
            easterEggDiv.className = "easterEgg";
            easterEggDiv.style.position = "relative";
            for(let part of ["top", "bottom"]){
                const easterEggPart = document.createElement("img");
                easterEggPart.src = staticDomain() + `/images/easter_eggs/${egg}_${part}.svg`;
                easterEggPart.width = easterEggPart.height = 100;
                easterEggPart.style.position = "absolute";
                easterEggPart.style.zIndex = 1;
                easterEggDiv.appendChild(easterEggPart);
            }
            const mapElementContainer = document.createElement("div");    //We need the container because on mobile devices CSS transforms are already applied to mapElement in maps.css and messing with that makes things look very weird.
            mapElementContainer.style.maxWidth = "fit-content";
            const mapElement = createMapElement(mapInEasterEgg);
            this.#mapElements.set(mapInEasterEgg, mapElement);
            mapElementContainer.appendChild(mapElement);
            easterEggDiv.appendChild(mapElementContainer);
            this.#mapList.appendChild(easterEggDiv);

            let clicked = false;
            easterEggDiv.onclick = (event) => {
                this.setMaps([mapInEasterEgg]);    //So that the updateGrayedOut called in onmapclick works as expected
                this.onmapclick?.(mapInEasterEgg, event);
                clicked = true;
            }

            for(let i = 0; i < 100; i++){
                const initialLeft = deviceIsMobile() ? 10 : -6;
                const initialTop = deviceIsMobile() ? -10 : -28;
                const initialScale = deviceIsMobile() ? 60 : 40;
                mapElementContainer.style.transform = "translate(%1px, %2px) scale(%3%)".arg(initialLeft - initialLeft * i / 100, initialTop - initialTop * i / 100, initialScale + (100 - initialScale) * i / 100);
                const top = easterEggDiv.querySelector(":scope > img");
                const bottom = easterEggDiv.querySelector(":scope > img+img");
                top.style.left = bottom.style.left = (i / 10) + "px";
                top.style.top = (-i * 5 / 10) + "px";
                bottom.style.top = (i * 8 / 10) + "px";
                top.style.opacity = bottom.style.opacity = 1 - i / 100;
                top.style.transform = "rotate(%1deg)".arg(i * 45 / 100);
                bottom.style.transform = "rotate(%1deg)".arg(-i * 45 / 100);
                await wait(30);
                if(clicked){
                    return;
                }
            }
            this.setMaps([mapInEasterEgg]);
        };
        return easterEgg;
    }
}
MapListView = typechecked(MapListView);

/**
 * Creates a DOM element representing a map.
 *
 * @param map   The map to create the element for.
 *
 * @return A DOM element representing the give map.
 */
function createMapElement(map /*: LineWithMaps */) /*: HTMLElement */ {
    const result = document.createElement("div");
    result.className = "map";

    if(map instanceof BusLine){
        const typeLabel = document.createElement("div");
        typeLabel.className = "typeLabel";
        typeLabel.style.backgroundColor = map.color;
        typeLabel.style.color = textColorOnBackground(map.color);
        typeLabel.textContent = QObject.tr("Bus");
        result.appendChild(typeLabel);
    }

    const lineLabel = document.createElement("div");
    lineLabel.className = "lineLabel";
    lineLabel.style.backgroundColor = map.color;
    lineLabel.style.color = textColorOnBackground(map.color);
    lineLabel.textContent = map.name;
    result.appendChild(lineLabel);

    const stationsLabel = document.createElement("div");
    stationsLabel.className = "stationsLabel";
    stationsLabel.textContent = map.endStations();
    result.appendChild(stationsLabel);

    return result;
}
createMapElement = typechecked(createMapElement);
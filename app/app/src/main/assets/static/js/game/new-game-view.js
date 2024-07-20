"use strict";

import typechecked from "https://gustavlindberg99.github.io/Typecheck.js/min/typecheck-v1.min.js";
import {QObject} from "https://gustavlindberg99.github.io/QtLinguistWeb/qtranslator-v1.min.js";

import LoadingView from "../utils/loading-view.js";
import {ajaxDomain, sendRequest, staticDomain} from "../utils/ajax-utils.js";
import {refreshUI} from "../utils/async-utils.js";
import {createZoomBox, makeDragScrollable, makeZoomable, resetZoom} from "../utils/scroll.js";
import {initializeSearchForm} from "../contacts/search.js";

import Opponent from "./opponent.js";

export default class NewGameView{
    #dom = document.createElement("div");
    #scrollableDiv = document.createElement("div");
    #placeInformationBox /*: HTMLDivElement */;
    #doneLoading /*: Boolean */ = false;

    static #instance /*: NewGameView | null */ = null;

    /**
     * Constructs a NewGameView object without appending it to the DOM. Only one NewGameView object can exist.
     *
     * @param allPlaces An array containing all places that should be shown on the world map.
     */
    constructor(allPlaces /*: Array<Place> */){
        NewGameView.#instance = this;
        this.#dom.className = "newGameView";

        const placeListParent = document.createElement("div");
        placeListParent.className = "placeListParent";
        placeListParent.appendChild(createLegend());
        placeListParent.appendChild(this.#createPlaceList(allPlaces));
        this.#dom.appendChild(placeListParent);

        const boxHolder = document.createElement("div");
        boxHolder.className = "boxHolder";
        this.#placeInformationBox = createPlaceInformationBox();
        boxHolder.appendChild(this.#placeInformationBox);
        (async () => {
            boxHolder.appendChild(await createGameVariantBox());
            this.#dom.appendChild(boxHolder);
            this.#doneLoading = true;
        })();
    }

    /**
     * Shows this NewGameView.
     */
    async show() /*: void */ {
        while(!this.#doneLoading){
            await refreshUI();
        }
        document.querySelector("section[role=application]").replaceChildren(this.#dom);
        resetZoom(this.#scrollableDiv);    //Otherwise it will put the map in the top left corner for some reason
    }

    /**
     * Shows the NewGameView object (only one NewGameView object can exist).
     */
    static async show() /*: void */ {
        NewGameView.#instance.show();
    }

    /**
     * Displays info about the given place in the right panel.
     *
     * @param place The place to display info about.
     */
    displayPlaceInfo(place /*: Place */) /*: void */ {
        this.#placeInformationBox.querySelector("h3").textContent = place.name;
        const infoCells = this.#placeInformationBox.querySelectorAll("td");
        infoCells[0].textContent = place.level.name();
        infoCells[1].textContent = QObject.tr("%n seconds", null, place.startingTime);
        infoCells[2].textContent = QObject.tr("$%1").arg(place.startingMoney);
        infoCells[3].textContent = place.country;
        const link = document.createElement("a");
        link.href = place.website;
        link.textContent = place.website;
        infoCells[4].replaceChildren(link);
    }

    /**
     * Creates a place marker and a bubble for one place without appending them to the DOM.
     *
     * @param place The place to create a marker and bubble for.
     *
     * @return A div containing the marker and the bubble.
     */
    #createPlaceMarkerWithBubble(place /*: Place */) /*: HTMLElement */ {
        const container = document.createElement("div");
        container.className = "placeMarker";
        container.style.left = (970 + place.longitude * 5.25) + "px";
        container.style.top = (577 - place.latitude * 6.43) + "px";
        container.onmouseover = (event) => {
            if(!container.contains(event.relatedTarget) || event.relatedTarget.onmouseover !== null){
                this.displayPlaceInfo(place);
            }
        };

        container.appendChild(createPlaceMarker(
            place.level.color(),
            place.extras.map(it => it.level.color()).find(it => it !== place.level.color()) ?? null
        ));

        const box = document.createElement("div");

        const title = document.createElement("h3");
        const flag = document.createElement("img");
        flag.className = "inline";
        flag.src = staticDomain() + "/images/countries/" + place.flag;
        flag.alt = place.country;
        title.appendChild(flag);
        title.appendChild(document.createTextNode(" " + place.name));
        box.appendChild(title);

        let currentLevel = place.extras.length === 0 ? place.level : null;
        for(let extra of [place, ...place.extras]){
            if(extra.level !== currentLevel){
                const levelTitle = document.createElement("h5");
                levelTitle.textContent = extra.level;
                box.appendChild(levelTitle);
                currentLevel = extra.level;
            }

            const p = document.createElement("p");
            const playLink = document.createElement("a");
            playLink.role = "button";
            playLink.href = "javascript:void(0)";
            playLink.onmouseover = () => this.displayPlaceInfo(extra);
            const startGame = async (event) => {
                const useMoney = document.getElementsByName("timeOrMoney")[1].checked;
                const multiplayerGame = document.getElementsByName("numberOfPlayers")[1].checked;
                let opponent = null;
                if(multiplayerGame){
                    opponent = await showMultiplayerDialog(extra);
                    if(opponent === null){
                        return;
                    }
                }
                const startGameSucceeded = await extra.startGame(useMoney, opponent, true);
                if(!startGameSucceeded){
                    Toastify({
                        text: QObject.tr("An error occurred when opening %1. Check your internet connection and try again.").arg(extra.name),
                        close: true,
                        style: {
                            background: "red"
                        }
                    }).showToast();
                }
            }
            if(place.extras.length === 0){
                playLink.textContent = QObject.tr("Play");
                container.onclick = startGame;    //container contains playLink, so we shouldn't change playLink.onclick in this case or it will load two games
            }
            else{
                playLink.textContent = extra.name;
                playLink.onclick = startGame;
            }
            p.appendChild(playLink);
            box.appendChild(p);
        }

        container.appendChild(box);

        return container;
    }

    /**
     * Creates a world map with markers for each Map Collector place without appending it to the DOM.
     *
     * @param allPlaces All places to create markers for.
     *
     * @return A div with the world map and the place markers.
     */
    #createPlaceList(allPlaces /*: Array<Place> */) /*: HTMLElement */ {
        const placeListArea = document.createElement("div");
        placeListArea.className = "placeListArea";

        const zoomBox = createZoomBox();
        placeListArea.appendChild(zoomBox);

        const placeList = document.createElement("div");
        placeList.className = "placeList";
        const worldMap = document.createElement("img");
        worldMap.className = "worldMap";
        worldMap.alt = "";
        worldMap.src = staticDomain() + "/images/world.svg";
        this.#scrollableDiv.appendChild(worldMap);
        placeList.appendChild(this.#scrollableDiv);
        placeListArea.appendChild(placeList);

        const xCoords = [];
        const yCoords = [];
        for(let place of allPlaces.toSorted((a, b) => b.latitude - a.latitude)){
            const placeMarker = this.#createPlaceMarkerWithBubble(place);
            xCoords.push(parseFloat(placeMarker.style.left));
            yCoords.push(parseFloat(placeMarker.style.top));
            this.#scrollableDiv.appendChild(placeMarker);
        }
        const xCenter = (Math.max(...xCoords) + Math.min(...xCoords)) / 2 + 80;    //+80 to center it a bit more to the east because the label is to the right of the marker
        const yCenter = (Math.max(...yCoords) + Math.min(...yCoords)) / 2 - 80;    //-80 to center it a bit more to the north because the label is on top of the marker
        const defaultWidth = Math.max(...xCoords) - Math.min(...xCoords) + 200;    //+200 for some margin
        const defaultHeight = Math.max(...yCoords) - Math.min(...yCoords) + 200;

        makeDragScrollable(this.#scrollableDiv);
        makeZoomable(this.#scrollableDiv, zoomBox, null, 5, xCenter, yCenter, defaultWidth, defaultHeight, worldMap);

        return placeListArea;
    }
}
NewGameView = typechecked(NewGameView);

/**
 * Creates a legend with what the colors in the place markers mean.
 *
 * @return A div with the legend so that it can be added to the DOM.
 */
function createLegend() /*: HTMLElement */ {
    const legend = document.createElement("div");
    legend.className = "clickToStartLegend";

    const clickToStart = document.createElement("p");
    clickToStart.textContent = QObject.tr("Click on a place to start a game");
    legend.appendChild(clickToStart);

    const markerLegend = document.createElement("p");
    const levels /*: Map<String, Array<String>> */ = new Map();
    levels.set(QObject.tr("Easy"), ["green"]);
    levels.set(QObject.tr("Medium"), ["yellow"]);
    levels.set(QObject.tr("Difficult"), ["red"]);
    levels.set(QObject.tr("Multiple levels available"), ["green", "yellow"]);
    for(let [level, colors] of levels){
        const levelSpan = document.createElement("span");
        const marker = createPlaceMarker(...colors);
        marker.setAttribute("class", "inline");
        levelSpan.appendChild(marker);
        levelSpan.appendChild(document.createTextNode(level));
        markerLegend.appendChild(levelSpan);
    }
    legend.appendChild(markerLegend);

    return legend;
}
createLegend = typechecked(createLegend);

/**
 * Creates a place marker without the corresponding bubble.
 *
 * @param color1    The color that the top of the bubble should have. Can be any color string supported by CSS.
 * @param color2    The color that the bottom of the bubble should have. Can be any color string supported by CSS. If null, it's the same as color1.
 *
 * @return An <svg> element with the bubble so that it can be added to the DOM.
 */
function createPlaceMarker(color1 /*: String */, color2 /*: String | null */ = null) /*: SVGSVGElement */ {
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    marker.setAttribute("viewBox", "0 0 12 28");

    const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    if(color2 === null){
        path1.setAttribute("d", "M 2,12 6,26 10,12 C 14,-2 -2,-4 2,12 Z");
    }
    else{
        path1.setAttribute("d", "M 2,12 6,26 10,12 C 14,-2 -2,-4 2,12 Z");
    }
    path1.setAttribute("fill", color1);
    path1.setAttribute("stroke", "black");
    marker.appendChild(path1);

    if(color2 !== null){
        const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path2.setAttribute("d", "M 2,12 6,26 10,12");
        path2.setAttribute("fill", color2);
        path2.setAttribute("stroke", "black");
        marker.appendChild(path2);
    }

    return marker;
}
createPlaceMarker = typechecked(createPlaceMarker);

/**
 * Creates an empty place information box without adding it to the DOM.
 *
 * @return The place information box so that it can be added to the DOM.
 */
function createPlaceInformationBox() /*: HTMLElement */ {
    const placeInformationBox = document.createElement("div");
    placeInformationBox.className = "box placeInformationBox";

    const nameInfo = document.createElement("h3");
    nameInfo.textContent = QObject.tr("Select a place");
    placeInformationBox.appendChild(nameInfo);

    const table = document.createElement("table");
    for(let legend of [
        QObject.tr("Level"),
        QObject.tr("Length of a Game"),
        QObject.tr("Money at Start"),
        QObject.tr("Country"),
        QObject.tr("Real Website")
    ]){
        const tr = document.createElement("tr");
        const th = document.createElement("th");
        th.textContent = legend + ":";
        tr.appendChild(th);
        const td = document.createElement("td");
        tr.appendChild(td);
        table.appendChild(tr);
    }
    placeInformationBox.appendChild(table);

    return placeInformationBox;
}
createPlaceInformationBox = typechecked(createPlaceInformationBox);

/**
 * Creates an HTML form allowing the user to select one game variant option (either time/money or number of players, not both).
 *
 * @param name                  A description of the game variant.
 * @param id                    The HTML id that the inputs should have.
 * @param options               An array with the options that this game variant can take.
 * @param defaultOption         The index of the option that should be selected by default.
 * @param disableIfNotLoggedIn  If true, only the first option is available to users that aren't logged in. If false, all options are available to all users.
 *
 * @return An HTML element containing the form.
 */
function createGameVariantForm(name /*: String */, id /*: String */, options /*: Array<String> */, defaultOption /*: Number */ = 0, disableIfNotLoggedIn /*: Boolean */ = false) /*: HTMLElement */ {
    const disable = disableIfNotLoggedIn && document.querySelector("meta[name=user-id]") === null;
    const container = document.createElement("div");

    const title = document.createElement("h4");
    title.textContent = name;
    container.appendChild(title);

    const form = document.createElement("form");
    for(let option of options){
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = id;
        input.disabled = disable;
        label.appendChild(input);
        const legend = document.createElement("span");
        legend.textContent = option;
        label.appendChild(legend);
        form.appendChild(label);
    }
    form.querySelectorAll("input")[disable ? 0 : defaultOption].checked = true;

    if(disable){
        const createAccountForMultiplayer = document.createElement("p");
        createAccountForMultiplayer.style.margin = "0px";
        createAccountForMultiplayer.innerHTML = QObject.tr("<a href=\"%1\">Create a free account</a> to play a two-player game.").arg(ajaxDomain() + "/users/signup.php");
        form.appendChild(createAccountForMultiplayer);
    }

    container.appendChild(form);

    return container;
}
createGameVariantForm = typechecked(createGameVariantForm);

/**
 * Creates a box with all the different game variants (both time/money and number of players).
 *
 * @return An HTML element with the game variant box so that it can be added to the DOM.
 */
async function createGameVariantBox() /*: HTMLElement */ {
    const gameVariantBox = document.createElement("div");
    gameVariantBox.className = "box gameVariantBox";

    const title = document.createElement("h3");
    title.textContent = QObject.tr("Game Variant");
    gameVariantBox.appendChild(title);

    const getParameters = new URLSearchParams(location.search);
    const defaultNumberOfPlayers = getParameters.get("numberOfPlayers") ?? 1;
    let defaultVariant = 0;
    switch(getParameters.get("variant")){
    case "time":
        defaultVariant = 0;
        break;
    case "money":
        defaultVariant = 1;
        break;
    default:
        const variantResponse = await sendRequest(ajaxDomain() + "/ajax/variant.php");
        defaultVariant = await variantResponse?.json() ?? 0;
        break;
    }

    const container = document.createElement("div");
    container.appendChild(createGameVariantForm(QObject.tr("Time or money"), "timeOrMoney", [QObject.tr("Time"), QObject.tr("Money")], defaultVariant));
    container.appendChild(createGameVariantForm(QObject.tr("Number of players"), "numberOfPlayers", [QObject.tr("One player"), QObject.tr("Two players")], defaultNumberOfPlayers - 1, true));
    gameVariantBox.appendChild(container);

    return gameVariantBox;
}
createGameVariantBox = typechecked(createGameVariantBox);

/**
 * Shows a dialog allowing to choose a user to play a multiplayer game with.
 *
 * @param place The place to play a multiplayer game in.
 *
 * @return The opponent to play a multiplayer game with, or null if it was closed without selecting a user.
 */
async function showMultiplayerDialog(place /*: Place */) /*: Opponent | null */ {
    const opponentFromGetParams = new URLSearchParams(location.search).get("opponent");
    return await new Promise(async (resolvePromise) => {
        const enableSearchForm = async () => {
            //Use a click event here instead of a submit event so that if the form is empty, we can prevent the submit event to avoid wasting bandwidth fetching a list of users that won't be displayed anyway
            document.querySelector("#searchUserForm").addEventListener("click", (event) => {
                const contactList = document.getElementById("contactList");
                const searchResults = document.getElementById("searchResults");
                if(document.querySelector("#searchUserForm input[type=search]").value.trim() === ""){
                    contactList.style.display = "";
                    searchResults.style.display = "none";
                    event.preventDefault();
                }
                else{
                    contactList.style.display = "none";
                    searchResults.style.display = "";
                }
            });

            const loadingView = new LoadingView(document.getElementById("contactList"), false);
            await initializeSearchForm((userId /*: Number */, userName /*: String */) => {
                if(window.Android){
                    Android.close(JSON.stringify({userId: userId, userName: userName}));
                }
                else{
                    resolvePromise(new Opponent(place, userId, userName));
                    dialog.close();
                }
            }, opponentFromGetParams === null ? null : "id:" + opponentFromGetParams);
            loadingView.close();
        };

        const dialog = xdialog.open({
            title: QObject.tr("Two-player game in %1").arg(place.name),
            body: `
                <form id="searchUserForm">
                    <input type="search" placeholder="${QObject.tr("Search for an opponent...")}"/>
                    <input type="submit" value="${QObject.tr("Search")}"/>
                </form>
                <div id="contactList" ${opponentFromGetParams === null ? "" : "style=\"display:none\""}></div>
                <div id="searchResults" ${opponentFromGetParams === null ? "style=\"display:none\"" : ""}></div>
            `,
            android_dependencies: `
                <link rel="stylesheet" type="text/css" href="static/css/loading-view.css"/>
                <link rel="stylesheet" type="text/css" href="static/css/usercard.css"/>
                <link rel="stylesheet" type="text/css" href="static/css/general/main.css"/>
                <script type="module">
                    import LoadingView from "./static/js/utils/loading-view.js";
                    import {initializeSearchForm} from "./static/js/contacts/search.js";
                    const opponentFromGetParams = ${JSON.stringify(opponentFromGetParams)};
                    window.addEventListener("load", ${enableSearchForm});
                </script>
            `,
            buttons: null,
            onok: () => false,    //The Enter key triggers onok, so disable onok so that the Enter key can be used to submit the search form instead
            oncancel: () => resolvePromise(null),
            android_onactivityresult: (data) => resolvePromise(new Opponent(place, JSON.parse(data).userId, JSON.parse(data).userName))
        });

        if(!window.Android){
            enableSearchForm();
        }
    });
}
showMultiplayerDialog = typechecked(showMultiplayerDialog);
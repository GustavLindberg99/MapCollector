import i18next from "https://unpkg.com/i18next@25.6.0/dist/esm/i18next.js";

import {ajaxDomain, makeSvgPanZoomMobileFriendly, refreshUI, sendRequest, staticDomain} from "../utils.js";
import {initializeSearchForm} from "../contacts/search.js";

import LoadingView from "../loading-view.js";
import Opponent from "./opponent.js";
import Place from "./place.js";

export default class NewGameView{
    readonly #dom = document.createElement("div");
    readonly #placeInformationBox: HTMLDivElement;
    readonly #placeList: SVGSVGElement;
    readonly #viewBoxWidth: number;
    readonly #viewBoxHeight: number;

    #placeMarkers = new Set<SVGElement>();
    #placeBubble: HTMLElement | null = null;
    #doneLoading: boolean = false;

    static #instance: NewGameView | null = null;

    /**
     * Constructs a NewGameView object without appending it to the DOM. Only one NewGameView object can exist.
     *
     * @param allPlaces An array containing all places that should be shown on the world map.
     */
    constructor(allPlaces: ReadonlyArray<Place>){
        NewGameView.#instance = this;
        this.#dom.className = "newGameView";

        this.#placeList = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.#placeList.setAttribute("viewBox", "0 0 1000 500");
        this.#placeList.setAttribute("class", "placeListArea");

        const worldMap = document.createElementNS("http://www.w3.org/2000/svg", "image");
        worldMap.setAttribute("class", "worldMap");
        worldMap.setAttribute("href", staticDomain() + "/images/world.svg");
        this.#placeList.appendChild(worldMap);

        let xCoords: Array<number> = [];
        let yCoords: Array<number> = [];
        for(let place of allPlaces.toSorted((a, b) => b.latitude - a.latitude)){
            const [placeMarker, x, y] = this.#createPlaceMarkerWithBubble(place);
            this.#placeMarkers.add(placeMarker);
            this.#placeList.appendChild(placeMarker);
            xCoords.push(x);
            yCoords.push(y);
        }

        const minX = Math.min(...xCoords);
        const maxX = Math.max(...xCoords);
        const minY = Math.min(...yCoords);
        const maxY = Math.max(...yCoords);
        this.#viewBoxWidth = maxX - minX + 40;
        this.#viewBoxHeight = maxY - minY + 40;
        this.#placeList.setAttribute("viewBox", `${minX - 20} ${minY - 30} ${this.#viewBoxWidth} ${this.#viewBoxHeight}`);

        const placeListParent = document.createElement("div");
        placeListParent.className = "placeListParent";
        placeListParent.appendChild(createLegend());
        placeListParent.appendChild(this.#placeList);
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
    async show(): Promise<void> {
        while(!this.#doneLoading){
            await refreshUI();
        }
        document.querySelector("section[role=application]")!!.replaceChildren(this.#dom);

        //This needs to go after the new game area is shown, otherwise the svgPanZoom library won't work
        this.#initPanZoom();
    }

    /**
     * Initializes the pan zoom for the new game view.
     */
    #initPanZoom(): void {
        const worldMapStyle = getComputedStyle(this.#placeList.querySelector("image")!!);

        const panZoom = svgPanZoom(this.#placeList, {
            controlIconsEnabled: true,
            minZoom: Math.min(this.#viewBoxWidth / parseFloat(worldMapStyle.width), this.#viewBoxHeight / parseFloat(worldMapStyle.height)),
            maxZoom: 150,
            onPan: () => {
                this.#placeBubble?.remove();
                this.#placeBubble = null;
            },
            onZoom: newScale => this.#onZoom(newScale)
        });
        makeSvgPanZoomMobileFriendly(panZoom, this.#placeList);
        panZoom.zoom(1);
        this.#onZoom(1);
    }

    /**
     * Function to be called when the world map is zoomed in on or initialized.
     *
     * @param newScale  The new zoom scale.
     */
    #onZoom(newScale: number): void {
        const zoomFactor = Math.max(
            this.#viewBoxWidth / this.#placeList.clientWidth,
            this.#viewBoxHeight / this.#placeList.clientHeight
        );
        for(let placeMarker of this.#placeMarkers){
            placeMarker.style.transform = placeMarker.style.transform.replace(/ scale\([0-9\.]+\)|$/, `scale(${zoomFactor / newScale})`);
        }
    }

    /**
     * Shows the NewGameView object (only one NewGameView object can exist).
     */
    static async show(): Promise<void> {
        NewGameView.#instance!!.show();
    }

    /**
     * Displays info about the given place in the right panel.
     *
     * @param place The place to display info about.
     */
    displayPlaceInfo(place: Place): void {
        this.#placeInformationBox.querySelector("h3")!!.textContent = place.name;
        const infoCells = this.#placeInformationBox.querySelectorAll("td");
        infoCells[0].textContent = place.level.name();
        infoCells[1].textContent = i18next.t("{{count}} seconds", {count: place.startingTime});
        infoCells[2].textContent = i18next.t("${{arg}}", {arg: place.startingMoney});
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
     * @return An SVG element that when hovered shows the bubble, as well as its x and y coordinates.
     */
    #createPlaceMarkerWithBubble(place: Place): [SVGElement, number, number] {
        const placeMarker = createPlaceMarker(
            "g",
            place.level.color,
            place.extras.map(it => it.level.color).find(it => it !== place.level.color) ?? null
        );
        const x = 970 + place.longitude * 5.25;
        const y = 577 - place.latitude * 6.43;
        placeMarker.style.transform = `translate(${x}px, ${y}px)`;

        placeMarker.onmouseover = placeMarker.ontouchend = (event: Event) => {
            if(event instanceof MouseEvent){
                const target = event.relatedTarget as HTMLElement | SVGElement;
                if(!placeMarker.contains(target) || target.onmouseover !== null){
                    this.displayPlaceInfo(place);
                }
            }

            if(this.#placeBubble === null){
                this.#placeBubble = this.#createPlaceMarkerBubble(place, placeMarker);
                this.#placeBubble.onmouseout = placeMarker.onmouseout;
                document.body.appendChild(this.#placeBubble);
            }
        };
        placeMarker.onmouseout = (event: MouseEvent) => {
            if(!placeMarker.contains(event.relatedTarget as Node) && !this.#placeBubble?.contains(event.relatedTarget as Node)){
                this.#placeBubble?.remove();
                this.#placeBubble = null;
            }
        };

        return [placeMarker, x, y];
    }

    /**
     * Creates a bubble when hovering over a place marker with links to start the game.
     *
     * @param place         The place to create the bubble for.
     * @param placeMarker   The marker to show the bubble above.
     *
     * @returns The bubble.
     */
    #createPlaceMarkerBubble(place: Place, placeMarker: SVGElement): HTMLElement {
        const box = document.createElement("div");
        box.className = "placeMarkerBubble";
        box.style.left = `${placeMarker.getBoundingClientRect().x + window.scrollX - 10}px`;
        box.style.bottom = `${document.documentElement.clientHeight - (placeMarker.getBoundingClientRect().y + window.scrollY + 10)}px`;

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
                levelTitle.textContent = extra.level.name();
                box.appendChild(levelTitle);
                currentLevel = extra.level;
            }

            const p = document.createElement("p");
            const playLink = document.createElement("a");
            playLink.role = "button";
            playLink.href = "javascript:void(0)";
            playLink.onmouseover = () => this.displayPlaceInfo(extra);

            if(place.extras.length === 0){
                playLink.textContent = i18next.t("Play");
                placeMarker.onclick = box.onclick = () => this.#startGame(extra);
            }
            else{
                playLink.textContent = extra.name;
                playLink.onclick = () => this.#startGame(extra);
            }
            p.appendChild(playLink);
            box.appendChild(p);
        }

        return box;
    }

    /**
     * Starts a new game in the given place.
     *
     * @param extra The place or extra to start the game in.
     */
    async #startGame(extra: Place): Promise<void> {
        this.#placeBubble?.remove();
        this.#placeBubble = null;

        const useMoney = (document.getElementsByName("timeOrMoney")[1] as HTMLInputElement).checked;
        const multiplayerGame = (document.getElementsByName("numberOfPlayers")[1] as HTMLInputElement).checked;
        let opponent: Opponent | null = null;

        if(multiplayerGame){
            opponent = await showMultiplayerDialog(extra);
            if(opponent === null){
                return;
            }
        }

        const startGameSucceeded = await extra.startGame(useMoney, opponent, true);
        if(!startGameSucceeded){
            Toastify({
                text: i18next.t("An error occurred when opening {{arg}}. Check your internet connection and try again.", {arg: extra.name}),
                close: true,
                style: {
                    background: "red"
                }
            }).showToast();
        }
    }

}

/**
 * Creates a legend with what the colors in the place markers mean.
 *
 * @return A div with the legend so that it can be added to the DOM.
 */
function createLegend(): HTMLElement {
    const legend = document.createElement("div");
    legend.className = "clickToStartLegend";

    const clickToStart = document.createElement("p");
    clickToStart.textContent = i18next.t("Click on a place to start a game");
    legend.appendChild(clickToStart);

    const markerLegend = document.createElement("p");
    const levels = new Map<string, [string, string | undefined]>();
    levels.set(i18next.t("Easy"), ["green", undefined]);
    levels.set(i18next.t("Medium"), ["yellow", undefined]);
    levels.set(i18next.t("Difficult"), ["red", undefined]);
    levels.set(i18next.t("Multiple levels available"), ["green", "yellow"]);
    for(let [level, colors] of levels){
        const levelSpan = document.createElement("span");
        const marker = createPlaceMarker("svg", ...colors);
        marker.setAttribute("class", "inline");
        levelSpan.appendChild(marker);
        levelSpan.appendChild(document.createTextNode(level));
        markerLegend.appendChild(levelSpan);
    }
    legend.appendChild(markerLegend);

    return legend;
}

/**
 * Creates a place marker without the corresponding bubble.
 *
 * @param tagName   The tag name that the place marker should have (either "g" or "svg").
 * @param color1    The color that the top of the bubble should have. Can be any color string supported by CSS.
 * @param color2    The color that the bottom of the bubble should have. Can be any color string supported by CSS. If null, it's the same as color1.
 *
 * @return An <svg> element with the bubble so that it can be added to the DOM.
 */
function createPlaceMarker(tagName: "g" | "svg", color1: string, color2: string | null = null): SVGElement {
    const marker = document.createElementNS("http://www.w3.org/2000/svg", tagName);
    if(tagName === "svg"){
        marker.setAttribute("viewBox", "-6 -28 12 28");
    }

    const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    if(color2 === null){
        path1.setAttribute("d", "M -4,-16 0,-2 4,-16 C 8,-30 -8,-32 -4,-16 Z");
    }
    else{
        path1.setAttribute("d", "M -4,-16 0,-2 4,-16 C 8,-30 -8,-32 -4,-16 Z");
    }
    path1.setAttribute("fill", color1);
    path1.setAttribute("stroke", "black");
    marker.appendChild(path1);

    if(color2 !== null){
        const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path2.setAttribute("d", "M -4,-16 0,-2 4,-16");
        path2.setAttribute("fill", color2);
        path2.setAttribute("stroke", "black");
        marker.appendChild(path2);
    }

    return marker;
}

/**
 * Creates an empty place information box without adding it to the DOM.
 *
 * @return The place information box so that it can be added to the DOM.
 */
function createPlaceInformationBox(): HTMLDivElement {
    const placeInformationBox = document.createElement("div");
    placeInformationBox.className = "box placeInformationBox";

    const nameInfo = document.createElement("h3");
    nameInfo.textContent = i18next.t("Select a place");
    placeInformationBox.appendChild(nameInfo);

    const table = document.createElement("table");
    for(let legend of [
        i18next.t("Level"),
        i18next.t("Length of a Game"),
        i18next.t("Money at Start"),
        i18next.t("Country"),
        i18next.t("Real Website")
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
function createGameVariantForm(name: string, id: string, options: Array<string>, defaultOption: number = 0, disableIfNotLoggedIn: boolean = false): HTMLElement {
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
        createAccountForMultiplayer.innerHTML = i18next.t("<a href=\"{{arg}}\">Create a free account</a> to play a two-player game.", {arg: ajaxDomain() + "/users/signup.php"});
        form.appendChild(createAccountForMultiplayer);
    }

    container.appendChild(form);

    return container;
}

/**
 * Creates a box with all the different game variants (both time/money and number of players).
 *
 * @return An HTML element with the game variant box so that it can be added to the DOM.
 */
async function createGameVariantBox(): Promise<HTMLElement> {
    const gameVariantBox = document.createElement("div");
    gameVariantBox.className = "box gameVariantBox";

    const title = document.createElement("h3");
    title.textContent = i18next.t("Game Variant");
    gameVariantBox.appendChild(title);

    const getParameters = new URLSearchParams(location.search);
    const defaultNumberOfPlayers = parseInt(getParameters.get("numberOfPlayers") ?? "1");
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
    container.appendChild(createGameVariantForm(i18next.t("Time or money"), "timeOrMoney", [i18next.t("Time"), i18next.t("Money")], defaultVariant));
    container.appendChild(createGameVariantForm(i18next.t("Number of players"), "numberOfPlayers", [i18next.t("One player"), i18next.t("Two players")], defaultNumberOfPlayers - 1, true));
    gameVariantBox.appendChild(container);

    return gameVariantBox;
}

/**
 * Shows a dialog allowing to choose a user to play a multiplayer game with.
 *
 * @param place The place to play a multiplayer game in.
 *
 * @return The opponent to play a multiplayer game with, or null if it was closed without selecting a user.
 */
async function showMultiplayerDialog(place: Place): Promise<Opponent | null> {
    const opponentFromGetParams = new URLSearchParams(location.search).get("opponent");
    return await new Promise<Opponent | null>(async (resolvePromise) => {
        const enableSearchForm = async () => {
            //Use a click event here instead of a submit event so that if the form is empty, we can prevent the submit event to avoid wasting bandwidth fetching a list of users that won't be displayed anyway
            document.querySelector("#searchUserForm")!!.addEventListener("click", (event) => {
                const contactList = document.getElementById("contactList")!!;
                const searchResults = document.getElementById("searchResults")!!;
                if(document.querySelector<HTMLInputElement>("#searchUserForm input[type=search]")!!.value.trim() === ""){
                    contactList.style.display = "";
                    searchResults.style.display = "none";
                    event.preventDefault();
                }
                else{
                    contactList.style.display = "none";
                    searchResults.style.display = "";
                }
            });

            const loadingView = new LoadingView(document.getElementById("contactList")!!, false);
            await initializeSearchForm((userId: number, userName: string) => {
                if(window.Android){
                    window.Android.close(JSON.stringify({userId: userId, userName: userName}));
                }
                else{
                    resolvePromise(new Opponent(place, userId.toString(), userName));
                    dialog.close();
                }
            }, opponentFromGetParams === null ? null : "id:" + opponentFromGetParams);
            loadingView.close();
        };

        const dialog = xdialog.open({
            title: i18next.t("Two-player game in {{arg}}", {arg: place.name}),
            body: `
                <form id="searchUserForm">
                    <input type="search" placeholder="${i18next.t("Search for an opponent...")}"/>
                    <input type="submit" value="${i18next.t("Search")}"/>
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
            android_onactivityresult: (data: string) => resolvePromise(new Opponent(place, JSON.parse(data).userId, JSON.parse(data).userName))
        } as XDialog.Options);

        if(!window.Android){
            enableSearchForm();
        }
    });
}

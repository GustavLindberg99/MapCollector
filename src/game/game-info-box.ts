import i18next from "https://unpkg.com/i18next@25.6.0/dist/esm/i18next.js";
import Color from "https://colorjs.io/dist/color.min.js";

import {staticDomain} from "../utils.js";

import Line from "./line.js";
import Opponent from "./opponent.js";
import Station from "./station.js";
import WalkingLine from "./walking-line.js";

export default class GameInfoBox{
    #gameInfoBox = document.createElement("div");

    #numberOfMapsLabel = document.createElement("span");
    #numberOfMapsProgressBar = document.createElement("span");

    #opponentNumberOfMapsLabel = document.createElement("span");
    #opponentNumberOfMapsProgressBar = document.createElement("span");

    #positionLabel = document.createElement("span");
    #opponentPositionLabel = document.createElement("span");

    #remainingTimeLabel = document.createElement("span");
    #remainingTimeProgressBar = document.createElement("span");

    #remainingMoneyLabel = document.createElement("span");
    #remainingMoneyProgressBar = document.createElement("span");

    #opponentRemainingMoneyLabel = document.createElement("span");
    #opponentRemainingMoneyProgressBar = document.createElement("span");

    /**
     * Constructs a game info box and appends it to parent.
     *
     * @param parent            The DOM element to append the game info box to.
     * @param playingWithMoney  True if playing with money, false if playing with time. Used to determine whether to create a time progress bar or a money progress bar.
     * @param opponent          The opponent if it's a multiplayer game, null if it's a single-player game.
     */
    constructor(parent: HTMLElement, playingWithMoney: boolean, opponent: Opponent | null){
        this.#gameInfoBox.className = "gameInfoBox";
        this.#gameInfoBox.appendChild(this.#createCollapseExpandButton());

        this.#gameInfoBox.appendChild(createInfoRow(i18next.t("Your maps"), "logo.svg", this.#numberOfMapsLabel, this.#numberOfMapsProgressBar));
        this.#gameInfoBox.appendChild(createInfoRow(i18next.t("Your current position"), "myposition.svg", this.#positionLabel, null));
        if(playingWithMoney){
            this.#gameInfoBox.appendChild(createInfoRow(opponent === null ? i18next.t("Remaining money") : i18next.t("Money that you have spent"), "money.svg", this.#remainingMoneyLabel, this.#remainingMoneyProgressBar));
        }
        else if(opponent === null){
            this.#gameInfoBox.appendChild(createInfoRow(i18next.t("Remaining time"), "time.svg", this.#remainingTimeLabel, this.#remainingTimeProgressBar));
        }

        if(opponent !== null){
            this.#gameInfoBox.appendChild(createInfoRow(i18next.t("{{arg}}'s maps", {arg: opponent.userName}), "opponentmaps.svg", this.#opponentNumberOfMapsLabel, this.#opponentNumberOfMapsProgressBar));
            this.#gameInfoBox.appendChild(createInfoRow(i18next.t("{{arg}}'s current position", {arg: opponent.userName}), "opponentposition.svg", this.#opponentPositionLabel, null));
            if(playingWithMoney){
                this.#gameInfoBox.appendChild(createInfoRow(i18next.t("Money that {{arg}} has spent", {arg: opponent.userName}), "opponentmoney.svg", this.#opponentRemainingMoneyLabel, this.#opponentRemainingMoneyProgressBar));
            }
        }

        parent.appendChild(this.#gameInfoBox);
    }

    /**
     * Sets the number of maps in the maps progress bar.
     *
     * @param collected The number of collected maps.
     * @param total     The total number of maps that exist in this place.
     * @param opponent  The opponent to set the current station for, or null if setting it for the player themselves.
     */
    setNumberOfMaps(collected: number, total: number, opponent: Opponent | null = null): void {
        const numberOfMapsLabel = opponent === null ? this.#numberOfMapsLabel : this.#opponentNumberOfMapsLabel;
        const numberOfMapsProgressBar = opponent === null ? this.#numberOfMapsProgressBar : this.#opponentNumberOfMapsProgressBar;

        numberOfMapsLabel.textContent = opponent === null ? i18next.t("You have {{count}} maps out of {{total}}.", {total: total, count: collected}) : i18next.t("{{arg}} has {{count}} maps out of {{total}}.", {arg: opponent.userName, total: total, count: collected});
        numberOfMapsProgressBar.style.width = (100 * collected / total) + "%";
        numberOfMapsProgressBar.style.backgroundColor = progressBarColor(collected / total, opponent === null);
    }

    /**
     * Sets the current position in the current position label to a station.
     *
     * @param station   The station the player is at.
     * @param opponent  The opponent to set the current station for, or null if setting it for the player themselves.
     */
    setCurrentStation(station: Station, opponent: Opponent | null = null): void {
        const stationLabel = document.createElement("b");
        stationLabel.textContent = station.name;

        const positionLabel = opponent === null ? this.#positionLabel : this.#opponentPositionLabel;
        positionLabel.replaceChildren(
            document.createTextNode(opponent === null ? i18next.t("Your current position: At ") : i18next.t("{{arg}}'s current position: At ", {arg: opponent.userName})),
            stationLabel
        );
    }

    /**
     * Sets the current position in the current position label to riding a line to a station.
     *
     * @param line          The line the player is riding.
     * @param destination   The station the player is going to.
     * @param opponent      The opponent to set the current station for, or null if setting it for the player themselves.
     */
    setCurrentLine(line: Line, destination: Station, opponent: Opponent | null = null): void {
        const stationLabel = document.createElement("b");
        stationLabel.textContent = destination.name;

        const positionLabel = opponent === null ? this.#positionLabel : this.#opponentPositionLabel;
        if(line instanceof WalkingLine){
            positionLabel.replaceChildren(
                document.createTextNode(opponent === null ? i18next.t("Your current position: Walking to ") : i18next.t("{{arg}}'s current position: Walking to ", {arg: opponent.userName})),
                stationLabel
            );
        }
        else{
            const lineLabel = document.createElement("b");
            lineLabel.textContent = line.name;

            positionLabel.replaceChildren(
                document.createTextNode(opponent === null ? i18next.t("Your current position: Riding line ") : i18next.t("{{arg}}'s current position: Riding line ", {arg: opponent.userName})),
                lineLabel,
                document.createTextNode(i18next.t(" to ")),
                stationLabel
            );
        }
    }

    /**
     * Sets the remaining time in the time progress bar.
     *
     * @param remainingTime The remaining time in seconds.
     * @param startingTime  The number of time the player had at the start in seconds.
     */
    setTime(remainingTime: number, startingTime: number): void {
        this.#remainingTimeLabel.textContent = i18next.t("Remaining time: {{count}} seconds", {count: Math.round(remainingTime)});
        this.#remainingTimeProgressBar.style.width = (100 * remainingTime / startingTime) + "%";
        this.#remainingTimeProgressBar.style.backgroundColor = progressBarColor(remainingTime / startingTime, true);
    }

    /**
     * Sets the remaining money in the money progress bar.
     *
     * @param remainingMoney    The remaining money in seconds.
     * @param startingMoney     The number of money the player had at the start in seconds.
     * @param isMultiplayerGame True if it's a multiplayer game, false if it's a single-player game.
     * @param opponent          The opponent to set the current money for, or null if setting it for the player themselves.
     */
    setMoney(remainingMoney: number, startingMoney: number, isMultiplayerGame: boolean, opponent: Opponent | null): void {
        const remainingMoneyLabel = opponent === null ? this.#remainingMoneyLabel : this.#opponentRemainingMoneyLabel;
        const remainingMoneyProgressBar = opponent === null ? this.#remainingMoneyProgressBar : this.#opponentRemainingMoneyProgressBar;

        if(opponent !== null){
            remainingMoneyLabel.textContent = i18next.t("Money that {{user}} has spent: ${{money}}", {user: opponent.userName, money: remainingMoney});
        }
        else if(isMultiplayerGame){
            remainingMoneyLabel.textContent = i18next.t("Money that you have spent: ${{arg}}", {arg: remainingMoney});
        }
        else{
            remainingMoneyLabel.textContent = i18next.t("Remaining money: ${{arg}}", {arg: remainingMoney});
        }
        remainingMoneyProgressBar.style.width = (100 * remainingMoney / startingMoney) + "%";
        remainingMoneyProgressBar.style.backgroundColor = progressBarColor(remainingMoney / startingMoney, !isMultiplayerGame || opponent !== null);
    }

    /**
     * Creates a button to collapse/expand the game info box without appending it to the DOM, and collapses the game info box.
     *
     * @return The button so that it can be added to the DOM.
     */
    #createCollapseExpandButton(): HTMLElement {
        const button = document.createElement("button");

        const onclick = () => {
            this.#gameInfoBox.classList.toggle("collapsed");
            if(this.#gameInfoBox.classList.contains("collapsed")){
                button.textContent = "+";
                button.title = i18next.t("Show game information");
            }
            else{
                button.textContent = "-";
                button.title = i18next.t("Hide game information");
            }
        };
        onclick();
        button.onclick = onclick;

        return button;
    }
}

/**
 * Creates a container with a progress bar and the corresponding image, and appends label and progressBar to it. Does not append it to the DOM.
 *
 * @param title         The title of the row. Shown as the alt text for the image.
 * @param image         The file name of the image (without the path).
 * @param label         The HTML element to use as a label. Initializes the class name of this element and appends it to the info row container.
 * @param progressBar   The HTML element that goes inside the progress bar (the width of this can be set in CSS from 0% to 100% to indicate progress). Initializes the class name of this element and appends it to the info row container. Can be null if the row shouldn't have a progress bar.
 *
 * @return The info row container so that it can be added to the DOM.
 */
function createInfoRow(title: string, image: string, label: HTMLElement, progressBar: HTMLElement | null): HTMLElement {
    const container = document.createElement("div");
    if(progressBar === null){
        container.className = "noProgressBar";
    }

    const img = document.createElement("img");
    img.className = "inline";
    img.src = staticDomain() + "/images/" + image;
    img.alt = title;
    container.appendChild(img);

    label.className = "gameInfoLabel";
    container.appendChild(label);

    if(progressBar !== null){
        const progressBarContainer = document.createElement("span");
        progressBarContainer.className = "progressBar";
        progressBarContainer.appendChild(progressBar);
        container.appendChild(progressBarContainer);
    }

    return container;
}

/**
 * Returns the color that a progress bar should have.
 *
 * @param ratio             The ratio that the progress bar will be set to, where 0 is the minimum and 1 is the maximum.
 * @param goodToHaveMuch    True if the progress bar should be green if ratio is large and red if it's small, false if it should be the other way around.
 *
 * @return The color as a string compatible with CSS.
 */
function progressBarColor(ratio: number, goodToHaveMuch: boolean): string {
    const littleColor = 510 * Math.min(1 - ratio, 0.5);
    const muchColor = 510 * Math.min(ratio, 0.5);
    if(goodToHaveMuch){
        return `rgb(${littleColor}, ${muchColor}, 0)`;
    }
    else{
        return `rgb(${muchColor}, ${littleColor}, 0)`;
    }
}

"use strict";

import typechecked from "https://gustavlindberg99.github.io/Typecheck.js/min/typecheck-v1.min.js";
import {QObject} from "https://gustavlindberg99.github.io/QtLinguistWeb/qtranslator-v1.min.js";

import {staticDomain} from "../utils/ajax-utils.js";

export default class LoadingView{
    #dom /*: HTMLDivElement */ = document.createElement("div");
    #cancelButton /*: HTMLButtonElement */ = document.createElement("button");

    static #loadingImage /*: HTMLImageElement */ = document.createElement("img");

    /**
     * Static constructor so that the loading image isn't downloaded each time a loading window is created.
     */
    static {
        LoadingView.#loadingImage.src = staticDomain() + "/images/loading.svg";
        LoadingView.#loadingImage.alt = QObject.tr("Loading...");
    }

    /**
     * Constructs a loading window and appends it to the DOM.
     *
     * @param parent            The element that the loading window should cover.
     * @param showCancelButton  True if a cancel button should be shown in the loading view, false if it shouldn't.
     */
    constructor(parent /*: HTMLElement */, showCancelButton /*: Boolean */){
        Object.seal(this);

        if(getComputedStyle(parent).position !== "relative"){
            console.warn("Loading view has a parent with non-relative position, this may lead to incorrect layout");
        }

        this.#dom.className = "loadingView";
        this.#dom.appendChild(LoadingView.#loadingImage);

        const loadingText = document.createElement("p");
        loadingText.textContent = QObject.tr("Loading...");
        this.#dom.appendChild(loadingText);

        this.#cancelButton.textContent = QObject.tr("Cancel");
        if(showCancelButton){
            this.#dom.appendChild(this.#cancelButton);
        }
        parent.appendChild(this.#dom);
    }

    /**
     * Async function that returns when the cancel button is pressed. If the cancel button is never pressed, this method never returns, so it should only be used in combination with other promises.
     */
    async waitForCancelButtonPressed() /*: void */ {
        let eventListener;
        await new Promise((resolvePromise) => {
            eventListener = () => {
                this.close();
                resolvePromise()
            };
            this.#cancelButton.addEventListener("click", eventListener);
        });
        this.#cancelButton.removeEventListener("click", eventListener);
    }

    /**
     * Closes the loading view by removing it from the DOM.
     */
    close() /*: void */ {
        this.#dom.remove();
    }
}
LoadingView = typechecked(LoadingView);
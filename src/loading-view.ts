import i18next from "https://unpkg.com/i18next@25.6.0/dist/esm/i18next.js";

import {staticDomain} from "./utils.js";

export default class LoadingView {
    readonly #dom: HTMLDivElement = document.createElement("div");
    readonly #cancelButton: HTMLButtonElement = document.createElement("button");

    static readonly #loadingImage: HTMLImageElement = document.createElement("img");

    /**
     * Static constructor so that the loading image isn't downloaded each time a loading window is created.
     */
    static {
        LoadingView.#loadingImage.src = staticDomain() + "/images/loading.svg";
        LoadingView.#loadingImage.alt = i18next.t("Loading...");
    }

    /**
     * Constructs a loading window and appends it to the DOM.
     *
     * @param parent            The element that the loading window should cover.
     * @param showCancelButton  True if a cancel button should be shown in the loading view, false if it shouldn't.
     */
    constructor(parent: HTMLElement, showCancelButton: boolean){
        if(getComputedStyle(parent).position !== "relative"){
            console.warn("Loading view has a parent with non-relative position, this may lead to incorrect layout");
        }

        this.#dom.className = "loadingView";
        this.#dom.appendChild(LoadingView.#loadingImage);

        const loadingText = document.createElement("p");
        loadingText.textContent = i18next.t("Loading...");
        this.#dom.appendChild(loadingText);

        this.#cancelButton.textContent = i18next.t("Cancel");
        if(showCancelButton){
            this.#dom.appendChild(this.#cancelButton);
        }
        parent.appendChild(this.#dom);
    }

    /**
     * Async function that returns when the cancel button is pressed. If the cancel button is never pressed, this method never returns, so it should only be used in combination with other promises.
     */
    async waitForCancelButtonPressed(): Promise<void> {
        await new Promise<void>((resolvePromise) => {
            const eventListener = () => {
                this.close();
                resolvePromise();
                this.#cancelButton.removeEventListener("click", eventListener);
            };
            this.#cancelButton.addEventListener("click", eventListener);
        });
    }

    /**
     * Closes the loading view by removing it from the DOM.
     */
    close(): void {
        this.#dom.remove();
    }
}

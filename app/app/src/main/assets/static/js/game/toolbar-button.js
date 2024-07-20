"use strict";

import typechecked from "https://gustavlindberg99.github.io/Typecheck.js/min/typecheck-v1.min.js";

export default class ToolbarButton{
    static NewGameButton = new this();
    static PauseButton = new this();
    static FastForwardButton = new this();

    /**
     * Whether the button is disabled.
     */
    get disabled() /*: Boolean */ {
        return this.#htmlElement().disabled;
    }
    set disabled(disabled /*: Boolean */){
        this.#htmlElement().disabled = disabled;
        this.#htmlElement().classList.remove("active");
    }

    /**
     * The onclick callback for the button.
     */
    get onclick() /*: function | null */ {
        return this.#htmlElement().onclick;
    }
    set onclick(callback /*: function | null */){
        if(this.#htmlElement().classList.contains("toggleable")){
            this.#htmlElement().onclick = () => {
                this.#htmlElement().classList.toggle("active");
                callback();
            };
        }
        else{
            this.#htmlElement().onclick = callback;
        }
    }

    /**
     * Returns the HTML element corresponding to this button.
     *
     * @return The HTML element corresponding to this button.
     */
    #htmlElement() /*: Element */ {
        switch(this){
        case ToolbarButton.NewGameButton:
            return document.getElementById("newGameButton");
        case ToolbarButton.PauseButton:
            return document.getElementById("pauseButton");
        case ToolbarButton.FastForwardButton:
            return document.getElementById("fastForwardButton");
        default:
            throw new TypeError("ToolbarButton instance must be one of enum values");
        }
    }
}
ToolbarButton = typechecked(ToolbarButton);
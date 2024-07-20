"use strict";

import typechecked from "https://gustavlindberg99.github.io/Typecheck.js/min/typecheck-v1.min.js";

export default class ToolbarButton{
    static NewGameButton = new this();
    static PauseButton = new this();
    static FastForwardButton = new this();

    onclick /*: function | null */ = null;

    /**
     * Whether the button is disabled.
     */
    get disabled() /*: Boolean */ {
        return Android.getToolbarButtonDisabled(this.#buttonId());
    }
    set disabled(disabled /*: Boolean */){
        Android.setToolbarButtonDisabled(this.#buttonId(), disabled);
    }

    /**
     * Returns the string ID corresponding to this button, which will be converted to an ImageButton object in Kotlin.
     *
     * @return The string ID element corresponding to this button.
     */
    #buttonId() /*: String */ {
        switch(this){
        case ToolbarButton.NewGameButton:
            return "newGameButton";
        case ToolbarButton.PauseButton:
            return "pauseButton";
        case ToolbarButton.FastForwardButton:
            return "fastForwardButton";
        default:
            throw new TypeError("ToolbarButton instance must be one of enum values");
        }
    }
}
ToolbarButton = typechecked(ToolbarButton);
window.ToolbarButton = ToolbarButton;    //To be able to access it from evaluateJavascript in Kotlin
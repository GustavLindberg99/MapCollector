export default class ToolbarButton{
    static NewGameButton = new ToolbarButton();
    static PauseButton = new ToolbarButton();
    static FastForwardButton = new ToolbarButton();

    onclick: ((e: PointerEvent) => void) | null = null;

    /**
     * Whether the button is disabled.
     */
    get disabled(): boolean {
        return window.Android!!.getToolbarButtonDisabled(this.#buttonId());
    }
    set disabled(disabled: boolean){
        window.Android!!.setToolbarButtonDisabled(this.#buttonId(), disabled);
    }

    /**
     * Returns the string ID corresponding to this button, which will be converted to an ImageButton object in Kotlin.
     *
     * @return The string ID element corresponding to this button.
     */
    #buttonId(): string {
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

window.ToolbarButton = ToolbarButton;    //To be able to access it from evaluateJavascript in Kotlin

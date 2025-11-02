export default class ToolbarButton{
    static NewGameButton = new ToolbarButton();
    static PauseButton = new ToolbarButton();
    static FastForwardButton = new ToolbarButton();

    /**
     * Whether the button is disabled.
     */
    get disabled(): boolean {
        return this.#htmlElement().disabled;
    }
    set disabled(disabled: boolean){
        this.#htmlElement().disabled = disabled;
        this.#htmlElement().classList.remove("active");
    }

    /**
     * The onclick callback for the button.
     */
    get onclick(): ((e: PointerEvent) => void) | null {
        return this.#htmlElement().onclick;
    }
    set onclick(callback: (() => void) | null){
        if(this.#htmlElement().classList.contains("toggleable")){
            this.#htmlElement().onclick = () => {
                this.#htmlElement().classList.toggle("active");
                callback?.();
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
    #htmlElement(): HTMLButtonElement {
        switch(this){
        case ToolbarButton.NewGameButton:
            return document.querySelector<HTMLButtonElement>("button#newGameButton")!!;
        case ToolbarButton.PauseButton:
            return document.querySelector<HTMLButtonElement>("button#pauseButton")!!;
        case ToolbarButton.FastForwardButton:
            return document.querySelector<HTMLButtonElement>("button#fastForwardButton")!!;
        default:
            throw new TypeError("ToolbarButton instance must be one of enum values");
        }
    }
}

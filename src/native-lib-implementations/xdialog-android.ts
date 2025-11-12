type AndroidXDialogExtraOptions = {
    android_dependencies?: string,
    android_icon?: string | null,
    android_onactivityresult?: (data: string) => void
};

(() => {
    const allDialogs = new Set<XDialog.Dialog>();

    function showDialogWithText(title: string){
        return (text: string, options: XDialog.Options & AndroidXDialogExtraOptions = {}) => window.xdialog.open({
            body: text,
            buttons: ["ok"],
            ...options,
            title: title
        });
    }

    window.xdialog = {
        onok: null,
        oncancel: null,
        ondelete: null,
        onactivityresult: null,

        init(){},

        create(options: XDialog.Options & AndroidXDialogExtraOptions): XDialog.Dialog {
            let buttons: typeof options.buttons;
            if(options.buttons === null){
                buttons = [];
            }
            else if(options.buttons === undefined){
                buttons = ["ok", "cancel"];
            }
            else{
                buttons = options.buttons;
            }
            if(buttons instanceof Array){
                const newButtons: typeof options.buttons = {};
                for(let button of ["ok", "cancel", "delete"] as const){
                    if(buttons.includes(button)){
                        newButtons[button] = button;
                    }
                }
                buttons = newButtons;
            }

            const close = () => {
                allDialogs.delete(dialog);

                window.Android!!.closeDialog();
                this.oncancel?.();

                this.onok = null;
                this.oncancel = null;
                this.ondelete = null;
            };

            const dialog: XDialog.Dialog = {
                id: "",
                get element(): Element {
                    throw new ReferenceError("Cannot get element corresponding to Android dialog");
                },
                show: () => {
                    const callbackParam: XDialog.CallbackParam = {
                        id: "",
                        get element(){
                            return this.dialog.element;
                        },
                        dialog: dialog,
                        get overlay(){
                            return this.dialog.element;
                        },
                        event: null
                    };

                    const resetCallbacks = () => this.onok = this.oncancel = this.ondelete = null;
                    this.onok = () => {options.onok?.(callbackParam); resetCallbacks();};
                    this.oncancel = () => {options.oncancel?.(callbackParam); resetCallbacks();};
                    this.ondelete = () => {options.ondelete?.(callbackParam); resetCallbacks();};
                    this.onactivityresult = options.android_onactivityresult ?? null;

                    window.Android!!.openDialog(
                        options.title ?? "Dialog Title",
                        typeof(options.body) === "string" ? options.body : options.body?.element.textContent ?? "Dialog body",
                        typeof(buttons.ok) === "string" ? buttons.ok : buttons.ok?.text ?? null,
                        typeof(buttons.cancel) === "string" ? buttons.cancel : buttons.cancel?.text ?? null,
                        typeof(buttons.delete) === "string" ? buttons.delete : buttons.delete?.text ?? null,
                        options.android_dependencies ?? null,
                        options.android_icon ?? null
                    );

                    allDialogs.add(dialog);
                },
                hide: close,
                destroy: close,
                close: close,
                adjust: () => {},
                fixChromeBlur: () => {}
            };

            return dialog;
        },

        open(options: XDialog.Options & AndroidXDialogExtraOptions): XDialog.Dialog {
            const dialog = this.create(options);
            dialog.show();
            return dialog;
        },

        alert: showDialogWithText(""),
        info: showDialogWithText(""),
        warn: showDialogWithText(""),
        error: showDialogWithText("Error"),
        fatal: showDialogWithText("Fatal Error"),

        confirm(text: string, onyes: (param: XDialog.CallbackParam) => void, options?: XDialog.Options): XDialog.Dialog {
            return window.xdialog.open({
                body: text,
                onok: onyes,
                buttons: ["yes", "no"],
                ...options,
                title: "Confirm"
            });
        },

        startSpin: () => {
            throw new ReferenceError("xdialog.startSpin is not implemented in the app, use the LoadingView class instead.");
        },

        stopSpin: () => {
            throw new ReferenceError("xdialog.stopSpin is not implemented in the app, use the LoadingView class instead.");
        },

        get dialogs(){
            return [...allDialogs];
        }
    }
})();

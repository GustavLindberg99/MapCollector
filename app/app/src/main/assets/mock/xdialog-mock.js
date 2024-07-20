"use strict";

const xdialog = {
    onok /*: function | null */: null,
    oncancel /*: function | null */: null,
    ondelete /*: function | null */: null,

    open(params = {}){
        let buttons;
        if(params.buttons === null){
            buttons = [];
        }
        else if(params.buttons === undefined){
            buttons = ["ok", "cancel"];
        }
        else{
            buttons = params.buttons;
        }
        if(buttons instanceof Array){
            const newButtons = {};
            for(let button of ["ok", "cancel", "delete"]){
                if(buttons.includes(button)){
                    newButtons[button] = button;
                }
            }
            buttons = newButtons;
        }

        const resetCallbacks = () => xdialog.onok = xdialog.oncancel = xdialog.ondelete = null;
        xdialog.onok = () => {params.onok?.(); resetCallbacks();};
        xdialog.oncancel = () => {params.oncancel?.(); resetCallbacks();};
        xdialog.ondelete = () => {params.ondelete?.(); resetCallbacks();};
        xdialog.onactivityresult = params.android_onactivityresult ?? null;

        Android.openDialog(
            params.title ?? "Dialog Title",
            params.body ?? "Dialog body",
            buttons.ok ?? null,
            buttons.cancel ?? null,
            buttons.delete ?? null,
            params.android_dependencies ?? null,
            params.android_icon ?? null
        );

        return xdialog;    //So that close() works
    },

    close(){
        Android.closeDialog();
        xdialog.oncancel?.();

        xdialog.onok = null;
        xdialog.oncancel = null;
        xdialog.ondelete = null;
    }
}
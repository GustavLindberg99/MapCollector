import ToolbarButton from "./game/toolbar-button-app.js";

interface WebAppInterface {
    lang(): string;
    showToast(text: string): void;
    openDialog(title: string, body: string, ok: string | null, cancel: string | null, del: string | null, dependencies: string | null, icon: string | null): void;
    closeDialog(): void;
    getToolbarButtonDisabled(buttonId: string): boolean;
    setToolbarButtonDisabled(buttonId: string, disabled: boolean): void;
    email(): string | null;
    hashedPassword(): string | null;
    close(data: string): void;
}

export declare global {
    interface Window {
        ToolbarButton: typeof ToolbarButton;
        readonly Android: WebAppInterface | undefined;
        Toastify: typeof Toastify;
        xdialog: typeof xdialog & {
            onok: (() => void) | null,
            oncancel: (() => void) | null,
            ondelete: (() => void) | null,
            onactivityresult: ((data: string) => void) | null
        };
    }
}

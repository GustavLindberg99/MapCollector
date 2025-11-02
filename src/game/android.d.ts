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
        ToolbarButton: unknown;
        readonly Android: WebAppInterface | undefined;
    }
}

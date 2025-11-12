window.Toastify = Object.assign(
    (options: Toastify.Options = {}) => {
        return {
            options: options,
            toastElement: null,
            showToast: () => window.Android!!.showToast(options.text ?? "Toastify is awesome!"),
            hideToast: () => {}
        };
    },
    {
        reposition: () => {},
        defaults: {}
    }
);

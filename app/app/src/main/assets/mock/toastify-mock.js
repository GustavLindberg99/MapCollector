"use strict";

/**
 * A mocked version of the Toastify library's Toastify function with the same signature but that shows a native Android toast.
 *
 * @param params    The same parameters that would be passed to the Toastify library. Only the text property is used in the Android version.
 */
function Toastify(params = {}){
    return {
        showToast: () => Android.showToast(params.text ?? "Toastify is awesome!")
    };
}
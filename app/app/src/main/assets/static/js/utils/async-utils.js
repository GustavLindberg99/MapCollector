"use strict";

import typechecked from "https://gustavlindberg99.github.io/Typecheck.js/min/typecheck-v1.min.js";

/**
 * Waits the specified amount of time, then returns from the async function.
 *
 * @param ms    The time to wait in milliseconds.
 */
export async function wait(ms /*: Number */) /*: void */ {
    await new Promise(r => setTimeout(r, ms));
}
wait = typechecked(wait);

/**
 * Waits the least amount of time needed for the UI to refresh, then returns from the async function.
 */
let uiLastRefreshed = performance.now();
export async function refreshUI() /*: void */ {
    if(performance.now() > uiLastRefreshed + 20){
        uiLastRefreshed = performance.now();
        await wait(0);
    }
}
refreshUI = typechecked(refreshUI);
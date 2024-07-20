"use strict";

import typechecked from "https://gustavlindberg99.github.io/Typecheck.js/min/typecheck-v1.min.js";

/**
 * Wrapper around fetch to simplify error handling (since fetch can either throw an exception or return an non-2xx status code depending on what exactly the error is, which makes error handling messy).
 *
 * @param url       The URL to make a request to.
 * @param postData  The POST data to send in a POST request, or null to make a GET request.
 *
 * @return The Response object returned by fetch, or null if the request failed (either if it got a non-2xx response or if there was a network error).
 */
export async function sendRequest(url /*: String */, postData /*: URLSearchParams | null */ = null) /*: Response | null */ {
    //Workaround for https://issuetracker.google.com/issues/354305979 in the Android app
    if(window.Android){
        postData ??= new URLSearchParams();
        postData.append("email", Android.email());
        postData.append("password", Android.hashedPassword());
    }
    try{
        const options = postData === null ? {} : {
            method: "POST",
            headers: {"Content-Type":"application/x-www-form-urlencoded"},
            body: postData
        };
        const response = await fetch(url, options);
        if(Math.floor(response.status / 100) !== 2){
            const responseText = await response.text();
            const phpError = responseText.match(/<meta\s+name="php-error"\s+content="([^"]+)"\/>/)?.[1] ?? "";
            throw new Error("Server responded with status " + response.status + "\n" + phpError);
        }
        return response;
    }
    catch(e){
        console.info(`Failed to make AJAX request to ${url}: ${e.message}`);
        return null;
    }
}
sendRequest = typechecked(sendRequest);

/**
 * Gets the domain that contains static resorces like Javascript files, CSS files or images. If it's an Android asset, includes "/assets/static".
 *
 * @return The domain including protocol and excluding the trailing slash.
 */
export function staticDomain() /*: String */ {
    const result = new Error().stack.match(/(https?:\/\/\/?[^\/]*).*\.js/i)[1];
    if(result === "https://appassets.androidplatform.net"){
        return result + "/assets/static";
    }
    else if(result === "https://gustavlindberg99.github.io"){
        return result + "/MapCollector"
    }
    return result;
}
staticDomain = typechecked(staticDomain);

/**
 * Gets the domain that AJAX requests should be sent to.
 *
 * @return The domain including protocol and excluding the trailing slash.
 */
export function ajaxDomain() /*: String */ {
    const result = location.href.match(/(https?:\/\/\/?[^\/]*)/i)[1];
    if(result === "https://appassets.androidplatform.net"){
        return "https://mapcollector.eu5.org";
    }
    return result;
}
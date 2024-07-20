"use strict";

import typechecked from "https://gustavlindberg99.github.io/Typecheck.js/min/typecheck-v1.min.js";

function setCookie(name /*: String */, value /*: String */, days /*: Number */, path /*: String */ = "/") /*: void */ {
    var expires = "";
    if(days){
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=" + path;
}
setCookie = typechecked(setCookie);

function acceptCookies(event /*: Event */) /*: void */ {
    setCookie("acceptedCookies", "true", 365);
    const cookieConsent = event.currentTarget.parentElement;

    //Adjust the y coordinate of the introduction bubbles
    const introductionBubble = document.querySelector(".introductionBubble");
    const introductionTip = document.querySelector(".tip");
    if(introductionBubble !== null){
    	introductionBubble.style.top = (parseInt(introductionBubble.style.top) - cookieConsent.clientHeight) + "px";
    }
    if(introductionTip !== null){
    	introductionTip.style.top = (parseInt(introductionTip.style.top) - cookieConsent.clientHeight) + "px";
    }

    //Remove the cookies banner
    cookieConsent.remove();
}
acceptCookies = typechecked(acceptCookies);

function main(){
    const acceptCookiesButton = document.getElementById("acceptCookies");
    const dontCareAboutCookiesButton = document.getElementById("dontCareAboutCookies");
    if(acceptCookiesButton !== null){
        acceptCookiesButton.onclick = acceptCookies;
    }
    if(dontCareAboutCookiesButton !== null){
        dontCareAboutCookiesButton.onclick = (event) => {
            acceptCookies(event);
            window.open("https://www.i-dont-care-about-cookies.eu/");
        };
    }
}

window.addEventListener("load", main);
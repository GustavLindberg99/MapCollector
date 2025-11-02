import {initializeSearchForm} from "./search.js";
import {initTranslations} from "../translations/init.js";

async function main(): Promise<void> {
    initTranslations();
    initializeSearchForm("/?numberOfPlayers=2&opponent=%1");
}

window.addEventListener("load", main);

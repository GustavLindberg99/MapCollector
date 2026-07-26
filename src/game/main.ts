import i18next from "https://unpkg.com/i18next@25.6.0/dist/esm/i18next.js";

import {ajaxDomain, sendRequest} from "../utils.js";

import NewGameView from "./new-game-view.js";
import Opponent from "./opponent.js";
import Place from "./place.js";

import {initTranslations} from "../translations/init.js";

async function main(): Promise<void> {
    initTranslations();

    //In the app, the user ID is set with GET parameters instead of a meta tag, so put it in a meta tag so that it's easy to get it in other places.
    if(window.Android){
        for(let param of ["userId", "userName", "profilePicture"]){
            const value = new URLSearchParams(location.search).get("userId");
            if(value !== null){
                const meta = document.createElement("meta");
                meta.name = param;
                meta.content = value;
                document.head.appendChild(meta);
            }
        }
    }

    const allPlaces: ReadonlyArray<Place> = [
        new Place(i18next.t("Budapest"), "hungary.svg", "budapest.xml", 47, 19, Place.Level.Easy, "https://bkk.hu/", 135, 35),
        new Place(i18next.t("Centre - Val de Loire"), "france.svg", "centrevaldeloire.xml", 47, 1.5, Place.Level.Medium, "https://www.ter.sncf.com/centre-val-de-loire", 225, 50),
        new Place(i18next.t("Copenhagen"), "denmark.svg", "copenhagen.xml", 55, 12, Place.Level.Medium, "http://www.dsb.dk/", 180, 50),
        new Place(i18next.t("Denmark"), "denmark.svg", "denmark.xml", 56, 9, Place.Level.Difficult, "http://www.dsb.dk/", 360, 80),
        new Place(i18next.t("Denver"), "united_states.svg", "denver.xml", 39, -104, Place.Level.Easy, "http://www.rtd-denver.com/", 135, 30),
        new Place(i18next.t("Hamburg"), "germany.svg", "hamburg.xml", 53, 10, Place.Level.Medium, "https://www.hvv.de/", 210, 50, [
            new Place(i18next.t("Hamburg Region"), "germany.svg", "hamburg.xml:region", 53, 10, Place.Level.Difficult, "https://www.hvv.de/", 360, 100)
        ]),
        new Place(i18next.t("Hauts-de-France"), "france.svg", "hautsdefrance.xml", 51, 3, Place.Level.Difficult, "https://www.ter.sncf.com/hauts-de-france", 300, 15),
        new Place(i18next.t("Helsinki"), "finland.svg", "helsinki.xml", 60, 24, Place.Level.Medium, "https://www.hsl.fi/", 150, 70),
        new Place(i18next.t("Paris Region"), "france.svg", "iledefrance.xml", 49, 3, Place.Level.Difficult, "https://www.transilien.com/", 300, 80),
        new Place(i18next.t("Lisbon"), "portugal.svg", "lisbon.xml", 39, -8, Place.Level.Easy, "https://www.metrolisboa.pt/", 105, 15, [
            new Place(i18next.t("Lisbon (with tram)"), "portugal.svg", "lisbon.xml:tram", 39, -8, Place.Level.Medium, "https://www.metrolisboa.pt/", 120, 25)
        ]),
        new Place(i18next.t("London"), "united_kingdom.svg", "london.xml", 51, 0, Place.Level.Difficult, "https://tfl.gov.uk/", 120, 50),
        new Place(i18next.t("Los Angeles"), "united_states.svg", "losangeles.xml", 34, -118, Place.Level.Easy, "https://www.metro.net/", 150, 15, [
            new Place(i18next.t("Los Angeles Region"), "united_states.svg", "losangeles.xml:region", 34, -118, Place.Level.Medium, "https://www.metro.net/", 180, 50)
        ]),
        new Place(i18next.t("Malaga"), "spain.svg", "malaga.xml", 37, -3, Place.Level.Easy, "https://metromalaga.es/", 60, 30),
        new Place(i18next.t("Massachusetts"), "united_states.svg", "massachusetts.xml", 42, -68, Place.Level.Medium, "https://www.mbta.com/", 165, 75),
        new Place(i18next.t("New York"), "united_states.svg", "newyork.xml", 41, -72, Place.Level.Difficult, "http://www.mta.info/", 255, 25),
        new Place(i18next.t("Normandy"), "france.svg", "normandie.xml", 49, 0, Place.Level.Medium, "https://www.ter.sncf.com/normandie", 240, 50),
        new Place(i18next.t("Phoenix"), "united_states.svg", "phoenix.xml", 33, -112, Place.Level.Easy, "https://www.valleymetro.org/", 100, 15),
        new Place(i18next.t("Provence Alpes Côte d'Azur"), "france.svg", "paca.xml", 43, 7, Place.Level.Medium, "https://www.ter.sncf.com/sud-provence-alpes-cote-d-azur", 225, 20),
        new Place(i18next.t("Rome"), "italy.svg", "rome.xml", 42, 13, Place.Level.Easy, "https://www.atac.roma.it/", 120, 15),
        new Place(i18next.t("Skåne"), "sweden.svg", "skane.xml", 55, 13.5, Place.Level.Medium, "https://www.skanetrafiken.se/", 150, 75),
        new Place(i18next.t("Småland"), "sweden.svg", "smaland.xml", 57, 15, Place.Level.Medium, "http://www.krosatagen.se/", 150, 60),
        new Place(i18next.t("Stockholm"), "sweden.svg", "stockholm.xml", 59, 17, Place.Level.Easy, "https://sl.se/", 150, 15, [
            new Place(i18next.t("Stockholm Region"), "sweden.svg", "stockholm.xml:commuterrail", 59, 17, Place.Level.Easy, "https://sl.se/", 165, 20),
            new Place(i18next.t("Stockholm (with tram)"), "sweden.svg", "stockholm.xml:tram", 59, 17, Place.Level.Medium, "https://sl.se/", 155, 25)
        ]),
        new Place(i18next.t("Västergötland"), "sweden.svg", "vastergotland.xml", 57, 12, Place.Level.Medium, "https://www.vasttrafik.se/", 150, 35),
        new Place(i18next.t("Washington DC"), "united_states.svg", "washington.xml", 38, -77, Place.Level.Easy, "https://www.wmata.com/", 150, 45)
    ];

    Opponent.initializePeer(allPlaces);

    const newGameView = new NewGameView(allPlaces);
    newGameView.show();

    let failedStatistics: Array<{[key: string]: string}> = JSON.parse(localStorage.getItem("failedStatistics") ?? "[]");
    for(let statisticsToSave of failedStatistics.slice()){
        const response = await sendRequest(ajaxDomain() + "/ajax/save-statistics.php", new URLSearchParams(statisticsToSave));
        if(response !== null){
            failedStatistics = failedStatistics.filter(it => it !== statisticsToSave);
        }
    }
    if(failedStatistics.length === 0){
        localStorage.removeItem("failedStatistics");
    }
    else{
        localStorage.setItem("failedStatistics", JSON.stringify(failedStatistics));
    }
}

function errorHandler(): void {
    xdialog.error(
        `<p>An unexpected error occurred. We apologize for the inconvenience. This means that if you continue playing, things might not work as expected. If you experience any issues, try refreshing the page.</p>
        <p>If this error persists, please <a href="https://github.com/GustavLindberg99/WorldWar2/issues">contact us</a>. Please include as much information as possible, including what you were doing before you got this error and any information available in the browser's developer tools (accessible by pressing the F12 key and going to Console).</p>`,
        {style: "width:400px"}
    );
}

window.onerror = window.onunhandledrejection = errorHandler;
window.addEventListener("load", main);

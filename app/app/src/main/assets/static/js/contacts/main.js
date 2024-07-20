"use strict";

import typechecked from "https://gustavlindberg99.github.io/Typecheck.js/min/typecheck-v1.min.js";
import {QCoreApplication, QObject, QTranslator} from "https://gustavlindberg99.github.io/QtLinguistWeb/qtranslator-v1.min.js";

import {staticDomain} from "../utils/ajax-utils.js";

import {initializeSearchForm} from "./search.js";

async function main(){
    const translator = new QTranslator();
    await translator.load(staticDomain() + `/js-translations/mapcollector_js_${document.documentElement.lang}.ts`);
    QCoreApplication.installTranslator(translator);

    initializeSearchForm("/?numberOfPlayers=2&opponent=%1");
}

window.addEventListener("load", main);
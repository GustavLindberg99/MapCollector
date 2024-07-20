"use strict";

import typechecked from "https://gustavlindberg99.github.io/Typecheck.js/min/typecheck-v1.min.js";

function toggleCompletedChallenges(level /*: String */) /*: void */ {
    let classList = document.querySelector(".challengeList").classList;
    for(let l of ["easy", "medium", "difficult"]){
        if(level !== l){
            classList.remove(l + "Selected");
        }
    }
    classList.toggle(level + "Selected");
    if(classList.contains(level + "Selected")){
        classList.add("levelSelected");
    }
    else{
        classList.remove("levelSelected");
    }
    classList.remove("notCompletedSelected");
}
toggleCompletedChallenges = typechecked(toggleCompletedChallenges);

function main(){
    document.getElementById("easyChallengeButton")?.addEventListener("click", () => toggleCompletedChallenges("easy"));
    document.getElementById("mediumChallengeButton")?.addEventListener("click", () => toggleCompletedChallenges("medium"));
    document.getElementById("difficultChallengeButton")?.addEventListener("click", () => toggleCompletedChallenges("difficult"));

    document.getElementById("notCompletedChallengeButton")?.addEventListener("click", () => {
        const classList = document.querySelector(".challengeList").classList;
        classList.remove("easySelected");
        classList.remove("mediumSelected");
        classList.remove("difficultSelected");
        classList.remove("levelSelected");
        classList.toggle("notCompletedSelected");
    });
}

window.addEventListener("load", main);
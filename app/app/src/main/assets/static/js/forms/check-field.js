"use strict";

import typechecked from "https://gustavlindberg99.github.io/Typecheck.js/min/typecheck-v1.min.js";
import {QObject} from "https://gustavlindberg99.github.io/QtLinguistWeb/qtranslator-v1.min.js";

/**
 * Checks whether user input in an input element is correct, colors the input accordingly, and shows an error message when needed.
 *
 * @param input         The input element to check. If null, does nothing.
 * @param condintion    True if the current user input is correct, false if it isn't.
 * @param showErrors    Whether or not to show errors if the input is invalid. Setting this to false can be useful because otherwise it would be annoying for the user to see errors while they're typing.
 */
export function checkField(input /*: HTMLInputElement | null */, condition /*: Boolean */, showErrors /*: Boolean */ = true) /*: void */ {
    if((!condition && !showErrors) || input === null){
        return;
    }
    input.classList.add(condition ? "correct" : "incorrect");
    input.classList.remove(condition ? "incorrect" : "correct");
    const toolTip = input.parentElement.querySelector(".formToolTip");
    if(toolTip != null){
        if(condition){
            toolTip.classList.remove("incorrect");
        }
        else{
            toolTip.classList.add("incorrect");
        }
    }
    for(let otherToolTip of input.parentElement.querySelectorAll(".formToolTip")){
        if(otherToolTip != toolTip){
            otherToolTip.classList.remove("correct");
            otherToolTip.classList.remove("incorrect");
        }
    }
}
checkField = typechecked(checkField);

/**
 * Checks that the email address entered in an input is valid.
 *
 * @param input         The input element to check. If null, does nothing.
 * @param showErrors    Whether or not to show errors if the input is invalid. Setting this to false can be useful because otherwise it would be annoying for the user to see errors while they're typing.
 */
export function checkEmail(input /*: HTMLInputElement | null */, showErrors /*: Boolean */ = true) /*: void */ {
    checkField(input, /^[a-z0-9._%+-]+@[a-z0-9._-]+\.[a-z]{2,}$/i.test(input?.value) || (!input.required && input?.value.length === 0), showErrors);
}
checkEmail = typechecked(checkEmail);

/**
 * Checks that the password entered in an input is valid and safe (shows an error if it's invalid and a warning if it's unsafe).
 *
 * @param input     The input element to check. If null, does nothing.
 */
export function checkPassword(input /*: HTMLInputElement | null */) /*: void */ {
    if(input === null){
        return;
    }
    const password = input.value;
    const containsAllCharTypes = /[a-z]/.test(password) + /[A-Z]/.test(password) + /[0-9]/.test(password) + /[^a-z0-9]/i.test(password) >= 3;
    const isNumberSequence = /^(((abc)?((1234?5?6?7?8?9?)|(9?8?7?6?5?4?321)))|1+2*3*)+$/i.test(password);
    /*
    Lists of common words in passwords:
    https://www.passworddragon.com/avoid-common-passwords
    https://www.techrepublic.com/article/worried-about-identity-theft-then-you-should-avoid-these-password-pitfalls/
    https://www.ladn.eu/nouveaux-usages/etude-marketing/ces-mots-de-passe-a-eviter-en-2018/
    https://nyheter24.se/nyheter/inrikes/630049-de-25-vanligaste-och-samsta-losenorden
    https://www.quora.com/What-examples-reveal-how-bad-at-passwords-people-are
    https://xkcd.com/936/
    https://howsecureismypassword.net/
    */
    const isCommonWord = /^((strong)?p[a4]ss(w[o0]rd)?|map.?collector|hello?|hej(san)?|bonjour|welcome|(qw|az)ert(y(u(i(op?)?)?)?)?|[aq]sdf(g(h(j(k(l(öä?)?)?)?)?)?)?|abc(d(e(fg?)?)?)?|i?(love|want)(you)?|angel|princes?s?|(baby)?girl|ferrari|(mad)?dog|boo(ger)?|hooters?|tomcat|(bad|cow)?boy|matrix|big(daddy)?|booty?|rosebud|blonde?|test(er)?|mustang|changeme|rock(star)?|star(wars)?|mike|michael|joh?n(athan)?|sweet|king|(for|what)?ever|bell|heart|life|rick|blue|land|evil|(foot|base)(ball)?|admin|monkey|login|account|dragon|master|free(dom)?|let.?me.?in|sunshine|ashley|bailey|shadow|superman|summer|sommar|(your)?mom|(din)?mamma|johan(na)?|fotboll|flower|blomma|amanda|google|microsoft|windows|apple|computer|phone|secure|horse|battery|correcthorsebatterystaple)\1*[0-9]*$/i.test(password);
    const isRepeatedChar = /^.(.)\1+.$/.test(password) || /^((.)(.)\1\2)+.?.?$/.test(password);
    const hasLeadingOrTrailingSpace = /^\s|\s$/.test(password);
    const uniqueChars = [];
    for(let character of password){
        if(uniqueChars.indexOf(character) === -1){
            uniqueChars.push(character);
        }
    }

    let isEmail = false;
    const emailInputs = document.querySelectorAll("input[type=email]");
    for(let i = 0; i < emailInputs.length; i++){
        if(password === emailInputs[i].value || password === emailInputs[i].value.split('@')[0]){
            isEmail = true;
            break;
        }
    }

    const toolTip = input.parentElement.querySelector(".formToolTip");
    if(password.length === 0 && !input.required){
        input.setAttribute("class", "correct");
        if(toolTip !== null){
            toolTip.setAttribute("class", "formToolTip correct");
            toolTip.textContent = QObject.tr("Leave blank to keep your current password.");
        }
    }
    else if(password.length < 3 || password.length > 255){
        input.setAttribute("class", "incorrect");
        if(toolTip !== null){
            toolTip.setAttribute("class", "formToolTip incorrect");
            toolTip.textContent = QObject.tr("Please enter between %1 and %n characters.", null, 255).arg(3);
        }
    }
    else if(hasLeadingOrTrailingSpace){
        input.setAttribute("class", "badWarning");
        if(toolTip !== null){
            toolTip.setAttribute("class", "formToolTip badWarning");
            toolTip.textContent = QObject.tr("Your password starts or ends with a whitespace. Is this intentional?");
        }
    }
    else if(/[^0-9]/.test(password) && uniqueChars.length >= 4 && password.length >= 8 && !isNumberSequence && !isCommonWord && !isRepeatedChar && !isEmail){
        input.setAttribute("class", "correct");
        if(toolTip !== null){
            toolTip.setAttribute("class", "formToolTip correct");
            toolTip.textContent = QObject.tr("Strong password.");
        }
    }
    else if(password.length >= 6 && uniqueChars.length > 2 && !isNumberSequence && !isCommonWord && !isRepeatedChar && !isEmail){
        input.setAttribute("class", "warning");
        if(toolTip !== null){
            toolTip.setAttribute("class", "formToolTip warning");
            if(password.length < 8){
                toolTip.textContent = QObject.tr("Weak password. We recommend entering least 8 characters.");
            }
            else if(!/[^0-9]/.test(password) || uniqueChars.length < 4){
                toolTip.textContent = QObject.tr("Weak password. We recommend using more unique characters.");
            }
            else{
                toolTip.textContent = QObject.tr("Weak password.");
            }
        }
    }
    else{
        input.setAttribute("class", "badWarning");
        if(toolTip !== null){
            toolTip.setAttribute("class", "formToolTip badWarning");
            if(isNumberSequence){
                toolTip.textContent = QObject.tr("Very weak password. We don't recommend using common sequences of numbers as passwords.");
            }
            else if(isCommonWord){
                toolTip.textContent = QObject.tr("Very weak password. This password is too common.");
            }
            else if(isRepeatedChar || uniqueChars.length <= 2){
                toolTip.textContent = QObject.tr("Very weak password. We recommend using more unique characters.");
            }
            else if(isEmail){
                toolTip.textContent = QObject.tr("Very weak password. We don't recommend using your email address as a password.");
            }
            else if(password.length < 6){
                toolTip.textContent = QObject.tr("Very weak password. We recommend entering least 8 characters.");
            }
            else{
                toolTip.textContent = QObject.tr("Very weak password.");
            }
        }
    }
}
checkPassword = typechecked(checkPassword);

/**
 * Shows a warning dialog if there are weak password warnings anywhere in the given form. To be used when a user tries to submit a form.
 *
 * @param form  The <form> element to check the password inputs.
 *
 * @return True if the form should be submitted, false otherwise.
 */
export function checkForStrongPassword(form /*: HTMLFormElement */) /*: Boolean */ {
    for(let field of [...form.getElementsByTagName("input"), ...form.getElementsByTagName("textarea")]){
        if(field.classList.contains("warning") || field.classList.contains("badWarning")){
            return confirm(QObject.tr("The password you chose is weak, which means that it will be easy for people to steal your account. We strongly recommend choosing another password.") + "\n\n" + QObject.tr("Do you really want to continue?"));
        }
    }
    return true;
}
checkForStrongPassword = typechecked(checkForStrongPassword);
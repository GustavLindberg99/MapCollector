"use strict";

import {QCoreApplication, QObject, QTranslator} from "https://gustavlindberg99.github.io/QtLinguistWeb/qtranslator-v1.min.js";

import {staticDomain} from "../utils/ajax-utils.js";

import {checkEmail, checkField, checkForStrongPassword, checkPassword} from "./check-field.js";

async function main(){
    const translator = new QTranslator();
    await translator.load(staticDomain() + `/js-translations/mapcollector_js_${document.documentElement.lang}.ts`);
    QCoreApplication.installTranslator(translator);

    //User name input
    const userNameInput = document.querySelector("input[name=userName]");
    const checkUserNameInput = () => checkField(userNameInput, userNameInput?.value.length > 0 && userNameInput?.value.length <= 255);
    userNameInput?.addEventListener("keyup", checkUserNameInput);

    //Email/confirm email input
    const emailInput = document.querySelector("input[name=email]");
    const checkEmailInput = () => checkEmail(emailInput);
    emailInput?.addEventListener("change", checkEmailInput);
    emailInput?.addEventListener("keyup", () => checkEmail(emailInput, false));
    emailInput?.addEventListener("keyup", () => (document.getElementById("alreadyInUse")?.style ?? {}).visibility = "hidden");

    const confirmEmailInput = document.querySelector("input[name=confirmEmail]");
    const checkConfirmEmailInput = () => checkField(confirmEmailInput, confirmEmailInput?.value === emailInput?.value);
    confirmEmailInput?.addEventListener("keyup", checkConfirmEmailInput);

    //Password/confirm password inputs
    const passwordInput = document.querySelector("input[name=password]");
    const currentPasswordInput = document.querySelector("input[name=currentPassword]");
    const checkPasswordInput = (input) => {
        if(input?.autocomplete === "new-password"){
            checkPassword(input);
        }
        else if(input?.required){
            checkField(input, input.value.length > 0);
        }
    };
    passwordInput?.addEventListener("keyup", () => checkPasswordInput(passwordInput));
    currentPasswordInput?.addEventListener("keyup", () => checkPasswordInput(currentPasswordInput));

    const confirmPasswordInput = document.querySelector("input[name=confirmPassword]");
    const checkConfirmPasswordInput = () => checkField(confirmPasswordInput, confirmPasswordInput?.value === passwordInput?.value);
    confirmPasswordInput?.addEventListener("keyup", checkConfirmPasswordInput);

    //Change user name on profile page
    document.getElementById("changeUserNameButton")?.addEventListener("click", () => {
        document.getElementById("username").style.display = "none";
        document.getElementById("changeUserNameForm").style.display = "";
    });
    document.querySelector("#changeUserNameForm input[type=reset]")?.addEventListener("click", () => {
        document.getElementById("username").style.display = "";
        document.getElementById("changeUserNameForm").style.display = "none";
    });

    //Change profile picture
    document.getElementById("changeProfilePictureButton")?.addEventListener("click", () => document.getElementById("changeProfilePictureForm").style.display = "");
    document.querySelector("#changeProfilePictureForm input[type=reset]")?.addEventListener("click", () => document.getElementById("changeProfilePictureForm").style.display = "none");

    //Change email or password
    document.getElementById("changeEmailOrPasswordButton")?.addEventListener("click", () => document.getElementById("changeEmailOrPasswordForm").style.display = "");
    document.querySelector("#changeEmailOrPasswordForm input[type=reset]")?.addEventListener("click", () => document.getElementById("changeEmailOrPasswordForm").style.display = "none");

    //Show warning before resetting statistics
    document.querySelector("input[name=resetStatistics]")?.addEventListener("click", () => confirm(QObject.tr("Do you really want to reset your statistics? This cannot be undone.")) || event.preventDefault());

    //Show warning before submitting a weak password
    const submitButton = document.querySelector("input[type=submit]");
    submitButton?.addEventListener("click", (event) => checkForStrongPassword(submitButton.parentElement) || event.preventDefault());

    //Check errors in the fieldds after a failed post request
    const requestMethod = document.querySelector("meta[name=request-method]").content;
    if(requestMethod === "POST"){
        checkUserNameInput();
        checkConfirmEmailInput();
        if(document.getElementById("alreadyInUse") === null){
            checkEmailInput();
        }
    }
}

window.addEventListener("load", main);
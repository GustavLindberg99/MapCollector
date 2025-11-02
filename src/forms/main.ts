import i18next from "https://unpkg.com/i18next@25.6.0/dist/esm/i18next.js";

import {checkEmail, checkField, checkForStrongPassword, checkPassword} from "./check-field.js";
import {initTranslations} from "../translations/init.js";

function checkPasswordInput(input: HTMLInputElement | null): void {
    if(input?.autocomplete === "new-password"){
        checkPassword(input);
    }
    else if(input?.required){
        checkField(input, input.value.length > 0);
    }
}

async function main(){
    initTranslations();

    //User name input
    const userNameInput = document.querySelector<HTMLInputElement>("input[name=userName]");
    const checkUserNameInput = () => checkField(userNameInput, userNameInput !== null && userNameInput?.value.length > 0 && userNameInput?.value.length <= 255);
    userNameInput?.addEventListener("keyup", checkUserNameInput);

    //Email/confirm email input
    const emailInput = document.querySelector<HTMLInputElement>("input[name=email]");
    const checkEmailInput = () => checkEmail(emailInput);
    emailInput?.addEventListener("change", checkEmailInput);
    emailInput?.addEventListener("keyup", () => checkEmail(emailInput, false));
    emailInput?.addEventListener("keyup", () => (document.getElementById("alreadyInUse")?.style ?? {visibility: ""}).visibility = "hidden");

    const confirmEmailInput = document.querySelector<HTMLInputElement>("input[name=confirmEmail]");
    const checkConfirmEmailInput = () => checkField(confirmEmailInput, confirmEmailInput?.value === emailInput?.value);
    confirmEmailInput?.addEventListener("keyup", checkConfirmEmailInput);

    //Password/confirm password inputs
    const passwordInput = document.querySelector<HTMLInputElement>("input[name=password]");
    const currentPasswordInput = document.querySelector<HTMLInputElement>("input[name=currentPassword]");
    passwordInput?.addEventListener("keyup", () => checkPasswordInput(passwordInput));
    currentPasswordInput?.addEventListener("keyup", () => checkPasswordInput(currentPasswordInput));

    const confirmPasswordInput = document.querySelector<HTMLInputElement>("input[name=confirmPassword]");
    const checkConfirmPasswordInput = () => checkField(confirmPasswordInput, confirmPasswordInput?.value === passwordInput?.value);
    confirmPasswordInput?.addEventListener("keyup", checkConfirmPasswordInput);

    //Change user name on profile page
    document.getElementById("changeUserNameButton")?.addEventListener("click", () => {
        document.getElementById("username")!!.style.display = "none";
        document.getElementById("changeUserNameForm")!!.style.display = "";
    });
    document.querySelector("#changeUserNameForm input[type=reset]")?.addEventListener("click", () => {
        document.getElementById("username")!!.style.display = "";
        document.getElementById("changeUserNameForm")!!.style.display = "none";
    });

    //Change profile picture
    document.getElementById("changeProfilePictureButton")?.addEventListener("click", () => document.getElementById("changeProfilePictureForm")!!.style.display = "");
    document.querySelector("#changeProfilePictureForm input[type=reset]")?.addEventListener("click", () => document.getElementById("changeProfilePictureForm")!!.style.display = "none");

    //Change email or password
    document.getElementById("changeEmailOrPasswordButton")?.addEventListener("click", () => document.getElementById("changeEmailOrPasswordForm")!!.style.display = "");
    document.querySelector("#changeEmailOrPasswordForm input[type=reset]")?.addEventListener("click", () => document.getElementById("changeEmailOrPasswordForm")!!.style.display = "none");

    //Show warning before resetting statistics
    document.querySelector("input[name=resetStatistics]")?.addEventListener("click", (event) => confirm(i18next.t("Do you really want to reset your statistics? This cannot be undone.")) || event.preventDefault());

    //Show warning before submitting a weak password
    const submitButton = document.querySelector("input[type=submit]");
    submitButton?.addEventListener("click", (event) => checkForStrongPassword(submitButton.parentElement as HTMLFormElement) || event.preventDefault());

    //Check errors in the fieldds after a failed post request
    const requestMethod = document.querySelector<HTMLMetaElement>("meta[name=request-method]")!!.content;
    if(requestMethod === "POST"){
        checkUserNameInput();
        checkConfirmEmailInput();
        if(document.getElementById("alreadyInUse") === null){
            checkEmailInput();
        }
    }
}

window.addEventListener("load", main);

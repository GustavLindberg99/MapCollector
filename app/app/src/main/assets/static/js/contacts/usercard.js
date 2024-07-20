"use strict";

import typechecked from "https://gustavlindberg99.github.io/Typecheck.js/min/typecheck-v1.min.js";
import {QObject} from "https://gustavlindberg99.github.io/QtLinguistWeb/qtranslator-v1.min.js";

import {ajaxDomain, sendRequest, staticDomain} from "../utils/ajax-utils.js";

/**
 * Creates a user card without appending it to the DOM.
 *
 * @param userId            The user's id.
 * @param userName          The user's user name.
 * @param profilePicture    The URL of the user's profile picture.
 * @param isContact         True if the user is in the logged in user's contacts, false otherwise.
 * @param playCallbackOrUrl The callback that should be run or the URL that should be opened when the user clicks on the "Play with this user" button. If it's a string (representing a URL), it should contain "%1" which will be replaced with the user ID. If it's a function (representing a callback), it should take one number as a parameter which will be the user ID.
 *
 * @return An HTML element with the user card so that it can be appended to the DOM.
 */
export function createUserCard(
    userId /*: Number */,
    userName /*: String */,
    profilePicture /*: String */,
    isContact /*: Boolean */,
    playCallbackOrUrl /*: function | String */
) /*: HTMLElement */ {
    const isCurrentUser = userId.toString() === document.querySelector("meta[name=user-id]")?.content

    const userCard = document.createElement("div");
    userCard.className = "userCard uid" + userId;

    const profilePictureElement = document.createElement("img");
    profilePictureElement.src = profilePicture;
    profilePictureElement.alt = userName;
    profilePictureElement.className = "profilePicture";
    userCard.appendChild(profilePictureElement);

    const text = document.createElement("div");
    const userNameElement = document.createElement("h5");
    userNameElement.textContent = userName;
    text.appendChild(userNameElement);

    if(isCurrentUser){
        const youSpan = document.createElement("span");
        youSpan.textContent = " (" + QObject.tr("You") + ")";
        userNameElement.appendChild(youSpan);
    }

    const links = document.createElement("p");
    if(!isCurrentUser){
        const playLink = document.createElement("a");
        playLink.textContent = QObject.tr("Play with this user");
        if(typechecked.isinstance(playCallbackOrUrl, String)){
            playLink.href = playCallbackOrUrl.arg(userId);
        }
        else{
            playLink.role = "button";
            playLink.href = "javascript:void(0)";
            playLink.onclick = () => playCallbackOrUrl(userId, userName);
        }
        links.appendChild(playLink);
        links.appendChild(document.createTextNode(" • "));
    }
    const profileLink = document.createElement("a");
    profileLink.textContent = QObject.tr("View profile");
    profileLink.href = ajaxDomain() + "/users/profile.php?uid=" + userId;
    links.appendChild(profileLink);
    if(!isCurrentUser){
        links.appendChild(document.createTextNode(" • "));
        const contactLink = document.createElement("a");
        contactLink.className = "setContact";
        contactLink.textContent = isContact ? QObject.tr("Remove from contacts") : QObject.tr("Add to contacts");
        contactLink.role = "button";
        contactLink.href = "javascript:void(0)";
        contactLink.onclick = (event) => setContact(userId, userName, profilePicture, !isContact, playCallbackOrUrl);    //This callback will be changed by the setContact function
        links.appendChild(contactLink);
    }
    text.appendChild(links);
    userCard.appendChild(text);
    return userCard;
}
createUserCard = typechecked(createUserCard);

/**
 * Changes whether or not a user is in the logged in user's contacts.
 *
 * @param userId            The user's id.
 * @param userName          The user's user name.
 * @param profilePicture    The URL of the user's profile picture.
 * @param isContact         True if the user should be added to the contacts, false if the user should be removed from the contacts.
 * @param playCallbackOrUrl The callback that should be run or the URL that should be opened when the user clicks on the "Play with this user" button. If it's a string (representing a URL), it should contain "%1" which will be replaced with the user ID. If it's a function (representing a callback), it should take one number as a parameter which will be the user ID.
 */
async function setContact(
    userId /*: Number */,
    userName /*: String */,
    profilePicture /*: String */,
    isContact /*: Boolean */,
    playCallbackOrUrl /*: function | String */
) /*: void */ {
    const buttons = document.querySelectorAll(`.userCard.uid${userId} .setContact`);
    for(let button of buttons){
        button.innerHTML = "<img src=\"" + staticDomain() + "/images/loading.svg\" class=\"inline\" alt=\"" + QObject.tr("Loading...") + "\"/>";
        button.disabled = true;
        button.onclick = null;
    }

    const response = await sendRequest(ajaxDomain() + "/ajax/set-contact.php", new URLSearchParams({
        "action": isContact ? "add" : "remove",
        "contact": userId
    }));
    if(response === null){
        Toastify({
            text: QObject.tr("An error occurred. Check your internet connection and try again."),
            close: true,
            style: {
                background: "red"
            }
        }).showToast();
        isContact = !isContact;
    }

    for(let button of buttons){
        button.textContent = isContact ? QObject.tr("Remove from contacts") : QObject.tr("Add to contacts");
        button.onclick = (e) => {
            setContact(userId, userName, profilePicture, !isContact, playCallbackOrUrl);
        };
    }

    if(isContact){
        if(document.getElementById("contactList").childElementCount === 0){
            document.getElementById("contactList").textContent = "";
        }
        const newUserCard = createUserCard(userId, userName, profilePicture, isContact, playCallbackOrUrl);
        document.getElementById("contactList").appendChild(newUserCard);
    }
    else{
        const oldUserCard = document.querySelector(`#contactList .userCard.uid${userId}`);
        oldUserCard.parentElement.removeChild(oldUserCard);
        if(document.getElementById("contactList").childElementCount === 0){
            document.getElementById("contactList").textContent = QObject.tr("You don't have any contacts. Search for a user in the search box below and click \"Add to contacts\" to add users to your contacts.");
        }
    }
}
setContact = typechecked(setContact);
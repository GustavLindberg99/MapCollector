import i18next from "https://unpkg.com/i18next@25.6.0/dist/esm/i18next.js";

import {ajaxDomain, sendRequest, staticDomain} from "../utils.js";

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
    userId: number,
    userName: string,
    profilePicture: string,
    isContact: boolean,
    playCallbackOrUrl: ((userId: number, userName: string) => void) | string
): HTMLElement {
    const isCurrentUser = userId.toString() === document.querySelector<HTMLMetaElement>("meta[name=userId]")?.content;

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
        youSpan.textContent = " (" + i18next.t("You") + ")";
        userNameElement.appendChild(youSpan);
    }

    const links = document.createElement("p");
    if(!isCurrentUser){
        const playLink = document.createElement("a");
        playLink.textContent = i18next.t("Play with this user");
        if(typeof(playCallbackOrUrl) === "string"){
            playLink.href = playCallbackOrUrl.replace("%1", userId.toString());
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
    profileLink.textContent = i18next.t("View profile");
    profileLink.href = ajaxDomain() + "/users/profile.php?uid=" + userId;
    links.appendChild(profileLink);
    if(!isCurrentUser){
        links.appendChild(document.createTextNode(" • "));
        const contactLink = document.createElement("a");
        contactLink.className = "setContact";
        contactLink.textContent = isContact ? i18next.t("Remove from contacts") : i18next.t("Add to contacts");
        contactLink.role = "button";
        contactLink.href = "javascript:void(0)";
        contactLink.onclick = () => setContact(userId, userName, profilePicture, !isContact, playCallbackOrUrl);    //This callback will be changed by the setContact function
        links.appendChild(contactLink);
    }
    text.appendChild(links);
    userCard.appendChild(text);
    return userCard;
}

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
    userId: number,
    userName: string,
    profilePicture: string,
    isContact: boolean,
    playCallbackOrUrl: ((userId: number, userName: string) => void) | string
): Promise<void> {
    const buttons = document.querySelectorAll<HTMLButtonElement>(`.userCard.uid${userId} .setContact`);
    for(let button of buttons){
        button.innerHTML = "<img src=\"" + staticDomain() + "/images/loading.svg\" class=\"inline\" alt=\"" + i18next.t("Loading...") + "\"/>";
        button.disabled = true;
        button.onclick = null;
    }

    const response = await sendRequest(ajaxDomain() + "/ajax/set-contact.php", new URLSearchParams({
        "action": isContact ? "add" : "remove",
        "contact": userId.toString()
    }));
    if(response === null){
        Toastify({
            text: i18next.t("An error occurred. Check your internet connection and try again."),
            close: true,
            style: {
                background: "red"
            }
        }).showToast();
        isContact = !isContact;
    }

    for(let button of buttons){
        button.textContent = isContact ? i18next.t("Remove from contacts") : i18next.t("Add to contacts");
        button.onclick = (e) => {
            setContact(userId, userName, profilePicture, !isContact, playCallbackOrUrl);
        };
    }

    const contactList = document.getElementById("contactList")!!;
    if(isContact){
        if(contactList.childElementCount === 0){
            contactList.textContent = "";
        }
        const newUserCard = createUserCard(userId, userName, profilePicture, isContact, playCallbackOrUrl);
        contactList.appendChild(newUserCard);
    }
    else{
        const oldUserCard = document.querySelector(`#contactList .userCard.uid${userId}`)!!;
        oldUserCard.remove();
        if(contactList.childElementCount === 0){
            contactList.textContent = i18next.t("You don't have any contacts. Search for a user in the search box below and click \"Add to contacts\" to add users to your contacts.");
        }
    }
}

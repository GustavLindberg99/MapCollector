import i18next from "https://unpkg.com/i18next@25.6.0/dist/esm/i18next.js";

import {ajaxDomain, sendRequest} from "../utils.js";

import LoadingView from "../loading-view.js";

import {createUserCard} from "./usercard.js";

/**
 * Submits the search form and searches for users.
 *
 * @param playCallbackOrUrl The callback that should be run or the URL that should be opened when the user clicks on the "Play with this user" button. If it's a string (representing a URL), it should contain "%1" which will be replaced with the user ID.
 */
async function submitSearchForm(playCallbackOrUrl: ((userId: number, userName: string) => void) | string): Promise<void> {
    const searchResultsContainer = document.getElementById("searchResults")!!;
    const loadingView = new LoadingView(searchResultsContainer!!, false);
    const searchQuery = document.querySelector<HTMLInputElement>("#searchUserForm input[type=search]")!!.value.trim();
    const searchResponse = await sendRequest(ajaxDomain() + "/ajax/search-user.php", new URLSearchParams({"search": searchQuery}));

    const searchResults = await searchResponse?.json() ?? [];
    loadingView.close();
    searchResultsContainer.replaceChildren();
    if(searchResults.length === 0){
        searchResultsContainer.textContent = searchResponse === null ? i18next.t("An error occurred when searching for users. Check your internet connection and try again.") : i18next.t("No users matched your search.");
    }
    else for(let user of searchResults){
        const userCard = createUserCard(user.id, user.name, user.profilePicture, user.isContact, playCallbackOrUrl);
        searchResultsContainer.appendChild(userCard);
    }
}

/**
 * Searches for the user's contacts and fills the contacts div with the result.
 *
 * @param playCallbackOrUrl The callback that should be run or the URL that should be opened when the user clicks on the "Play with this user" button. If it's a string (representing a URL), it should contain "%1" which will be replaced with the user ID.
 */
async function searchForContacts(playCallbackOrUrl: ((userId: number, userName: string) => void) | string): Promise<void> {
    const contactsResponse = await sendRequest(ajaxDomain() + "/ajax/search-user.php");
    const contacts = await contactsResponse?.json() ?? [];
    if(contacts.length === 0){
        document.getElementById("contactList")!!.textContent = contactsResponse === null ? i18next.t("An error occurred when fetching your contacts. Check your internet connection and try again.") : i18next.t("You don't have any contacts. Search for a user in the search box below and click \"Add to contacts\" to add users to your contacts.");
    }
    else for(let user of contacts){
        const userCard = createUserCard(user.id, user.name, user.profilePicture, user.isContact, playCallbackOrUrl);
        document.getElementById("contactList")!!.appendChild(userCard);
    }
}

/**
 * Initializes the form to search for users.
 *
 * @param playCallbackOrUrl The callback that should be run or the URL that should be opened when the user clicks on the "Play with this user" button. If it's a string (representing a URL), it should contain "%1" which will be replaced with the user ID.
 * @param defaultSearch     The string to search for by default. If null, leaves the search box empty.
 */
export async function initializeSearchForm(playCallbackOrUrl: ((userId: number, userName: string) => void) | string, defaultSearch: string | null = null): Promise<void> {
    document.getElementById("searchUserForm")!!.addEventListener("submit", (event) => {
        event.preventDefault();
        submitSearchForm(playCallbackOrUrl);
    });

    if(defaultSearch === null){
        await searchForContacts(playCallbackOrUrl);
    }
    else{
        document.querySelector<HTMLInputElement>("#searchUserForm input[type=search]")!!.value = defaultSearch;
        searchForContacts(playCallbackOrUrl);    //Don't await this, it should run in the background without blocking anything since this view isn't visible (but it can become visible if the user clears the search box)
        await submitSearchForm(playCallbackOrUrl);
    }
}

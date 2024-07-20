"use strict";

import typechecked from "https://gustavlindberg99.github.io/Typecheck.js/min/typecheck-v1.min.js";
import {QObject} from "https://gustavlindberg99.github.io/QtLinguistWeb/qtranslator-v1.min.js";

import LoadingView from "../utils/loading-view.js";
import {ajaxDomain, sendRequest} from "../utils/ajax-utils.js";

import {createUserCard} from "./usercard.js";

/**
 * Submits the search form and searches for users.
 *
 * @param playCallbackOrUrl The callback that should be run or the URL that should be opened when the user clicks on the "Play with this user" button. If it's a string (representing a URL), it should contain "%1" which will be replaced with the user ID.
 */
async function submitSearchForm(playCallbackOrUrl /*: function | String */) /*: void */ {
    const searchResultsContainer = document.getElementById("searchResults");
    const loadingView = new LoadingView(searchResultsContainer, false);
    const searchQuery = document.querySelector("#searchUserForm input[type=search]").value.trim();
    const searchResponse = await sendRequest(ajaxDomain() + "/ajax/search-user.php", new URLSearchParams({"search": searchQuery}));

    const searchResults = await searchResponse?.json() ?? [];
    loadingView.close();
    searchResultsContainer.replaceChildren();
    if(searchResults.length === 0){
        searchResultsContainer.textContent = searchResponse === null ? QObject.tr("An error occurred when searching for users. Check your internet connection and try again.") : QObject.tr("No users matched your search.");
    }
    else for(let user of searchResults){
        const userCard = createUserCard(user.id, user.name, user.profilePicture, user.isContact, playCallbackOrUrl);
        searchResultsContainer.appendChild(userCard);
    }
}
submitSearchForm = typechecked(submitSearchForm);

/**
 * Searches for the user's contacts and fills the contacts div with the result.
 *
 * @param playCallbackOrUrl The callback that should be run or the URL that should be opened when the user clicks on the "Play with this user" button. If it's a string (representing a URL), it should contain "%1" which will be replaced with the user ID.
 */
async function searchForContacts(playCallbackOrUrl /*: function | String */) /*: void */ {
    const contactsResponse = await sendRequest(ajaxDomain() + "/ajax/search-user.php");
    const contacts = await contactsResponse?.json() ?? [];
    if(contacts.length === 0){
        document.getElementById("contactList").textContent = contactsResponse === null ? QObject.tr("An error occurred when fetching your contacts. Check your internet connection and try again.") : QObject.tr("You don't have any contacts. Search for a user in the search box below and click \"Add to contacts\" to add users to your contacts.");
    }
    else for(let user of contacts){
        const userCard = createUserCard(user.id, user.name, user.profilePicture, user.isContact, playCallbackOrUrl);
        document.getElementById("contactList").appendChild(userCard);
    }
}
searchForContacts = typechecked(searchForContacts);

/**
 * Initializes the form to search for users.
 *
 * @param playCallbackOrUrl The callback that should be run or the URL that should be opened when the user clicks on the "Play with this user" button. If it's a string (representing a URL), it should contain "%1" which will be replaced with the user ID.
 * @param defaultSearch     The string to search for by default. If null, leaves the search box empty.
 */
export async function initializeSearchForm(playCallbackOrUrl /*: function | String */, defaultSearch /*: String | null */ = null) /*: void */ {
    document.getElementById("searchUserForm").addEventListener("submit", (event) => {
        event.preventDefault();
        submitSearchForm(playCallbackOrUrl);
    });

    if(defaultSearch === null){
        await searchForContacts(playCallbackOrUrl);
    }
    else{
        document.querySelector("#searchUserForm input[type=search]").value = defaultSearch;
        searchForContacts(playCallbackOrUrl);    //Don't await this, it should run in the background without blocking anything since this view isn't visible (but it can become visible if the user clears the search box)
        await submitSearchForm(playCallbackOrUrl);
    }
}
initializeSearchForm = typechecked(initializeSearchForm);
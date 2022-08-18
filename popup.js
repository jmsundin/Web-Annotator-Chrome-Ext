/*
This popup.js is the Chrome extension popup script that reads the global variables
in the background.js service worker script, which handles the events on the web page
*/

/*
This popup.js script handles the events on the Chrome extension popup: popup.html
*/

import { constants } from "./constants.js";

let activeTab = null;

const searchButton = document.getElementById("search-button");
const searchInput = document.getElementById("search-input");

function onClickLoadData() {
  let message = {
    context: constants.context.onClickLoadDataButtonExtensionPopup,
    action: constants.actions.fetchData,
    data: {},
  };

  sendMessagePopupScript(message);
}

function sendMessagePopupScript(message) {
  chrome.runtime.sendMessage(message, (response) => {
    console.log(`response from messaging system popup script: ${response}`);
  });
}

// async function getActiveTab() {
//   const tabs = await chrome.tabs.query({
//     currentWindow: true,
//     active: true,
//   });
//   activeTab = tabs[0];
//   return activeTab;
// }

// listener attached to document object waiting for the DOMContentLoadead event
// TODO: implement the callback
// document.addEventListener("DOMContentLoaded", async () => {
//   activeTab = getActiveTab();
// });

/* basic search with no autocomplete */
// TODO: implement callback
// searchInput.addEventListener('onkeypress', (event) => {
//     // chrome.runtime.sendMessage({"from-popup": searchDOM, "eventObj": event});
// });

/*
// searchInput.addEventListener('enter', (event) => {
//     searchDOM(event.value);
// });

// searchButton.addEventListener('click', (event) => {
//     searchDOM(event.value);
// });

*/
/* autocomplete search */

// const search_autocomplete = document.querySelector('#search-autocomplete');
// let search_input_string = search_autocomplete.innerHTML;

// let dom_body = document.body
// let text_on_page = [];

// const dataFilter = (value) => {
//     search_input_string
//   return data.filter((item) => {
//     return item.toLowerCase().startsWith(value.toLowerCase());
//   });
// };

// new mdb.Autocomplete(search_autocomplete, {
//   filter: dataFilter
// });

/* end of autocomplete search box */

// to get the background.js service worker `window` object call this function below from the chrome API
// chrome.runtime.getBackgroundPage((background_service_worker_window) => {
//     console.log(background_service_worker_window);
// });

// let searchButton = document.getElementById('searchChromeBookmarks');
// searchButton.addEventListener('click', () => {
//   chrome.tabs.create({url:chrome.extension.getURL('localsearch.html')})
//   window.close()
// });

/* message handlers */
// function oneTimeMessageReceiver(message, sender, sendResponse) {
//   if (message.context === "contextMenuItem") {
//     annotationTestText.textContent =
//       message.info.onClickDataContextMenu.selectionText;
//     annotationTestComment.textContent =
//       message.info.onClickDataContextMenu.pageUrl;
//   }
// }

// send message to background.js to get data from storage for the visited URL and highlight the page
// if (activeTab) {
//   chrome.tabs.sendMessage(
//     activeTab.id,
//     { action: "get-data-from-chrome-storage" },
//     responseCallback
//   );
// }

/* message listeners */
// popup.js is an extension process, and thus uses the chrome.runtime API
// the background.js service worker and the content script use the chrome.tabs API to send and receive messages
// TODO: implement listener
// chrome.runtime.onMessage.addListener((message, sender, response) => {
//   if (message.action === "load-data-from-chrome-storage") {
    
//   }
// });

// chrome.runtime.onMessage.addListener(async function requestCallback(
//   request,
//   sender,
//   sendResponse
// ) {
//   if (request.context === "contextMenuItem") {
//     if (request.error) {
//     } else {
//       annotationTestText.textContent =
//         request.onClickDataContextMenu.selectionText;
//       annotationTestComment = "test comment";
//     }
//   }
// });

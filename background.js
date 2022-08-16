/*
background.js is the service worker for the Chrome extension
it is a separate process from the web page and shares the environment of the extension scripts.
Thus, it does not have access the DOM of the web page.

background.js can communicate with the extension through the Chrome messaging API

This script listens to and responds to events that happen in the web page and browser window
like context menu clicks, tab updates, and extension installation.
*/
/* global variable declarations and assignments */

import { constants } from "./constants.js";

/* ----------- getter functions ----------------- */

function getUUID() {
  return Date.now().toString(); // returns time since January 1, 1970 in milliseconds
}

// TODO: implement this function
function getActiveTabWindow(){
  let queryOptions = { lastFocusedWindow: true, active: true };
  chrome.tabs.query
  return
}

function fetchAnnotationsForUrlKey(encodedUrlAsKey) {
  // url: string
  // url is stored as a string in the tab object
  chrome.storage.sync.get(encodedUrlAsKey, (annotationObjsForUrl) => {
    if (annotationObjsForUrl) {
      let message = {
        context: constants.context.onUpdateTabComplete,
        action: constants.actions.addAnnotationsForUrlToDom,
        annotationsObjsForUrl: annotationObjsForUrl,
      };
      runPortMessagingConnection(message);
    } else console.log(`No annotations stored for ${url}`);
  });
}

// TODO: implement updateAnnotation
// function updateAnnotation(request, annotation){
//   if (request.comment){
//     annotation.comment = request.comment;
//   }
//   if(request.color){
//     annotation.color = request.color;
//   }
// }

/* ----------- end of getter functions ---------- */

/* messaging function */
function runPortMessagingConnection(message) {
  let queryOptions = { lastFocusedWindow: true, active: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`
  // chrome.tabs.query returns a Promise object
  chrome.tabs.query(queryOptions, (tabs) => {
    if (tabs && tabs.length > 0) {
      let tab = tabs[0];
      const port = chrome.tabs.connect(tab.id);
      port.postMessage(message);
      port.onDisconnect = (err) => {
        console.error("disconnected with this error: ", err);
      };
    }
  });
}

/* end: messaging function */

/* callback handler functions */

function onUpdatedTabCallback(tabId, changeInfo, tab) {
  if (changeInfo.status === "complete") {
    // What to do when the tab is completely updated?
  }
}

/* info object passed when contextMenu item is clicked
  callback parameters include: (info: OnClickData, tab?: tabs.Tab)
  info = { // of these the menuItemId is required
      menuItemId: string or int: the ID of the menu item that was clicked,
      pageUrl: string: The URL of the page where the menu item was clicked. This property is not set if the click occured in a context where there is no current page, such as in a launcher context menu.,
      selectionText: string: The text for the context selection, if any.,
      srcUrl: string: Will be present for elements with a 'src' URL.
    } */

function sendMessageAfterContextMenuClick(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs) {
      var tab = tabs[0];
      const port = chrome.tabs.connect(tab.id);
      port.postMessage(message);
      port.onDisconnect = (err) => {
        console.error("disconnected " + err);
      };
    }
  });
}

/* info object passed when contextMenu item is clicked
  callback parameters include: (info: OnClickData, tab?: tabs.Tab)
  info = { // of these the menuItemId is required
      menuItemId: string or int: the ID of the menu item that was clicked,
      pageUrl: string: The URL of the page where the menu item was clicked. This property is not set if the click occured in a context where there is no current page, such as in a launcher context menu.,
      selectionText: string: The text for the context selection, if any.,
      srcUrl: string: Will be present for elements with a 'src' URL.
    } */
function onClickContextMenusCallback(onClickData, tab) {
  if (constants.highlightColorChoices.includes(onClickData.menuItemId)) {
    // annotation data model object
    let message = {
      context: constants.context.onUpdatedTabComplete,
      action: constants.actions.highlightSelectedText,
      annotationObj: {
        id: getUUID(),
        highlightColor: onClickData.menuItemId,
        selectionText: onClickData.selectionText,
        srcUrl: onClickData.srcUrl,
        comment: "",
        urlTitle: tab.title,
        pageUrl: onClickData.pageUrl,
      },
    };
    // alert(JSON.stringify(message));
    sendMessageAfterContextMenuClick(message);
  }
}

// callback function for context menu create functions
// if error occured, chrome.runtime.lastError will include it
function contextMenusCreateCallback() {
  if (!chrome.runtime.lastError) return;
  console.log("context menu create error: " + chrome.runtime.lastError);
}

function createContextMenusCallback() {
  // context menu create takes two parameters (menuItemProperties, callbackHandler)
  // these menu items will only show in the context menu with the context of selection of text
  chrome.contextMenus.create(
    {
      id: "yellow",
      title: "yellow",
      type: "normal",
      contexts: ["selection"],
    },
    contextMenusCreateCallback
  );

  chrome.contextMenus.create(
    {
      id: "red",
      title: "red",
      type: "normal",
      contexts: ["selection"],
    },
    contextMenusCreateCallback
  );

  chrome.contextMenus.create(
    {
      id: "grey",
      title: "grey",
      type: "normal",
      contexts: ["selection"],
    },
    contextMenusCreateCallback
  );
}

/* end: handler functions */

/* listeners */
// chrome.tabs API listens and sends messages to and from content scripts
// chrome.runtime API
// chrome.tabs.onActivated.addListener(activatedTabHandler);

// listening for a new tab opened or to a new URL typed in a tab
// chrome.tabs.
chrome.tabs.onUpdated.addListener(onUpdatedTabCallback);

// on drag end listener
// chrome.event.addListener('dragend', onDragEventHandler);

// context menu listener
// callback parameters include: (info: OnClickData, tab?: tabs.Tab)
chrome.contextMenus.onClicked.addListener(onClickContextMenusCallback);

chrome.runtime.onInstalled.addListener(createContextMenusCallback);

// listening for messages from chrome extension popup.js or contentScript.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {});

/* end: listeners */

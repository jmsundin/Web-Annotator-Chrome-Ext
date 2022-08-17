/*
background.js is the service worker for the Chrome extension
it is a separate process from the web page and shares the environment of the extension scripts.
Thus, it does not have access the DOM of the web page.

background.js can communicate with the extension through the Chrome messaging API

This script listens to and responds to events that happen in the web page and browser window
like context menu clicks, tab updates, and extension installation.
*/

import { constants } from "./constants.js";
import { Base64 } from "./base64.js";

let onUpdatedTabStatus = null;
const onUpdatedTabState = {
  unloaded: "unloaded",
  loading: "loading",
  complete: "complete",
};

let urlsAndAnnotations = {};
let urls = {}; // hashmap of url with count of annoation objs with that url
let arrayOfAnnotationObjs = [];

// setInterval(createObjOfUrlsAndAnnotations, 10000);

function createObjOfUrlsAndAnnotations() {
  let tempArray = [];
  if (arrayOfAnnotationObjs.length > 0) {
    for (let annotation of arrayOfAnnotationObjs) {
      while (urls[annotation.pageUrl]) {
        console.log(urls[annotation.pageUrl]);
        urlsAndAnnotations[annotation.pageUrl] = tempArray.push(annotation);
        annotationCountsForUrl[annotation.pageUrl]--;
      }
      console.log(JSON.stringify(urlsAndAnnotations));
    }
    return true;
  } else return false;
}

function getActiveTabUrl() {
  let queryOptions = { active: true, currentWindow: true };
  chrome.tabs.query(queryOptions, (tabs) => {
    if (tabs.length > 0) {
      let activeTab = tabs[0];
      return activeTab.url;
    }
  });
}

function getUUID() {
  return Date.now().toString(); // returns time since January 1, 1970 in milliseconds
}

function saveAnnotations(annotationObjs) {
  let encodedUrlBase64 = Base64.encode(annotationObjs.pageUrl);
  let obj = {
    [encodedUrlBase64]: annotationObjs,
  };
  chrome.storage.sync.set(obj, (response) => {
    console.log(`chrome storage sync set response: ${response}`);
  });
}

function fetchAnnotationsForUrlKey(encodedUrlBase64) {
  // url: string
  // url is stored as a string in the tab object
  chrome.storage.sync.get(encodedUrlBase64, (annotationObjsForUrl) => {

    if (Object.keys(annotationObjsForUrl).length > 0) {
      let message = {
        context: constants.context.onUpdatedTabComplete,
        action: constants.actions.addAnnotationsForUrlToDom,
        annotationsObjsForUrl: annotationObjsForUrl,
      };
      console.log(`Successfully fetched annotations: ${JSON.stringify(annotationObjsForUrl)}`);
      runPortMessagingConnection(message);
    } else {
      let url = Base64.decode(encodedUrlBase64);
      throw `No annotations exist for ${url}`;
    }
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

function onUpdatedTabCallback(tabId, changeInfo, tab) {
  if (onUpdatedTabState.unloaded == changeInfo.status) {
    onUpdatedTabStatus = onUpdatedTabState.unloaded;
  }

  if (onUpdatedTabState.loading == changeInfo.status) {
    onUpdatedTabStatus = onUpdatedTabState.loading;
  }

  
  if (onUpdatedTabState.complete == changeInfo.status) {
    onUpdatedTabStatus = onUpdatedTabState.complete;
    let encodedUrlBase64 = Base64.encode(tab.url);
    try{
      fetchAnnotationsForUrlKey(encodedUrlBase64);
    }catch(error){
      console.error(`${error}`);
    }
  }
}

function onClickContextMenusCallback(onClickData, tab) {
  if (constants.highlightColorChoices.includes(onClickData.menuItemId)) {
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
    if (!(message.annotationObj.pageUrl in urls))
      urls[message.annotationObj.pageUrl] = 1;
    else urls[message.annotationObj.pageUrl]++;

    arrayOfAnnotationObjs.push(message.annotationObj);
    console.log(`urls: ${JSON.stringify(urls)}
                annotationArray: ${JSON.stringify(arrayOfAnnotationObjs)}`);
    sendMessageAfterContextMenuClick(message);
  }
}

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

function sendMessageAfterContextMenuClick(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs.length > 0) {
      var tab = tabs[0];
      const port = chrome.tabs.connect(tab.id);
      port.postMessage(message);
      port.onDisconnect = (err) => {
        console.error("disconnected " + err);
      };
    }
  });
}

// chrome.tabs API listens and sends messages to and from content scripts
// chrome.runtime API
// chrome.tabs.onActivated.addListener(activatedTabHandler);

// listening for a new tab opened or to a new URL typed in a tab
chrome.tabs.onUpdated.addListener(onUpdatedTabCallback);

// on drag end listener
// chrome.event.addListener('dragend', onDragEventHandler);

// context menu listener
// callback parameters include: (info: OnClickData, tab?: tabs.Tab)
chrome.contextMenus.onClicked.addListener(onClickContextMenusCallback);

chrome.runtime.onInstalled.addListener(createContextMenusCallback);

// listening for messages from chrome extension popup.js or contentScript.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (constants.actions.saveAnnotations === message.action) {
    saveAnnotations(message.data);
  }
  if (constants.actions.fetchAnnotations === message.action) {
    let encodedUrlBase64 = Base64.encode(message.data.pageUrl);
    fetchAnnotationsForUrlKey(encodedUrlBase64);
  }
  sendResponse("saved annotations in background script to chrome storage");
});

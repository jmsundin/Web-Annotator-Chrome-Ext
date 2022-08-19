/*
background.js is the service worker for the Chrome extension
it is a separate process from the web page and shares the environment of the extension scripts.
Thus, it does not have access the DOM of the web page.

background.js can communicate with the extension through the Chrome messaging API

This script listens to and responds to events that happen in the web page and browser window
like context menu clicks, tab updates, and extension installation.
*/

import { Color, UserAction, EventContext } from "./constants";
import { Base64 } from "./base64";

let onUpdatedTabStatus = null;
const onUpdatedTabState = {
  unloaded: "unloaded",
  loading: "loading",
  complete: "complete",
};

const annotationObj = {
  id: null,
  highlightColor: null,
  selectionText: null,
  selectedTextRangeData: null,
  comment: null,
  pageUrl: null,
  urlTitle: null,
  srcUrl: null,
};

let dataForActiveUrl = {};
let urls = {}; // hashmap of url with count of annoation objs with that url
let dataArray = [];

// setInterval(createObjOfUrlsAndData, 10000);

function createObjOfUrlsAndData() {
  let tempArray = [];
  if (dataArray.length > 0) {
    for (let annotation of dataArray) {
      while (urls[annotation.pageUrl]) {
        console.log(urls[annotation.pageUrl]);
        dataForActiveUrl[annotation.pageUrl] = tempArray.push(annotation);
        annotationCountsForUrl[annotation.pageUrl]--;
      }
      console.log(JSON.stringify(dataForActiveUrl));
    }
    return true;
  } else return false;
}

// TODO: change this function to getActiveTab? and then return the tab.Tab object?
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

function saveData(data) {
  let encodedUrlBase64 = Base64.encode(data.pageUrl);
  let obj = {
    [encodedUrlBase64]: data,
  };
  chrome.storage.sync.set(obj, (response) => {
    console.log(`chrome storage sync set response: ${response}`);
  });
}

function fetchDataForActiveUrl(encodedUrlBase64) {
  // url: string
  // url is stored as a string in the tab object
  chrome.storage.sync.get(encodedUrlBase64, (dataForActiveUrl) => {
    if (Object.keys(dataForActiveUrl).length > 0) {
      for(let prop in dataForActiveUrl){
        let message = {
          context: constants.context.onUpdatedTabComplete,
          action: constants.actions.addDataForActiveUrlToDom,
          data: dataForActiveUrl[prop],
        };
        console.log(`Successfully fetched data: ${JSON.stringify(dataForActiveUrl)}`);
        runPortMessagingConnection(message);
      }
    } else {
      let url = Base64.decode(encodedUrlBase64);
      throw `No data exist for ${url}`;
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
      fetchDataForActiveUrl(encodedUrlBase64);
    }catch(error){
      console.error(`${error}`);
    }
  }
}

function onClickContextMenusCallback(onClickData, tab) {
  if (constants.highlightColorChoices.includes(onClickData.menuItemId)) {
    annotationObj.id = getUUID();
    annotationObj.highlightColor = onClickData.menuItemId;
    annotationObj.selectionText = onClickData.selectionText;
    annotationObj.selectedTextRange = null;
    // annotationObj.srcUrl = onClickData.srcUrl;
    annotationObj.comment = null;
    annotationObj.urlTitle = tab.title;
    annotationObj.pageUrl = onClickData.pageUrl;
    
    let message = {};
    message.context = constants.context.onUpdatedTabComplete;
    message.action = constants.actions.highlightSelectedText;
    message.data = annotationObj;
    
    // if (!(message.annotationObj.pageUrl in urls))
    //   urls[message.annotationObj.pageUrl] = 1;
    // else urls[message.annotationObj.pageUrl]++;

    // dataArray.push(message.annotationObj);
    // console.log(`urls: ${JSON.stringify(urls)}
    //             annotationArray: ${JSON.stringify(dataArray)}`);

    runPortMessagingConnection(message);
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
    if (tabs.length > 0) {
      let tab = tabs[0];
      const port = chrome.tabs.connect(tab.id);
      port.postMessage(message);
      port.onDisconnect = (err) => {
        console.error("disconnected with this error: ", err);
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
  if (constants.actions.saveData === message.action) {
    saveData(message.data);
  }
  if (constants.actions.fetchData === message.action) {
    let encodedUrlBase64 = Base64.encode(message.data.pageUrl);
    fetchDataForActiveUrl(encodedUrlBase64);
  }
  sendResponse("saved data in background script to chrome storage");
});

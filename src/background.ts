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
enum onUpdatedTabState {
  unloaded = "unloaded",
  loading = "loading",
  complete = "complete",
};

interface Message {
    context: string,
    action: string,
    data: Annotation,
};

interface Annotation {
  id: number,
  highlightColor: Color,
  selectionText: string,
  selectedTextRangeData: object,
  comment: string,
  pageUrl: string,
  urlTitle: string,
  srcUrl: string,
};

let annotationForActiveUrl: Annotation
let annotationsForActiveUrl: Array<Annotation> = [];

// setInterval(createObjOfUrlsAndData, 10000);


function getActiveTab(): chrome.tabs.Tab | undefined {
  let queryOptions = { active: true, currentWindow: true };
  chrome.tabs.query(queryOptions, (tabs) => {
    if (tabs.length > 0) {
      let activeTab = tabs[0];
      return activeTab;
    }
  });
  return;
}

function getUUID(): string {
  return Date.now().toString(); // returns time since January 1, 1970 in milliseconds
}

function saveData(annotation: Annotation): Boolean {
  let encodedUrlBase64 = Base64.encode(annotation.pageUrl);
  let data = {
    [encodedUrlBase64]: annotation,
  };
  chrome.storage.sync.set(data, (): Boolean => {
    return true;
  });
  return false;
}

function fetchDataForActiveUrl(encodedUrlBase64: string): void {
  // url: string
  // url is stored as a string in the tab object
  try{
    chrome.storage.sync.get(encodedUrlBase64, (dataForActiveUrl) => {
      if (Object.keys(dataForActiveUrl).length > 0) {
        let annotation: Annotation = {
          id: dataForActiveUrl.id,
          highlightColor: dataForActiveUrl.highlightColor,
          selectionText: dataForActiveUrl.selectionText,
          selectedTextRangeData: dataForActiveUrl.selectedTextRangeData,
          comment: dataForActiveUrl.comment,
          pageUrl: dataForActiveUrl.pageUrl,
          urlTitle: dataForActiveUrl.urlTitle,
          srcUrl: dataForActiveUrl.srcUrl,
        }
        let message: Message = {
          context: EventContext.onUpdatedTabComplete,
          action: UserAction.saveData,
          data: annotation,
        };
        console.log(`Successfully fetched data: ${JSON.stringify(dataForActiveUrl)}`);
        runPortMessagingConnection(message);
      } else {
        let url = Base64.decode(encodedUrlBase64);
        throw `No data exist for ${url}`;
      }
    });
  }catch(error){
    throw error;
  }
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

function onUpdatedTabCallback(tabId: number, changeInfo: any, tab: chrome.tabs.Tab) {
  console.log(`changeInfo: ${JSON.stringify(changeInfo)}`);
  if (onUpdatedTabState.unloaded === changeInfo.status) {
    onUpdatedTabStatus = onUpdatedTabState.unloaded;
  }
  if (onUpdatedTabState.loading === changeInfo.status) {
    onUpdatedTabStatus = onUpdatedTabState.loading;
  }
  if (onUpdatedTabState.complete === changeInfo.status) {
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

// TODO
function runPortMessagingConnection(message: Message) {
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
// TODO: implement an interface type for message to know what is being received
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (UserAction.saveData === message.action) {
    try{
      saveData(message.data);
      sendResponse("saved data in background script to chrome storage");
    }catch(error){
      sendResponse(`Save was unsuccessful with this error: ${JSON.stringify(error)}`);
    };
  }
  if (UserAction.fetchData === message.action) {
    let encodedUrlBase64: string = Base64.encode(message.data.pageUrl);
    try{
      fetchDataForActiveUrl(encodedUrlBase64);
    }catch(error){
      let activeTabUrl = getActiveTab();
      console.log(`No data to fetch for ${activeTabUrl}. Error message: ${JSON.stringify(error)}`);
    }
  }
  
});

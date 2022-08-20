/*
background.js is the service worker for the Chrome extension
it is a separate process from the web page and shares the environment of the extension scripts.
Thus, it does not have access the DOM of the web page.

background.js can communicate with the extension through the Chrome messaging API

This script listens to and responds to events that happen in the web page and browser window
like context menu clicks, tab updates, and extension installation.
*/

import {
  color,
  Annotation,
  Message,
  UserAction,
  EventContext,
  onUpdatedTabState,
} from "./constants";
import { Base64 } from "./base64";

let onUpdatedTabStatus = null;

let annotationForActiveUrl: Annotation;
let annotationsForActiveUrl: Array<Annotation> = [];

let message: Message;

// setInterval(createObjOfUrlsAndData, 10000);

function runPortMessagingConnection(message: Message | any) {
  let queryOptions = { lastFocusedWindow: true, active: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`
  // chrome.tabs.query returns a Promise object
  chrome.tabs.query(queryOptions, (tabs) => {
    if (tabs.length > 0) {
      let tab = tabs[0];
      if(!tab.id) return;
      const port = chrome.tabs.connect(tab.id);
      port.postMessage(message);
      port.onDisconnect.addListener((error): void => {
        console.error("disconnected with this error: ", error);
      });
    }
  });
  return;
}

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

function saveData(annotation: Annotation) {
  let encodedUrlBase64: string = Base64.encode(annotation.pageUrl);
  let annotationForUrl = {
    [encodedUrlBase64]: annotation,
  };

  let setDataToChromeStorage = new Promise((resolve, reject): void => {
    chrome.storage.sync.set(annotationForUrl, () => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      return resolve;
    });
  });

  setDataToChromeStorage
    .then(() => { console.log(`annotation saved for ${annotationForUrl[encodedUrlBase64].pageUrl}`); })
    .catch((response) => { console.error(response); });  
}

function fetchData(encodedUrlBase64: string, context: EventContext) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(encodedUrlBase64, (items) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      return resolve(items);
    });
  });
}

function createAnnotationObj(items: Object | any, context: EventContext){
  return new Promise((resolve) => {
    let annotation = new Annotation();
    Object.assign(annotation, items);
      message = {
        context: context,
        action: UserAction.fetchData,
        data: annotation,
      };
      console.log(`Successfully fetched data: ${JSON.stringify(annotation)}`);
      resolve(message);
    });
  };
}

function onUpdatedTabCallback(
  tabId: number,
  changeInfo: any,
  tab: chrome.tabs.Tab
) {
  let message: Message;
  let temp: Message | undefined;
  if (onUpdatedTabState.unloaded === changeInfo.status) {
    onUpdatedTabStatus = onUpdatedTabState.unloaded;
  }
  if (onUpdatedTabState.loading === changeInfo.status) {
    onUpdatedTabStatus = onUpdatedTabState.loading;
  }
  if (onUpdatedTabState.complete === changeInfo.status) {
    onUpdatedTabStatus = onUpdatedTabState.complete;
    let encodedUrlBase64 = Base64.encode(tab.url);
    let context = EventContext.onUpdatedTabComplete;

    // Promise chain to fetch and send data to content script
    // TODO: add listener and conditional for onMessage in extension popup.js to receive the annotation data
    fetchData(encodedUrlBase64, context)
      .then((items) => createAnnotationObj(items, context))
      .then((message) => runPortMessagingConnection(message))
      .catch((error) => { 
        console.error(`Attempt at getting data from chrome storage resulted in this error: ${error}`);
      });
  }
}

function onClickContextMenusCallback(
  info: chrome.contextMenus.OnClickData,
  tab: chrome.tabs.Tab | undefined
): void {
  if (!info.selectionText && !tab) return;
  let annotation: Annotation = {
    id: getUUID(),
    highlightColor: info.menuItemId,
    selectionText: info.selectionText,
    comment: "",
    pageUrl: info.pageUrl,
    urlTitle: tab?.title,
    srcUrl: info.srcUrl,
  };

  let message: Message = {
    context: EventContext.onClickContextMenuItem,
    action: UserAction.highlightSelectedText,
    data: annotation,
  };

  // if (!(message.annotationObj.pageUrl in urls))
  //   urls[message.annotationObj.pageUrl] = 1;
  // else urls[message.annotationObj.pageUrl]++;

  // dataArray.push(message.annotationObj);
  // console.log(`urls: ${JSON.stringify(urls)}
  //             annotationArray: ${JSON.stringify(dataArray)}`);

  annotationForActiveUrl = annotation; // global variable
  // save annotation into chrome storage

  saveData(annotation);
  runPortMessagingConnection(message);
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
      id: color.yellow,
      title: "yellow",
      type: "normal",
      contexts: ["selection"],
    },
    contextMenusCreateCallback
  );

  chrome.contextMenus.create(
    {
      id: color.red,
      title: "red",
      type: "normal",
      contexts: ["selection"],
    },
    contextMenusCreateCallback
  );

  chrome.contextMenus.create(
    {
      id: color.grey,
      title: "grey",
      type: "normal",
      contexts: ["selection"],
    },
    contextMenusCreateCallback
  );
  chrome.contextMenus.create(
    {
      id: color.white,
      title: "white",
      type: "normal",
      contexts: ["selection"],
    },
    contextMenusCreateCallback
  );
  chrome.contextMenus.create(
    {
      id: color.blue,
      title: "blue",
      type: "normal",
      contexts: ["selection"],
    },
    contextMenusCreateCallback
  );
  chrome.contextMenus.create(
    {
      id: color.green,
      title: "green",
      type: "normal",
      contexts: ["selection"],
    },
    contextMenusCreateCallback
  );
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
      setStorageItem(message.data);
      sendResponse("saved data in background script to chrome storage");
    } catch (error) {
      sendResponse(
        `Save was unsuccessful with this error: ${JSON.stringify(error)}`
      );
    }
  }
  if (UserAction.fetchData === message.action) {
    let encodedUrlBase64: string = Base64.encode(message.data.pageUrl);
    try {
      fetchDataForActiveUrl(encodedUrlBase64);
    } catch (error) {
      let activeTabUrl = getActiveTab();
      console.log(
        `No data to fetch for ${activeTabUrl}. Error message: ${JSON.stringify(
          error
        )}`
      );
    }
  }
});

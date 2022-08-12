/*
background.js is the service worker for the Chrome extension
it is a separate process from the web page and shares the environment of the extension scripts.
Thus, it does not have access the DOM of the web page.

background.js can communicate with the extension through the Chrome messaging API

This script listens to and responds to events that happen in the web page and browser window
like context menu clicks, tab updates, and extension installation.
*/
/* global variable declarations and assignments */

const highlightColorChoices = [
  "yellow",
  "red",
  "blue",
  "green",
  "white",
  "grey",
];
const actions = { highlightSelectedText: "highlight-selected-text" };

/* ----------- getter functions ----------------- */

function fetchAnnotationsFromChromeStorage(activeTab, callback) {
  let urlKey = activeTab.url; // url is stored as a string in tab object
  var obj = {};
  obj[keyName] = null;
  chrome.storage.sync.get(obj, function (items) {
    if (items && items[keyName]) {
      remapAnnotations(
        webUrl,
        items[keyName].annotations,
        items[keyName].labels,
        cb
      );
      return true;
    } else return false;
  });
}

// function getAnnotations(request){
//   let activeTabUrl = request.url.toString();
//   return new Promise((resolve) => {
//     chrome.storage.sync.get([activeTabUrl], (result) => {
//       resolve("Annotations for active tab url: " + result.activeTabUrl);
//     });
//   });
// }

// const fetchBookmarks = () => {
//   return new Promise((resolve) => {
//     chrome.storage.sync.get([currentVideo], (obj) => {
//       resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
//     });
//   });
// };

/* saving annotation to chrome sync */
// function saveAnnotation(spanElement){
//   let annotationUrl = spanElement.dataset.url;
//   let annotationId = spanElement.id;
//   chrome.storage.sync.set({
//     [annotationUrl]: {
//       [annotationId]: JSON.stringify(spanElement)
//     }
//   }, (result) => {
//     alert("Annotation saved: " + result.annotationUrl);
//   });
// }

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

/* message functions */

// for single messages use the below Chrome messaging API
// function sendOneTimeMessage(annotationObj) {
//   // chrome.tabs.sendMessage required parameters: tabId, message
//   // optional parameters: options, callback func
//   // use chrome.tabs API to send messages to content script
//   if (annotationObj.context === "onClickContextMenuItem") {
//     // `tab` will either be a `tabs.Tab` instance or `undefined`
//     chrome.tabs.query({ active: true , currentWindow: true }, (tabs) => {
//         let activeTab = tabs[0];
//         console.log(`in sendOneTimeMessage background.js: activeTab obj: ${JSON.stringify(activeTab)}`);
//         chrome.tabs.sendMessage(activeTab.id, annotationObj, (response) => {
//             console.log(`sendOneTimeMessage background.js response: ${JSON.stringify(response)}`);
//         });
//     });
//   }
//   if (annotationObj.context === "onUpdatedTabCallback-status-complete") {
//     // chrome.tabs.sendMessage(activeTab.id, annotationObj);
//   }
// }


// long-lived messaging connection
function runPortMessagingConnection(obj) {
  let queryOptions = { lastFocusedWindow: true, active: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`
  // chrome.tabs.query returns a Promise object
  chrome.tabs.query(queryOptions, (tabs) => {
    if (tabs && tabs.length > 0){
        let tab = tabs[0];
        //chrome.tabs.sendMessage(tab.id, json, function(response) {});
        const port = chrome.tabs.connect(tab.id);
        port.onDisconnect = (err) => { console.error('disconnected with this error: ', err) };
        port.postMessage(obj);
    };
  });
}

/* end: message functions */

/* callback handler functions */

function onUpdatedTabCallback(tabId, changeInfo, tab) {
  console.log(`onUpdatedTabCallback:
              tabId: ${tabId}
              changeInfo: ${JSON.stringify(changeInfo)}
              tab: ${JSON.stringify(tab)}`);

  if (changeInfo.status === "complete") {
    if (tab) {
      // console.log("onUpdatedTab: tabObj: " + JSON.stringify(tabObj));
      let message = {
        context: "onUpdatedTabCallback-status-complete",
        info: {
          action: null,
          highlightColor: null,
          onClickContextMenus: null,
          tab: tab,
        },
      };
    // TODO: fetch saved annotations from chrome storage when this onUpdateTabCallback function is called
    let action = "fetch-annotations-from-chrome-storage";
    runtimeRequestCallback(message, action);
    }
  }
}

function runtimeRequestCallback(message, sender, sendResponse) {
  // console.log(`runtimeRequestCallback background.js: 
  //             message obj: ${JSON.stringify(message)}
  //             sender obj: ${JSON.stringify(sender)}`);

  if (message.action === "save-annotations-to-chrome-storage"){
    let encodedUrlAsKey = btoa(message.data.url);  // btoa function encodes the url, use atob function to decode the url
    annotationId = message.data.annotationId;
    let annotationsForUrl = {};
    annotationsForUrl[encodedUrlAsKey] = {annotationId: message.data};
    chrome.storage.sync.set(annotationsForUrl, () => {
      console.log(`annotation for ${message.data.url} set to ${JSON.stringify(annotationsForUrl)}`);
    });
  }
  if (message.action === "fetch-annotations-from-chrome-storage"){
    let encodedUrlAsKey = btoa(message.data.url);
    chrome.storage.sync.get(encodedUrlAsKey, (result) => {
      console.log(`annotation: ${JSON.stringify(result)}; from: ${message.data.url}; fetched from chrome storage`);
    });
    // sendResponse("successfully retrieved annotations from chrome storage: " + success.toString());
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

function sendMessageActiveTab(obj){
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs && tabs.length > 0){
      var tab = tabs[0];
      //chrome.tabs.sendMessage(tab.id, json, function(response) {});
      const port = chrome.tabs.connect(tab.id);
      port.postMessage(obj);
      port.onDisconnect = (err) => { console.error('disconnected ' + err)};
      /*port.onMessage.addListener((response) => {
        console.error('port.onMessage response=',response);
      });*/
    }
  });
}

function onClickContextMenusCallback(onClickData, tab) {
  if (highlightColorChoices.includes(onClickData.menuItemId)) {
    let annotationObj = {
      context: "onClickContextMenuItem",
      info: {
        action: actions.highlightSelectedText,
        highlightColor: onClickData.menuItemId,
        onClickDataContextMenu: onClickData,
        tab: tab,
      },
    };
    sendMessageActiveTab(annotationObj);
    
    // chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    //   let activeTab = tabs[0];
    //   chrome.tabs.sendMessage(activeTab.id, annotationObj, (response) => {
    //     console.log(`response: ${JSON.stringify(response)}`);
    //   });
    // });
  }
}

// callback function for context menu create functions
// if error occured, chrome.runtime.lastError will include it
function contextMenusCreateCallback() {
  if(!chrome.runtime.lastError) return;
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

// listening for messages from chrome extension popup.js
chrome.runtime.onMessage.addListener(runtimeRequestCallback);

/* end: listeners */

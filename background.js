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

function getAnnotationsFromChromeStorage(activeTab, callback) {
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

function runPortMessagingConnection(obj) {
  let queryOptions = { lastFocusedWindow: true, active: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`
  let tabQueryPromise = chrome.tabs.query(queryOptions); // chrome.tabs.query returns a Promise object
  tabQueryPromise
    .then((activeTab) => {
      if (activeTab && activeTab.length > 0) {
        console.log("inside sendMessageActiveTab: tabUrl: " + activeTab.url);
        const port = chrome.tabs.connect(activeTab.id);
        port.postMessage(obj);
        port.onDisconnect = (err) => {
          console.error("disconnected", err);
        };
      }
    })
    .catch((err) => {
      console.log("in getActiveTab: error: " + err);
    });
  /*
  port.onMessage.addListener((response) => {
      console.error('port.onMessage response=',response);
    });
  */
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
      // if (message){
      //   console.log(`onUpdatedTabCallback: after message obj creation
      //                Message obj: ${JSON.stringify(message)}`);
      // }
      // sendOneTimeMessage(message);
    }
  }
}

function runtimeRequestCallback(request, sender, sendResponse) {
  console.log(`runtimeRequestCallback background.js: 
              request obj: ${JSON.stringify(request)}
              sender obj: ${JSON.stringify(sender)}`);

  // if (request.action === "get-annotations-from-chrome-storage"){
  //   let success = false;
  //   success = getAnnotationsFromChromeStorage(request, sender);
  //   sendResponse("successfully retrieved annotations from chrome storage: " + success.toString());
  // }
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
    console.log(`in onClickContextMenusCallback
                annotationObj: ${JSON.stringify(annotationObj)}`);
    // sendOneTimeMessage(annotationObj);
    // `tab` will either be a `tabs.Tab` instance or `undefined`
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, annotationObj, (response) => {
        console.log(`response: ${JSON.stringify(response)}`);
      });
    });
  }
}

// callback function for context menu create functions
// if error occured, chrome.runtime.lastError will include it
function contextMenusCreateCallback() {
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
// chrome.tabs.onUpdated.addListener(onUpdatedTabCallback);

// on drag end listener
// chrome.event.addListener('dragend', onDragEventHandler);

// context menu listener
// callback parameters include: (info: OnClickData, tab?: tabs.Tab)
chrome.contextMenus.onClicked.addListener(onClickContextMenusCallback);

chrome.runtime.onInstalled.addListener(createContextMenusCallback);

// listening for messages from chrome extension popup.js
chrome.runtime.onMessage.addListener(runtimeRequestCallback);

/* end: listeners */

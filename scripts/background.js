// background.js is the service worker for this Chrome extension
// it is a separate process from the web page, and thus does not have access
// to the web page (the DOM)
// background.js can communicate with the extension through the Chrome messaging API

/* global variable declarations and assignments */

const highlightColorChoices = [
  "yellow",
  "red",
  "blue",
  "green",
  "white",
  "grey",
];
const actions = {highlightSelectedText: "highlight-selected-text"};

/* end of global variable declarations */

/* ----------- getter functions ----------------- */

// get current tab
// function declarations are hoisted by JavaScript at runtime

// function getActiveTab() {
//   // the active tab is the one selected in a window
//   // lastFocusedWindow is the window that is being viewed (the one 'on top' of other application windows)
//   let queryOptions = {lastFocusedWindow: true, active: true };
//   // `tab` will either be a `tabs.Tab` instance or `undefined`
//   let tabQueryPromise = chrome.tabs.query(queryOptions);  // chrome.tabs.query returns a Promise object
//   tabQueryPromise.then((tab) => {
//       if (tab){
//         console.log("in getActiveTab: activeTab: " + tab);
//       }
//     })
//     .catch(err => {
//       console.log("in getActiveTab: error: " + err)
//     });

//   if (activeTab) {
//   console.log("inside getCurrentTab: " + activeTab.url);
//   return activeTab;
// }
// }

/* ----------- end of getter functions ---------- */

// for YouTube video search parameters
// const queryParameters = tab.url.split("?")[1];
// const urlParameters = URLSearchParams(queryParameters);

/* message functions */

function sendMessageActiveTab(json) {
  // currentWindow is that which code is executing
  // if the currentWindow created many tabs or windows from a single HTML file,
  // the currentWindow will be the one that the original window where that HTML file
  // made the call to tabs.query

  // The currentWindow can be different than the top-most or focused window
  // if the initial call created other windows that become the top-most or focused window
  // the queryOptions below will only retrieve one tab due to the two constraints
  // per window, only one tab will ever be `active`
  const queryOptions = { active: true, currentWindow: true };
  chrome.tabs.query(queryOptions, (tab) => {
    if (tab && tab.length > 0) {
      // for single messages use the below Chrome messaging API
      //chrome.tabs.sendMessage(tab.id, json, function(response) {});

      // for longer messaging, open a messaging port
      console.log("inside sendMessageActiveTab: tabUrl: " + tab.url);
      const port = chrome.tabs.connect(tab.id);
      port.postMessage(json);
      port.onDisconnect = (err) => {
        console.error("disconnected", err);
      };
      /*port.onMessage.addListener((response) => {
        console.error('port.onMessage response=',response);
      });*/
    }
  });
}

/* end: message functions */

/* handler functions */

function activatedTabHandler(activeTabInfo) {
  console.log(`activeTabId: ${activeTabInfo.tabId}`);
}

function onUpdatedTabHandler(tabId, changeInfo, tabInfo) {
  console.log("Updated tab: " + tabId);
  console.log("Changed attributes: ");
  console.log(changeInfo);
  console.log("New tab Info: ");
  console.log(tabInfo);
}

/* info object passed when contextMenu item is clicked
  info = { // of these the menuItemId is required
      menuItemId: string or int: the ID of the menu item that was clicked,
      pageUrl: string: The URL of the page where the menu item was clicked. This property is not set if the click occured in a context where there is no current page, such as in a launcher context menu.,
      selectionText: string: The text for the context selection, if any.,
      srcUrl: string: Will be present for elements with a 'src' URL.
    } */
function contextMenusHandler(info, tab) {
  console.log("contextMenuesHandler: menuItemId: " + info.menuItemId);
  if (highlightColorChoices.includes(info.menuItemId)) {
    sendMessageActiveTab({
      action: actions.highlightSelectedText,
      highlightColor: info.menuItemId,
      tabUrl: tab.url,
      tabTitle: tab.title,
    });
  }
}

// callback function for context menu create functions
// if error occured, chrome.runtime.lastError will include it
function contextMenusCreateCallbackHandler() {
  console.log("context menu create error: " + chrome.runtime.lastError);
}

/* end: handler functions */

/* listeners */

chrome.tabs.onActivated.addListener(activatedTabHandler);

// listening for a new tab opened or to a new URL typed in a tab
chrome.tabs.onUpdated.addListener(onUpdatedTabHandler);

chrome.contextMenus.onClicked.addListener(contextMenusHandler);

/* end: listeners */

// context menu create takes two parameters (menuItemProperties, callbackHandler)
chrome.contextMenus.create(
  {
    id: "yellow",
    title: "yellow", // (Ctrl-Shift-Y)",
    type: "normal",
    contexts: ["selection"],
  },
  contextMenusCreateCallbackHandler
);

chrome.contextMenus.create(
  {
    id: "red",
    title: "red", // (Ctrl-Shift-Y)",
    type: "normal",
    contexts: ["selection"],
  },
  contextMenusCreateCallbackHandler
);

chrome.contextMenus.create(
  {
    id: "grey",
    title: "grey", // (Ctrl-Shift-Y)",
    type: "normal",
    contexts: ["selection"],
  },
  contextMenusCreateCallbackHandler
);

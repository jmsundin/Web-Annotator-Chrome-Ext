/*
background.js is the service worker for this Chrome extension
it is a separate process from the web page, and thus does not have access
to the web page (the DOM)
background.js can communicate with the extension through the Chrome messaging API
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

/* end of global variable declarations */

/* ----------- getter functions ----------------- */

/*
get current tab
function declarations are hoisted by JavaScript at runtime
the active tab is the one selected in a window
lastFocusedWindow is the window that is being viewed (the one 'on top' of other application windows)
*/
function getActiveTab() {
  let queryOptions = { lastFocusedWindow: true, active: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`
  let tabQueryPromise = chrome.tabs.query(queryOptions); // chrome.tabs.query returns a Promise object
  tabQueryPromise
    .then((activeTab) => {
      if (activeTab) {
        console.log(
          "getActiveTab: activeTab JSON string: " + JSON.stringify(activeTab)
        );
        return activeTab;
      }
    })
    .catch((err) => {
      console.log("in getActiveTab: error: " + err);
    });
}

/* ----------- end of getter functions ---------- */
/*
  for YouTube video search parameters
 const queryParameters = tab.url.split("?")[1];
 const urlParameters = URLSearchParams(queryParameters);


  currentWindow is that which code is executing
  if the currentWindow created many tabs or windows from a single HTML file,
  the currentWindow will be the one that the original window where that HTML file
  made the call to tabs.query

  The currentWindow can be different than the top-most or focused window
  if the initial call created other windows that become the top-most or focused window
  the queryOptions below will only retrieve one tab due to the two constraints
  per window, only one tab will ever be `active`

  */
/* message functions */

// for single messages use the below Chrome messaging API
function sendOneTimeMessage(message) {
  // chrome.tabs.sendMessage required parameters: tabId, message
  // optional parameters: options, callback func
  if (message.context === "onUpdatedTab") {
    chrome.tabs.sendMessage(message.info.tabId, message.info);
  }
  if (message.context === "contextMenuItem") {
    chrome.tabs.sendMessage(message.info.tabId, message.info);
  }
}

// long-lived messaging connection
function runPortMessagingConnection(obj) {
  let activeTab = getActiveTab();
  if (activeTab && activeTab.length > 0) {
    console.log("inside sendMessageActiveTab: tabUrl: " + tab.url);
    const port = chrome.tabs.connect(tab.id);
    port.postMessage(obj);
    port.onDisconnect = (err) => {
      console.error("disconnected", err);
    };

    /*port.onMessage.addListener((response) => {
      console.error('port.onMessage response=',response);
    });*/
  }
}

/* end: message functions */

/* handler functions */

function onUpdatedTab(tabId, changeInfo, tab) {
  if (tab) {
    // console.log("onUpdatedTab: tabObj: " + JSON.stringify(tabObj));
    let message = {
      context: "onUpdatedTab",
      info: {
        action: null,
        highlightColor: null,
        onClickContextMenus: null,
        tabId: tabId,
        tab: tab,
        changeInfo: changeInfo,
      },
    };
    sendOneTimeMessage(message);
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
function onClickContextMenus(info, tab) {
  if (highlightColorChoices.includes(info.menuItemId)) {
    let message = {
      context: "contextMenuItem",
      info: {
        action: actions.highlightSelectedText,
        highlightColor: info.menuItemId,
        onClickDataContextMenu: info,
        tabId: tab.id,
        tab: tab,
        changeInfo: null,
      },
    };
    sendOneTimeMessage(message);
  }
}

// callback function for context menu create functions
// if error occured, chrome.runtime.lastError will include it
function contextMenusCreateCallback() {
  console.log("context menu create error: " + chrome.runtime.lastError);
}

function createContextMenus() {
  // context menu create takes two parameters (menuItemProperties, callbackHandler)
  // these menu items will only show in the context menu with the context of selection of text
  chrome.contextMenus.create(
    {
      id: "yellow",
      title: "yellow", // (Ctrl-Shift-Y)",
      type: "normal",
      contexts: ["selection"],
    },
    contextMenusCreateCallback
  );

  chrome.contextMenus.create(
    {
      id: "red",
      title: "red", // (Ctrl-Shift-Y)",
      type: "normal",
      contexts: ["selection"],
    },
    contextMenusCreateCallback
  );

  chrome.contextMenus.create(
    {
      id: "grey",
      title: "grey", // (Ctrl-Shift-Y)",
      type: "normal",
      contexts: ["selection"],
    },
    contextMenusCreateCallback
  );
}

/* end: handler functions */

/* listeners */

// chrome.tabs.onActivated.addListener(activatedTabHandler);

// listening for a new tab opened or to a new URL typed in a tab
chrome.tabs.onUpdated.addListener(onUpdatedTab);

// on drag end listener
// chrome.event.addListener('dragend', onDragEventHandler);

// context menu listener
// callback parameters include: (info: OnClickData, tab?: tabs.Tab)
chrome.contextMenus.onClicked.addListener(onClickContextMenus);

chrome.runtime.onInstalled.addListener(createContextMenus);

/* end: listeners */

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

function getActiveTab() {
  let queryOptions = { lastFocusedWindow: true, active: true };
  let tabQueryPromise = chrome.tabs.query(queryOptions);
  tabQueryPromise
    .then((activeTab) => {
      if (activeTab) {
        return activeTab;
      }
    })
    .catch((err) => {
      console.log("in getActiveTab: error: " + err);
    });
}

/* ----------- end of getter functions ---------- */


/* message functions */


function sendOneTimeMessage(message) {
  if (message.context === "onUpdatedTab") {
    chrome.tabs.sendMessage(message.info.tabId, message.info);
  }
  if (message.context === "contextMenuItem") {
    chrome.tabs.sendMessage(message.info.tabId, message.info);
  }
}

function runPortMessagingConnection(obj) {
  let activeTab = getActiveTab();
  if (activeTab && activeTab.length > 0) {
    console.log("inside sendMessageActiveTab: tabUrl: " + tab.url);
    const port = chrome.tabs.connect(tab.id);
    port.postMessage(obj);
    port.onDisconnect = (err) => {
      console.error("disconnected", err);
    };
  }
}

/* end: message functions */

/* handler functions */

function onUpdatedTab(tabId, changeInfo, tab) {
  if (tab) {
    
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

function contextMenusCreateCallback() {
  console.log("context menu create error: " + chrome.runtime.lastError);
}

function createContextMenus() {
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

chrome.tabs.onUpdated.addListener(onUpdatedTab);
chrome.contextMenus.onClicked.addListener(onClickContextMenus);
chrome.runtime.onInstalled.addListener(createContextMenus);

/* end: listeners */

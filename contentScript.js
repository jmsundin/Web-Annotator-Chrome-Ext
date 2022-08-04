// The content-script loads JavaScript in the context of the web page
// So this script has the search function for the user search input/query
// and listens to the background.js service worker for any messages
// which will trigger any content script functions here

/* global variable declarations and assignments */
// let signedin = false;
let forecolor = "#000000";
let currentColor = "yellow";
let hoverColor = "lightgray"; //'pink'
let hoverElement = null;
let lastHighlight = null;
let leftMark = "<<"; //'&ldquo;'
let rightMark = ">>"; //'&rdquo;'
let lenquote = rightMark.length; //2;
let googleColors = [];
googleColors["yellow"] = "yellow";
googleColors["red"] = "#ff9999";
googleColors["blue"] = "#0df"; //'lightblue';
googleColors["green"] = "#99ff99";
googleColors["white"] = "transparent";
let notRemapped = [];

// highlighted elements in page
let highlightedElements = [];

// div text content on the web page that matches search input
let textChunksWithSearchString = [];

// get assets in your chrome extension directory
function getChromeExtensionAssets() {
  // chrome.runtime.getURL("./assets/file-name");
}

/* search functions */

// a declared function can be `hoisted` to the top of this file at runtime and thus can be called anywhere in the file
function searchDOM(searchString) {
  for (const div of document.querySelectorAll("div")) {
    console.log(div);
    if (div.textContent.includes(searchString)) {
    }
    textChunksWithSearchString.push(div.innerHTML);
  }
}

function getUUID() {
  return Date.now().toString(); // returns time since January 1, 1970 in milliseconds
}

// called from highlightSelectedText
function addSpanElementToDocument(spanElement) {
  if (window.getSelection) {
    let selection = window.getSelection();
    if (selection.rangeCount) {
      let selectedTextRange = selection.getRangeAt(0).cloneRange();
      // surroundContents method moves the contents of the selected range into the new spanElement
      // placing the new spanElement Node at the start of the range
      // the new boundaries of the range include the new spanElement Node added
      selectedTextRange.surroundContents(spanElement);
      // removing the contents of the original selectedText range
      selection.removeAllRanges();
      // then adding the cloned contents with the new spanElement into the original selection
      selection.addRange(selectedTextRange);
    }
  }
}

/* highlight the selection */

function highlightSelectedText(annotationObj) {
  // create a new span element with class annotation-highlight and
  // requested color from the context menu
  let spanElement = document.createElement("span");
  spanElement.id = getUUID(); // id property is a string
  spanElement.className = "annotation-highlight";
  spanElement.style.backgroundColor = annotationObj.info.highlightColor;
  spanElement.dataset.url = annotationObj.info.tab.url;
  spanElement.dataset.comment = "";
  console.log(`inside highlightSelectedText spanElement: ${spanElement.toString()}`);
  addSpanElementToDocument(spanElement);

  // check if new spanElement was successfully added to DOM using the UUID of the element
  // if successful, sync new annotation to storage
  if (document.getElementById(spanElement.id)) {
    highlightedElements.push(spanElement); // global value of highlighted elements for a session
    // TODO: send message to background.js to save annotation to Chrome sync storage
    // saveAnnotation(spanElement);
  }

  // this gets the highlighted/selected text anchor node from the window object
  // let selectedTextAnchorNode = window.getSelection().anchorNode;

  // let selectionObj = window.getSelection();
  // let selectedTextType = selectionObj.type;
  // let selectedTextRange = selectionObj.getRangeAt(0);
  // let selectedTextAnchorNode = selectionObj.anchorNode;

  // console.log(`selectectedTextType: ${selectedTextType} \n
  //            selectedTextRange: ${selectedTextRange} \n
  //            selectedTextAnchorNodeName: ${selectedTextAnchorNode.nodeName}`);

  // the onClickDataContextMenu obj in the request obj has a selectionText key
  // let selectedText = request.onClickDataContextMenu.selectionText;
}

/* messaging between background.js (service worker) and content-script.js */

// TODO: implement
// function oneTimeMessageReceiver(request, sender, sendResponse) {
//   console.log(`in oneTimeMessageReceiver contentScript:
//               request obj: ${JSON.stringify(request)}
//               sender obj: ${JSON.stringify(sender)}`);

  // if (request.context === "onClickContextMenuItem"){
  //   if (request.info.action === "highlight-selected-text") {
  //     highlightSelectedText(request);
  //   }
  // }
  // if (request.context === "onUpdatedTabCallback-status-complete"){
  //   // TODO: implement in when this is the context from background.js
  // }
  // if (request.action === "get-annotations"){
  //   alert(await getAnnotations(request));
  // }
// }

function longLivedPortMessageReceiver(request, sender, sendResponse) {
  console.log("inside the contentScriptCallback");
  if (request.action === "highlight-selected-text") {
    highlightSelectedText(request);
  }
}
/* end of messaging callback functions */

/* listeners */

// context menu global event callback function
// https://developer.mozilla.org/en-US/docs/Web/API/Element/contextmenu_event

/* message listeners */

// chrome.tabs.onMessage listens for other content scripts sending messages to this content script
// chrome.tabs.onMessage.addListener(function(message, sender, sendResponse){
//   console.log(`in contentScript chrome.tabs.onMessage Listener:
//               request obj: ${JSON.stringify(message)}
//               sender obj: ${JSON.stringify(sender)}`);
// });

// one time messaging listener for extension processes sending messages to this content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(`in contentScript chrome.runtime.onMessage Listener:
              request obj: ${JSON.stringify(message)}
              sender obj: ${JSON.stringify(sender)}`);
              /*
              request obj: {
                "context":"onClickContextMenuItem",
                "info":{
                  "action":"highlight-selected-text",
                  "highlightColor":"yellow",
                  "onClickDataContextMenu":{
                    "editable":false,
                    "frameId":0,
                    "menuItemId":"yellow",
                    "pageUrl":"https://developer.chrome.com/docs/extensions/mv3/messaging/",
                    "selectionText":"Sending a request from the extension to a content script looks very similar"},
                    "tab":{
                      "active":true,
                      "audible":false,
                      "autoDiscardable":true,
                      "discarded":false,
                      "favIconUrl":"https://developer.chrome.com/images/meta/favicon-32x32.png",
                      "groupId":-1,
                      "height":734,
                      "highlighted":true,
                      "id":1374,
                      "incognito":false,
                      "index":4,
                      "mutedInfo":{
                        "muted":false
                      },
                      "pinned":false,
                      "selected":true,
                      "status":"complete",
                      "title":"Message passing - Chrome Developers",
                      "url":"https://developer.chrome.com/docs/extensions/mv3/messaging/",
                      "width":1440,
                      "windowId":681
                    }
                  }
                }
              sender obj: {
                "id":"mohidjhnipldcfhkbolgoggbbemaljih",
                "origin":"null"
              }
              */

  highlightSelectedText(message);
});

// long-lived message port connection
// chrome.runtime.onConnect.addListener((port) => {
//   port.onMessage.addListener(longLivedPortMessageReceiver);
// });
/* end of message listeners */

// sending messages from contentScript
chrome.runtime.sendMessage(
  (message = { action: "load-annotations-from-chrome-storage" }),
  function callbackResponse(response) {
    console.log(`in contentScript chrome.runtime.sendMessage:
              response obj: ${JSON.stringify(response)}`);
  }
);

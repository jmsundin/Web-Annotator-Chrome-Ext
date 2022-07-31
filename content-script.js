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

// called from highlightSelectedText
function addSpanElementToDocument(spanElement) {
  if(window.getSelection) {
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

function highlightSelectedText(request) {
  // create a new span element with class annotation-highlight and 
  // requested color from the context menu
  let spanElement = document.createElement("span");
  spanElement.className = "annotation-highlight";
  spanElement.style.backgroundColor = highlightColor;

  addSpanElementToDocument(spanElement);

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

function oneTimeMessageReceiver(request, sender, sendResponse) {
  // console.log("request obj: " + JSON.stringify(request));
  // console.log("sender obj: " + JSON.stringify(sender));

  if (request.action === "highlight-selected-text") {
    highlightSelectedText(request);
  }
}

// function longLivedPortMessageReceiver(request, sender, sendResponse) {
//   console.log("inside the contentScriptCallback");
//   if (request.action === "highlight-selected-text") {
//     highlightSelection(request);
//   }
// }
/* end of messaging callback functions */

/* listeners */

// context menu global event callback function
// https://developer.mozilla.org/en-US/docs/Web/API/Element/contextmenu_event

/* message listeners */
// one time messaging listener
chrome.runtime.onMessage.addListener(oneTimeMessageReceiver);

// long-lived message port connection
chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(longLivedPortMessageReceiver);
});
/* end of message listeners */

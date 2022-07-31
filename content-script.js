let forecolor = "#000000";
let currentColor = "yellow";
let hoverColor = "lightgray";
let hoverElement = null;
let lastHighlight = null;
let leftMark = "<<";
let rightMark = ">>";
let lenquote = rightMark.length;
let googleColors = [];
googleColors["yellow"] = "yellow";
googleColors["red"] = "#ff9999";
googleColors["blue"] = "#0df";
googleColors["green"] = "#99ff99";
googleColors["white"] = "transparent";
let notRemapped = [];
let highlightedElements = [];
let textChunksWithSearchString = [];


function getChromeExtensionAssets() {
  // chrome.runtime.getURL("./assets/file-name");
}


/* search functions */

function searchDOM(searchString) {
  for (const div of document.querySelectorAll("div")) {
    console.log(div);
    if (div.textContent.includes(searchString)) {
    }
    textChunksWithSearchString.push(div.innerHTML);
  }
}

function addSpanElementToDocument(spanElement) {
  if(window.getSelection) {
    let selection = window.getSelection();
    if (selection.rangeCount) {
      let selectedTextRange = selection.getRangeAt(0).cloneRange();
      selectedTextRange.surroundContents(spanElement);
      selection.removeAllRanges();
      selection.addRange(selectedTextRange);
    }
  }
}

/* end of search functions */

/* highlight the selection */

function highlightSelectedText(request) {
  let spanElement = document.createElement("span");
  spanElement.className = "annotation-highlight";
  spanElement.style.backgroundColor = highlightColor;
  addSpanElementToDocument(spanElement);
}

/* messaging between background.js (service worker) and content-script.js */

function oneTimeMessageReceiver(request, sender, sendResponse) {
  if (request.action === "highlight-selected-text") {
    highlightSelectedText(request);
  }
}
/* end of messaging callback functions */


/* listeners */

/* message listeners */
chrome.runtime.onMessage.addListener(oneTimeMessageReceiver);

// long-lived message port connection
chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(longLivedPortMessageReceiver);
});
/* end of message listeners */

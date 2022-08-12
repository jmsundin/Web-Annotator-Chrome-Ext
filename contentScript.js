/*
The content-script loads JavaScript in the context of the web page
This script has the search function to search the DOM
This script istens to the extension (popup script and background.js service worker scripts)

This script contains the DOM highlight functionality
This script contains any UI that is not the extension popup UI
*/


/* global variable declarations and assignments */
// let signedin = false;
let forecolor = "#000000";
let currentColor = "yellow";
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

let annotationPopover = null;
let hoverColor = "lightgray"; //'pink'
let hoverElement = null;
// highlighted elements in page
let highlightedElements = [];

// div text content on the web page that matches search input
let textChunksWithSearchString = [];

let url = document.location.href;

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

function saveAnnotation(spanElement){
  // spanElement.id = getUUID(); // id property is a string
  // spanElement.className = "annotation-highlight";
  // spanElement.style.backgroundColor = annotationObj.info.highlightColor;
  // spanElement.dataset.url = annotationObj.info.tab.url;
  // spanElement.dataset.comment = "";
  
  let action = "save-annotations-to-chrome-storage";
  let annotationObj = {
    annotationId: spanElement.id,
    className: spanElement.className,
    color: spanElement.style.backgroundColor,
    url: spanElement.dataset.url,
    comment: spanElement.dataset.comment
  }

  contentScriptSendMessage(action, annotationObj);
}

function addAnnotationElementsToDom(){
  let action = "fetch-annotations-from-chrome-storage";
  let response = contentScriptSendMessage(action, annotationObj = null);
  // TODO: make sure response object is a span element
  addSpanElementToDom(response);
}

function loadAnnotationsFromUrlIntoPopover(){
  for (let annotation of highlightedElements){
    // spanElement.id = getUUID(); // id property is a string
    // spanElement.className = "annotation-highlight";
    // spanElement.style.backgroundColor = annotationObj.info.highlightColor;
    // spanElement.dataset.url = annotationObj.info.tab.url;
    // spanElement.dataset.comment = "";
    
    // TODO: create a copy of the highlighted element and append to annotationPopover
    annotationPopover.appendChild(annotationCopy);
  }
}

function dragElement(div) {
  let draggedDiv = div;
  let left = 0;
  let top = 0;
  draggedDiv
    .querySelector("#dragheader")
    .addEventListener("mousedown", dragMouseDown);

  function dragMouseDown(event) {
    event.preventDefault();
    let rect = draggedDiv.getBoundingClientRect();
    left = event.clientX - rect.left;
    top = event.clientY - rect.top;
    document.addEventListener("mouseup", closeDragElement);
    document.addEventListener("mousemove", elementDrag);
  }

  function elementDrag(event) {
    event.preventDefault();
    let x = event.clientX;
    let y = event.clientY;
    draggedDiv.style.right = "unset";
    draggedDiv.style.bottom = "unset";
    let draggedWidth = draggedDiv.offsetWidth + 24;
    let draggedHeight = draggedDiv.offsetHeight + 8;
    let newleft = x - left;
    let newtop = y - top;
    if (newleft < 8) newleft = 8;
    if (newleft > window.innerWidth - draggedWidth)
      newleft = window.innerWidth - draggedWidth;
    if (newtop < 8) newtop = 8;
    if (newtop > window.innerHeight - draggedHeight)
      newtop = window.innerHeight - draggedHeight;
    draggedDiv.style.left = newleft + "px";
    draggedDiv.style.top = newtop + "px";
  }
  function closeDragElement(event) {
    document.removeEventListener("mouseup", closeDragElement);
    document.removeEventListener("mousemove", elementDrag);
  }
}

function createAnnotationPopover() {
  if (annotationPopover === null) {
    annotationPopover = document.createElement("div");
    annotationPopover.id = "annotationPopover";
    annotationPopover.style.width = "400px";
    annotationPopover.style.height = "300px";
    annotationPopover.style.userSelect = "none";
    annotationPopover.style.display = "block";
    annotationPopover.style.position = "fixed";
    annotationPopover.style.zIndex = 200000;
    annotationPopover.style.margin = "0px";
    annotationPopover.style.userSelect = "none";
    annotationPopover.style.fontFamily = '"avenir next",Helvetica';
    annotationPopover.style.right = "8px";
    annotationPopover.style.bottom = "8px";
    annotationPopover.style.borderRadius = "8px";
    annotationPopover.style.boxShadow = "0 0 2px black";
    annotationPopover.style.color = "black";
    annotationPopover.textContent = "";
    annotationPopover.style.textAlign = "center";
    //annotationPopover.style.cursor = 'pointer';

    annotationPopover.style.fontSize = "14px";
    annotationPopover.style.fontWeight = "bold";
    annotationPopover.style.color = "black";
    annotationPopover.style.backgroundColor = "#E3E3E3";
    //annotationPopover.style.borderRadius = '32px';
    annotationPopover.style.padding = "8px 16px";

    let dragheaderPopover = document.createElement("div");
    dragheaderPopover.id = "dragheader";
    dragheaderPopover.style.textAlign = "center";
    dragheaderPopover.style.cursor = "move";
    dragheaderPopover.style.fontSize = "16px";
    dragheaderPopover.style.backgroundColor = "#C8CACB";
    dragheaderPopover.textContent = "Sifter Annotator";
    annotationPopover.appendChild(dragheaderPopover);
    var annotationPopoverCaption = document.createElement("div");
    annotationPopoverCaption.addEventListener("mousedown", (event) =>
      sifterNextHighlight(event)
    );
    annotationPopoverCaption.title = "Click to navigate in highlights";
    annotationPopoverCaption.id = "annotationPopoverCaption";
    annotationPopoverCaption.style.cursor = "pointer";
    annotationPopoverCaption.style.userSelect = "none";
    annotationPopoverCaption.style.webkitUserSelect = "none";
    annotationPopoverCaption.textContent = "";
    annotationPopover.appendChild(annotationPopoverCaption);

    // var highlightsnotfound = document.createElement('div');
    // highlightsnotfound.style.color = '#a22';
    // highlightsnotfound.style.cursor = 'pointer';
    // highlightsnotfound.addEventListener('click',showNotFound);
    // highlightsnotfound.title = 'Click to show missing highlights';
    // highlightsnotfound.id = 'highlightsnotfound';
    // annotationPopover.appendChild(highlightsnotfound);

    // var highlightsnotfoundtext = document.createElement('div');
    // highlightsnotfoundtext.style.color = '#a22';
    // highlightsnotfoundtext.style.display = 'none';
    // highlightsnotfoundtext.id = 'highlightsnotfoundtext';
    // annotationPopover.appendChild(highlightsnotfoundtext);

    /*var charactersleft = document.createElement('div');
    charactersleft.style.color = '#000';
    charactersleft.style.fontSize = '11px';
    charactersleft.style.cursor = 'pointer';
    charactersleft.title = 'Number of total characters used for this page in Google Bookmarks, out of 2048 possible';
    charactersleft.addEventListener('click',function () { alert(charactersUsed + ' characters used out of 2048 allowed by Google Bookmarks for this page')},false);
    charactersleft.style.display = 'block';
    charactersleft.id = 'charactersleft';
    annotationPopover.appendChild(charactersleft);*/

    let close = document.createElement("div");
    close.textContent = "✕";
    close.style.position = "absolute";
    close.style.top = 0;
    close.style.left = 0;
    close.style.margin = "4px";
    close.style.fontSize = "12px";
    close.style.padding = "4px";
    close.style.color = "black";
    close.backgroundColor = "#C8CACB";
    close.style.cursor = "pointer";
    close.addEventListener(
      "click",
      function () {
        annotationPopover.style.display = "none";
      },
      false
    );
    annotationPopover.appendChild(close);
    document.body.appendChild(annotationPopover);
    dragElement(annotationPopover);
  }
}


// called from highlightSelectedText
function addSpanElementToDom(spanElement) {
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
  console.log(
    `inside highlightSelectedText spanElement: ${spanElement.toString()}`
  );
  addSpanElementToDom(spanElement);

  // check if new spanElement was successfully added to DOM using the UUID of the element
  // if successful, sync new annotation to storage
  if (document.getElementById(spanElement.id)) {
    highlightedElements.push(spanElement); // global value of highlighted elements for a session
    // TODO: send message to background.js to save annotation to Chrome sync storage
    saveAnnotation(spanElement);
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

function sifterNextHighlight(event) {
  // prevent text selection
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  var highlights = document.getElementsByClassName("annotation-highlight");
  if (highlights.length == 0) return;
  currentHighlight = currentHighlight % highlights.length;
  // updateAnnotationPopoverCaption();
  let h = highlights[currentHighlight];
  h.style.transition = "opacity 0.3s ease-in-out";
  h.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
  h.style.opacity = 0.2;
  currentHighlight += 1;
  setTimeout(function () {
    h.style.opacity = 1.0;
  }, 300);
}

/* messaging between background.js (service worker) and content-script.js */

// TODO: implement oneTimeMessageReceiver
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
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   console.log(`in contentScript chrome.runtime.onMessage Listener:
//               request obj: ${JSON.stringify(message)}
//               sender obj: ${JSON.stringify(sender)}`);
//   /*
//               request obj: {
//                 "context":"onClickContextMenuItem",
//                 "info":{
//                   "action":"highlight-selected-text",
//                   "highlightColor":"yellow",
//                   "onClickDataContextMenu":{
//                     "editable":false,
//                     "frameId":0,
//                     "menuItemId":"yellow",
//                     "pageUrl":"https://developer.chrome.com/docs/extensions/mv3/messaging/",
//                     "selectionText":"Sending a request from the extension to a content script looks very similar"},
//                     "tab":{
//                       "active":true,
//                       "audible":false,
//                       "autoDiscardable":true,
//                       "discarded":false,
//                       "favIconUrl":"https://developer.chrome.com/images/meta/favicon-32x32.png",
//                       "groupId":-1,
//                       "height":734,
//                       "highlighted":true,
//                       "id":1374,
//                       "incognito":false,
//                       "index":4,
//                       "mutedInfo":{
//                         "muted":false
//                       },
//                       "pinned":false,
//                       "selected":true,
//                       "status":"complete",
//                       "title":"Message passing - Chrome Developers",
//                       "url":"https://developer.chrome.com/docs/extensions/mv3/messaging/",
//                       "width":1440,
//                       "windowId":681
//                     }
//                   }
//                 }
//               sender obj: {
//                 "id":"mohidjhnipldcfhkbolgoggbbemaljih",
//                 "origin":"null"
//               }
//               */

//   highlightSelectedText(message);
//   createAnnotationPopover();
// });

// long-lived message port connection
chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((message) => {
    // annotationObj = {
    //   context: "onClickContextMenuItem",
    //   info: {
    //     action: actions.highlightSelectedText,
    //     highlightColor: onClickData.menuItemId,
    //     onClickDataContextMenu: onClickData,
    //     tab: tab,
    //   },
    highlightSelectedText(message);
    createAnnotationPopover();
    loadAnnotationsFromUrlIntoPopover();
  });
});
/* end of message listeners */

// sending messages from contentScript
function contentScriptSendMessage(action, message){
  // message = {
  //   annotationId: spanElement.id,
  //   className: spanElement.className,
  //   color: spanElement.style.backgroundColor,
  //   url: spanElement.dataset.url,
  //   comment: spanElement.dataset.comment
  // }
  // alert(JSON.stringify(message));
  
  if (action === "save-annotations-to-chrome-storage"){
    chrome.runtime.sendMessage({action: action, data: message}, 
      (response) => {
      if (!response) return;
      console.log(`in contentScript chrome.runtime.sendMessage: response obj: ${JSON.stringify(response)}`);
    });
  }
  if (action === "fetch-annotations-from-chrome-storage"){
    chrome.runtime.sendMessage({action: action, data: message}, 
      (response) => {
      if (response) return response;
      else console.log(`in contentScript chrome.runtime.sendMessage: response obj: ${JSON.stringify(response)}`);
    });
  }

}


/*
The content-script loads JavaScript in the context of the web page
This script has the search function to search the DOM
This script istens to the extension (popup script and background.js service worker scripts)

This script contains the DOM highlight functionality
This script contains any UI that is not the extension popup UI
*/

/* global variable declarations and assignments */
enum Color {
  yellow = "yellow",
  red = "red",
  blue = "blue",
  green = "green",
  white = "white",
  grey = "grey"
};

enum EventContext {
  onUpdatedTabComplete = "on-updated-tab-complete",
  onClickContextMenuItem = "on-click-context-menu-item",
  onClickBrowserActionIcon = "on-click-browser-action-icon"
}

enum UserAction {
  highlightSelectedText = "highlight-selected-text",
  saveData = "save-data",
  fetchData = "fetch-data"
}

let sifterWebPagePopover = null;

// div text content on the web page that matches search input
let textChunksWithSearchString = [];

// get assets in your chrome extension directory
function getChromeExtensionAssets() {
  // chrome.runtime.getURL("./assets/file-name");
}

// let annotationObjsForUrlExist = setInterval(doAnnotationObjsForUrlExist, 10000);

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

function getActiveTabUrl() {
  let queryOptions = { active: true, currentWindow: true };
  chrome.tabs.query(queryOptions, (tabs) => {
    try {
      let activeTab = tabs[0];
      return activeTab.url;
    } catch(error){
      console.error(`getting active tab url error: ${error}`);
    }
  });
}

function encodeUrlBase64(url) {
  return window.btoa(url);
}

function decodeBase64Url(encodedUrlBase64) {
  return window.atob(encodedUrlBase64);
}

function getWindowSelectionRange(){
  if (window.getSelection) {
    let selection = window.getSelection();
    if (selection.rangeCount) {
      return selection.getRangeAt(0).cloneRange(); // returns a Range
    }
  }
}

function getSelectionRangeData(range){
  // TODO: implement getSelectionRangeData
  
}

function findSelectionRangeFromStoredData(){
  // TODO: implement findSelectionRangeFromStoredData
  let selectors = " ";
  let nodeList = document.querySelectorAll(selectors);
  let arrayOfNodesFromRange = Array.from(nodeList);
}

// TODO: add this function into addDataForUrlIntoPopover()
function onClickAddComment() {
  let textInput = document.getElementById("input_text").value;
  let commentElement = document.getElementById("comment_text");
  commentElement.innerText = textInput;
}

function addDataForUrlIntoPopover(annotation) {
  if (sifterWebPagePopover && annotation) {
    let annotationElement = document.createElement("div");
    annotationElement.className = "sifter-annotation";
    annotationElement.innerHTML = annotation.selectionText;

    let annotationCommentInput = document.createElement("input");
    annotationCommentInput.setAttribute("type", "input");
    annotationCommentInput.setAttribute("placeholder", "Add a comment");

    sifterWebPagePopover.appendChild(annotationElement);
    sifterWebPagePopover.appendChild(annotationCommentInput);

    let commentInput = document.createElement("input");
    commentInput.setAttribute("id", "input_text");
    commentInput.setAttribute("type", "text");
    commentInput.setAttribute("placeholder", "Add a comment");

    let commentSubmit = document.createElement("button");
    commentSubmit.setAttribute("onclick", "onClickAddComment()");
    commentSubmit.innerHTML = "Add";

    let commentElement = document.createElement("p");
    commentElement.setAttribute("id", "comment_text");

    document.body.appendChild(commentInput);
    document.body.appendChild(commentSubmit);
    document.body.appendChild(commentElement);
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

/*
CreateSifterWebPagePopover is called when span element annotation is added to the DOM
*/
function createSifterWebPagePopover() {
  if (sifterWebPagePopover === null) {
    sifterWebPagePopover = document.createElement("div");
    sifterWebPagePopover.id = "sifterWebPagePopover";
    sifterWebPagePopover.style.width = "400px";
    sifterWebPagePopover.style.height = "300px";
    sifterWebPagePopover.style.userSelect = "none";
    sifterWebPagePopover.style.display = "block";
    sifterWebPagePopover.style.position = "fixed";
    sifterWebPagePopover.style.zIndex = 200000;
    sifterWebPagePopover.style.margin = "0px";
    sifterWebPagePopover.style.userSelect = "none";
    sifterWebPagePopover.style.fontFamily = '"avenir next",Helvetica';
    sifterWebPagePopover.style.right = "8px";
    sifterWebPagePopover.style.bottom = "8px";
    sifterWebPagePopover.style.borderRadius = "8px";
    sifterWebPagePopover.style.boxShadow = "0 0 2px black";
    sifterWebPagePopover.style.color = "black";
    sifterWebPagePopover.textContent = "";
    sifterWebPagePopover.style.textAlign = "center";

    sifterWebPagePopover.style.fontSize = "14px";
    sifterWebPagePopover.style.fontWeight = "bold";
    sifterWebPagePopover.style.color = "black";
    sifterWebPagePopover.style.backgroundColor = "#E3E3E3";
    sifterWebPagePopover.style.padding = "8px 16px";

    let dragheaderPopover = document.createElement("div");
    dragheaderPopover.id = "dragheader";
    dragheaderPopover.style.textAlign = "center";
    dragheaderPopover.style.cursor = "move";
    dragheaderPopover.style.fontSize = "16px";
    dragheaderPopover.style.backgroundColor = "#C8CACB";
    dragheaderPopover.textContent = "Sifter Annotator";
    sifterWebPagePopover.appendChild(dragheaderPopover);
    var sifterPopoverCaption = document.createElement("div");
    sifterPopoverCaption.addEventListener("mousedown", (event) =>
      sifterNextHighlight(event)
    );
    sifterPopoverCaption.title = "Click to navigate in highlights";
    sifterPopoverCaption.id = "sifterPopoverCaption";
    sifterPopoverCaption.style.cursor = "pointer";
    sifterPopoverCaption.style.userSelect = "none";
    sifterPopoverCaption.textContent = "";
    sifterWebPagePopover.appendChild(sifterPopoverCaption);

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
    close.addEventListener("click", () => {
        sifterWebPagePopover.style.display = "none";
      },
      false
    );
    sifterWebPagePopover.appendChild(close);
    document.body.appendChild(sifterWebPagePopover);
    dragElement(sifterWebPagePopover);
  }
}

function addSpanElementToDom(selectedTextRange, spanElement){
  if(!selectedTextRange) return;
  let documentFragment = selectedTextRange.extractContents();
  spanElement.appendChild(documentFragment);
  selectedTextRange.insertNode(spanElement);
}


function addDataForUrlToDom(data) {
  let spanElement = null;
  try {
    spanElement = createSpanElement(data);
  }catch(error) {
    console.error(`creating span element error: ${error}`);
  }
  try {
    if (spanElement) addSpanElementToDom(data.selectedTextRange, spanElement);
  }catch(error){
    console.error(`adding span element to DOM error: ${error}`);
  }
}

function createSpanElement(annotation) {
  let spanElement = document.createElement("span");
  spanElement.id = annotation.id; // id: string
  spanElement.className = "sifter-annotation";
  spanElement.style.backgroundColor = annotation.highlightColor;
  // add comment to spanElement.dataset to grab it for hover-over comment viewing functionality later
  spanElement.dataset.comment = annotation.comment;
  return spanElement;
}

/* highlight the selection */
function highlightSelectedText(data) {
  // create a new span element with class annotation-highlight and
  // requested color from the context menu
  let spanElement = null;
  try {
    spanElement = createSpanElement(data);
  }catch(error){
    console.error(`creating span element error: ${error}`);
  }
  
  // console.log(`inside highlightSelectedText spanElement: ${spanElement.toString()}`);
  try {
    if(spanElement) addSpanElementToDom(data.selectedTextRange, spanElement);
  } catch (error) {
    console.error(`unable to add span element to DOM: error thrown: ${error}`);
  }

  // check if new spanElement was successfully added to DOM using the UUID of the element
  // if successful, sync new annotation to storage
  if (document.getElementById(spanElement.id)) {
    createSifterWebPagePopover();
    addDataForUrlIntoPopover(data);
    contentScriptSendMessage(constants.actions.saveData, data);
  }
}

function sifterNextHighlight(event) {
  // prevent text selection
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  let highlights = document.getElementsByClassName("annotation-highlight");
  if (highlights.length == 0) return;
  currentHighlight = currentHighlight % highlights.length;
  // updateAnnotationPopoverCaption();
  let h = highlights[currentHighlight];
  h.style.transition = "opacity 0.3s ease-in-out";
  h.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
  h.style.opacity = 0.2;
  currentHighlight += 1;
  setTimeout(() => {
    h.style.opacity = 1.0;
  }, 300);
}

function contentScriptSendMessage(action, data) {
  if (constants.actions.saveData === action) {
    let message = {
      action: constants.actions.saveData,
      data: data,
    };
    chrome.runtime.sendMessage(message, (response) => {
      if (!response) return;
      console.log(
        `in contentScript chrome.runtime.sendMessage: response obj: ${JSON.stringify(
          response
        )}`
      );
    });
  }
}


// when the DOM content loads, get the active tab url
// encode the url as a base64 string
// that string is the key to fetch any annotations in the page
// stored in chrome storage or later the cloud
// window.addEventListener("DOMContentLoaded", (event) => {
//   // What to do when DOM content is loaded?
// });


/* 
messaging between extension processes in the chrome runtime, not the web page runtime 
background.js (service worker) and content-script.js
*/
chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((message) => {
    let data = message.data;
    if (constants.actions.highlightSelectedText === message.action) {
      // assign selectedTextRange value to property in data object for storage
      // to be able to use it to add the annotation data back to the DOM when user
      // returns to web page
      let range = getWindowSelectionRange();
      data.selectedTextRangeData = getSelectionRangeData(range);
      highlightSelectedText(data);
    }
    if(constants.actions.addDataForUrlToDom === message.action) {
      addDataForUrlToDom(data);
    }
  });
});

export {};
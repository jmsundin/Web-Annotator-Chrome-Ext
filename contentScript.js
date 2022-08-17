/*
The content-script loads JavaScript in the context of the web page
This script has the search function to search the DOM
This script istens to the extension (popup script and background.js service worker scripts)

This script contains the DOM highlight functionality
This script contains any UI that is not the extension popup UI
*/

/* global variable declarations and assignments */
const constants = {
  highlightColorChoices: ["yellow", "red", "blue", "green", "white", "grey"],
  context: {
    onUpdatedTabComplete: "on-updated-tab-complete",
    onClickContextMenuItem: "on-click-context-menu-item",
  },
  actions: {
    highlightSelectedText: "highlight-selected-text",
    addAnnotationsForUrlToDom: "add-annotations-for-url-to-dom",
    saveAnnotations: "save-annotations-to-chrome-storage",
    fetchAnnotations: "fetch-annotations-from-chrome-storage",
  },
};

let annotationPopover = null;

// highlighted elements in page
let annotationObjsForUrl = [];

// div text content on the web page that matches search input
let textChunksWithSearchString = [];

// get assets in your chrome extension directory
function getChromeExtensionAssets() {
  // chrome.runtime.getURL("./assets/file-name");
}

// let annotationObjsForUrlExist = setInterval(doAnnotationObjsForUrlExist, 10000);

function doAnnotationObjsForUrlExist() {
  if (Object.keys(annotationObjsForUrl).length > 0) {
    let action = constants.actions.saveAnnotations;
    let data = annotationObjsForUrl;
    contentScriptSendMessage(action, data);
    return true;
  } else return false;
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

// TODO: add this function into addAnnotationsForUrlIntoPopover()
function onClickAddComment() {
  let textInput = document.getElementById("input_text").value;
  let commentElement = document.getElementById("comment_text");
  commentElement.innerText = textInput;
}

function addAnnotationsForUrlIntoPopover() {
  if (annotationPopover && annotationObjsForUrl) {
    for (let annotation of annotationObjsForUrl) {
      let annotationElement = document.createElement("div");
      annotationElement.className = "sifter-annotation";
      annotationElement.innerHTML = annotation.selectionText;

      let annotationCommentInput = document.createElement("input");
      annotationCommentInput.setAttribute("type", "input");
      annotationCommentInput.setAttribute("placeholder", "Add a comment");

      annotationPopover.appendChild(annotationElement);
      annotationPopover.appendChild(annotationCommentInput);

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
CreateAnnotationPopover is called when span element annotation is added to the DOM
*/
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

    annotationPopover.style.fontSize = "14px";
    annotationPopover.style.fontWeight = "bold";
    annotationPopover.style.color = "black";
    annotationPopover.style.backgroundColor = "#E3E3E3";
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
    annotationPopoverCaption.textContent = "";
    annotationPopover.appendChild(annotationPopoverCaption);

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


function addAnnotationsForUrlToDom(annotationsObjsForUrl) {
  if (Object.keys(annotationsObjsForUrl).length > 1) {
    for (let annotation of annotationObjsForUrl) {
      addSpanElementToDom(createSpanElement(annotation));
    }
  } else {
    // only one annotation obj, thus no loop necessary
    let spanElement = null;
    try {
      spanElement = createSpanElement(annotationsObjsForUrl);
    }catch(error){
      console.error(`creating span element error: ${error}`);
    }
    try{
      if(!spanElement){
        addSpanElementToDom();
      }
    }catch(error){
      console.error(`adding span element to DOM error: ${error}`);
    }
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

function createSpanElement(annotationObj) {
  let spanElement = document.createElement("span");
  spanElement.id = annotationObj.id; // id: string
  spanElement.className = "sifter-annotation";
  spanElement.style.backgroundColor = annotationObj.highlightColor;
  // add comment to spanElement.dataset to grab it for hover-over comment viewing functionality later
  spanElement.dataset.comment = annotationObj.comment;
  return spanElement;
}

/* highlight the selection */
function highlightSelectedText(annotationObj) {
  // create a new span element with class annotation-highlight and
  // requested color from the context menu
  let spanElement = createSpanElement(annotationObj);
  // console.log(`inside highlightSelectedText spanElement: ${spanElement.toString()}`);
  try {
    addSpanElementToDom(spanElement);
  } catch (error) {
    console.error(`unable to add span element to DOM: error thrown: ${error}`);
  }

  // check if new spanElement was successfully added to DOM using the UUID of the element
  // if successful, sync new annotation to storage
  if (document.getElementById(spanElement.id)) {
    createAnnotationPopover();
    annotationObjsForUrl.push(annotationObj); // global value of annotation objs for the url
    addAnnotationsForUrlIntoPopover();
    let action = constants.actions.saveAnnotations;
    let data = annotationObj;
    contentScriptSendMessage(action, data);
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

/* end of messaging callback functions */

/* listeners */

/* message listeners */

/* 
messaging between extension processes in the chrome runtime, not the web page runtime 
background.js (service worker) and content-script.js
*/
chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((message) => {
    if (constants.actions.highlightSelectedText === message.action) {
      if(Object.keys(message.annotationsObjsForUrl) > 0){
        // TODO: what way to optimize checking how many annotation objects there are?
        // property lookups later down the call stack have the wrong properties...
      }
      let annotationObj = message.annotationObj
      highlightSelectedText(message.annotationObj);
    }
    if (constants.actions.addAnnotationsForUrlToDom === message.action) {
      addAnnotationsForUrlToDom(message.annotationsObjsForUrl);
    }
    // if (message.action === constants.actions.fetchAnnotations){

    // }
  });
});

/* end of message listeners */

/* sending messages from contentScript */
// TODO: send array/batch of annotation objects to save to chrome storage
function contentScriptSendMessage(action, data) {
  if (action === constants.actions.saveAnnotations) {
    let annotationObjs = data;
    let message = {
      action: constants.actions.saveAnnotations,
      data: annotationObjs,
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
  // window.atob function decodes the base64 back to the url string
  // window.btoa function encodes the url string to base64
  if (constants.actions.fetchAnnotations === action) {
    let encodedUrlAsKey = data;
    let message = {
      action: constants.actions.fetchAnnotations,
      data: encodedUrlAsKey,
    };
    chrome.runtime.sendMessage(message, (response) => {
      if(response) return response;
      else
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

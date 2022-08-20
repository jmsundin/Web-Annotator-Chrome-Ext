/*
The content-script loads JavaScript in the context of the web page
This script has the search function to search the DOM
This script istens to the extension (popup script and background.js service worker scripts)

This script contains the DOM highlight functionality
This script contains any UI that is not the extension popup UI
*/

/* global variable declarations and assignments */

import { Annotation, Message, EventContext, UserAction } from "./constants";

let sifterWebPagePopover: HTMLElement;
let currentSelectionRange: Range | undefined;

// div text content on the web page that matches search input
let textChunksWithSearchString = [];

// get assets in your chrome extension directory
function getChromeExtensionAssets() {
  // chrome.runtime.getURL("./assets/file-name");
}

// let annotationObjsForUrlExist = setInterval(doAnnotationObjsForUrlExist, 10000);

/* search functions */

// a declared function can be `hoisted` to the top of this file at runtime and thus can be called anywhere in the file
function searchDOM(searchString: string): void {
  for (const div of document.querySelectorAll("div")) {
    console.log(div);
    if (div.innerHTML.includes(searchString)) {
      // TODO
    }
    textChunksWithSearchString.push(div.innerHTML);
  }
}

function getActiveTab(): chrome.tabs.Tab | undefined {
  let queryOptions = { active: true, currentWindow: true };
  chrome.tabs.query(queryOptions, (tabs) => {
    try {
      let activeTab = tabs[0];
      return activeTab;
    } catch (error) {
      console.error(`getting active tab url error: ${error}`);
    }
  });
  return;
}

function getWindowSelectionRange(): Range | undefined {
  if (window.getSelection) {
    let selection: Selection | null = window.getSelection();
    if (selection != null) {
      return selection.getRangeAt(0).cloneRange();
    }
  }
}

// TODO
function getSelectionParent(range: Range) {}

// TODO
function getSelectionChild() {}

// TODO: add this function into addDataForUrlIntoPopover()
function onClickAddComment(): undefined {
  let textInput: string;
  let element: HTMLElement | null = document.getElementById("input_text");
  let commentElement = document.getElementById("comment_text");
  if (!element) return;
  textInput = element.innerHTML;
  if (textInput && commentElement != null) {
    commentElement.innerHTML = textInput;
  }
}

function addAnnotationForUrlIntoPopover(annotation: Annotation): undefined {
  if (sifterWebPagePopover && annotation) {
    let annotationElement: HTMLElement = document.createElement("div");
    annotationElement.className = "sifter-annotation";
    if(!annotation.selectionText) return;
    annotationElement.innerText = annotation.selectionText;

    let annotationCommentInput: HTMLElement =
      document.createElement("input");
    annotationCommentInput.setAttribute("type", "input");
    annotationCommentInput.setAttribute("placeholder", "Add a comment");

    sifterWebPagePopover.appendChild(annotationElement);
    sifterWebPagePopover.appendChild(annotationCommentInput);

    let commentInput: HTMLElement = document.createElement("input");
    commentInput.setAttribute("id", "input_text");
    commentInput.setAttribute("type", "text");
    commentInput.setAttribute("placeholder", "Add a comment");

    let commentSubmit: HTMLElement = document.createElement("button");
    commentSubmit.setAttribute("onclick", "onClickAddComment()");
    commentSubmit.innerHTML = "Add";

    let commentElement: HTMLElement = document.createElement("p");
    commentElement.setAttribute("id", "comment_text");

    document.body.appendChild(commentInput);
    document.body.appendChild(commentSubmit);
    document.body.appendChild(commentElement);
  }
}

function dragElement(sifterWebPagePopover: HTMLElement) {
  let draggedDiv = sifterWebPagePopover;
  let left = 0;
  let top = 0;

  let dragHeader: HTMLElement | null = draggedDiv.querySelector("#dragheader");
  if (dragHeader != null) {
    dragHeader.addEventListener("mousedown", dragMouseDown);
  }

  function dragMouseDown(event: MouseEvent) {
    event.preventDefault();
    let rect: DOMRect = draggedDiv.getBoundingClientRect();
    left = event.clientX - rect.left;
    top = event.clientY - rect.top;
    document.addEventListener("mouseup", closeDragElement);
    document.addEventListener("mousemove", elementDrag);
  }

  function elementDrag(event: MouseEvent) {
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
  function closeDragElement(event: MouseEvent) {
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
    sifterWebPagePopover.style.zIndex = "200000";
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
    sifterPopoverCaption.addEventListener("mousedown", (event: MouseEvent) => {
      // sifterNextHighlight(event);
    });
    sifterPopoverCaption.title = "Click to navigate in highlights";
    sifterPopoverCaption.id = "sifterPopoverCaption";
    sifterPopoverCaption.style.cursor = "pointer";
    sifterPopoverCaption.style.userSelect = "none";
    sifterPopoverCaption.textContent = "";
    sifterWebPagePopover.appendChild(sifterPopoverCaption);

    let close: HTMLElement = document.createElement("div");
    close.textContent = "✕";
    close.style.position = "absolute";
    close.style.top = "0";
    close.style.left = "0";
    close.style.margin = "4px";
    close.style.fontSize = "12px";
    close.style.padding = "4px";
    close.style.color = "black";
    close.style.backgroundColor = "#C8CACB";
    close.style.cursor = "pointer";
    close.addEventListener(
      "click",
      (): void => {
        sifterWebPagePopover.style.display = "none";
      },
      false
    );
    sifterWebPagePopover.appendChild(close);
    document.body.appendChild(sifterWebPagePopover);
    dragElement(sifterWebPagePopover);
  }
}

function addSpanElementToDom(spanElement: HTMLElement) {
  if(!currentSelectionRange?.toString()) return;
  let documentFragment = currentSelectionRange.extractContents();
  spanElement.appendChild(documentFragment);
  currentSelectionRange.insertNode(spanElement);
}

function addAnnotationForUrlToDom(annotation: Annotation) {
  let spanElement = null;
  try {
    spanElement = createSpanElement(annotation);
  } catch (error) {
    console.error(`creating span element error: ${error}`);
  }
  try {
    // if (spanElement) addSpanElementToDom(annotation.selectionParentNode, annotation.selectionChildNode, spanElement);
  } catch (error) {
    console.error(`adding span element to DOM error: ${error}`);
  }
}

function createSpanElement(annotation: Annotation): HTMLElement {
  let spanElement: HTMLElement = document.createElement("span");
  spanElement.id = annotation.id; // id: string
  spanElement.className = "sifter-annotation";
  if (typeof annotation.highlightColor === "string"){
    spanElement.style.backgroundColor = annotation.highlightColor;
  }
  // add comment to spanElement.dataset to grab it for hover-over comment viewing functionality later
  spanElement.dataset.comment = annotation.comment;
  return spanElement;
}

/* highlight the selection */
function highlightSelectedText(annotation: Annotation): undefined {
  // create a new span element with class annotation-highlight and
  // requested color from the context menu
  if(!annotation) return;
  let spanElement: HTMLElement = createSpanElement(annotation);

  // console.log(`inside highlightSelectedText spanElement: ${spanElement.toString()}`);
  
  if (!spanElement)return;
  try {
    addSpanElementToDom(spanElement);
  }
  catch(error) {
    console.log(`unable to add span element to current text selection range. Error thrown: ${error}`);
  }

  // check if new spanElement was successfully added to DOM using the UUID of the element
  // if successful, sync new annotation to storage
  if (spanElement != null) {
    if (document.getElementById(spanElement.id)) {
      createSifterWebPagePopover();
      addAnnotationForUrlIntoPopover(annotation);
      contentScriptSendMessage(UserAction.saveData, annotation);
    }
  }
}

function sifterNextHighlight(event: MouseEvent) {
  // prevent text selection
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  let highlights: HTMLCollectionOf<Element> = document.getElementsByClassName(
    "annotation-highlight"
  );
  if (highlights.length == 0) return;
  // TODO: create global or pass in current spanElement to this function above
  // spanElement = currentHighlight % highlights.length;
  // updateAnnotationPopoverCaption();
  // let h = highlights[currentHighlight];
  // h.style.transition = "opacity 0.3s ease-in-out";
  // h.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
  // h.style.opacity = 0.2;
  // currentHighlight += 1;
  // setTimeout(() => {
  //   h.style.opacity = 1.0;
  // }, 300);
}

function contentScriptSendMessage(
  action: UserAction,
  annotation: Annotation
): void {
  if (UserAction.saveData === action) {
    let message = {
      action: UserAction.saveData,
      data: annotation,
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

/* 
messaging between extension processes in the chrome runtime, not the web page runtime 
background.js (service worker) and content-script.js
*/
chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((message) => {
    // console.log(`Inside content script onMessage listener: message: ${JSON.stringify(message)}`);
    let annotation: Annotation = message.data;
    if (UserAction.highlightSelectedText === message.action) {
      // assign selectedTextRange value to property in data object for storage
      // to be able to use it to add the annotation data back to the DOM when user
      // returns to web page
      currentSelectionRange = getWindowSelectionRange();
      // data.selectedTextRangeData = getSelectionRangeData(range);
      highlightSelectedText(annotation);
    }
    // if (UserAction.addDataForUrlToDom === message.action) {
    //   addAnnotationForUrlToDom(data);
    // }
  });
});

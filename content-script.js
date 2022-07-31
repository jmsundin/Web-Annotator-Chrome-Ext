// The content-script loads JavaScript in the context of the web page
// So this script has the search function for the user search input/query
// and listens to the background.js service worker for any messages
// which will trigger any content script functions here

/* global variable declarations and assignments */
// let signedin = false;
let highlightswrapper = document.querySelector("#highlight-wrapper");
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

// get assets in your chrome extension directory
// chrome.runtime.getURL("./assets/file-name");

// chrome.runtime.onMessage.addListener((obj, sender, respones) => {
//     // destructuring obj into single variables
//     const { url, urlTitle, tabWindowId } = obj;
// });

function getWindowWithSelection(wnd){
    //alert('hasSelection:' + wnd);
    if (wnd.getSelection().rangeCount > 0){
        console.log('found selection:' + wnd.getSelection());
        return wnd;
    }
    else
        return null;
}

function contentScriptCallback(request, sender, sendResponse) {
  console.log("inside the contentScriptCallback");
  if (request.action === "highlight-selected-text") {
    let wnd = getWindowWithSelection(window);
    highlightSelection(wnd, request.color);
  }
}

//chrome.runtime.onMessage.addListener(contentScriptRequestCallback);
chrome.runtime.onConnect.addListener((port) => {
  //console.log('onconnect to port',port);
  port.onMessage.addListener(contentScriptCallback);
});

// chrome.runtime.onConnect.addListener((port) => {
//     //console.log('onconnect to port',port);
//     port.onMessage.addListener(contentScriptRequestCallback);
// });

// div text content on the web page that matches search input
let textChunksWithSearchString = [];

// a declared function can be `hoisted` to the top of this file at runtime and thus can be called anywhere in the file
function searchDOM(searchString) {
  for (const div of document.querySelectorAll("div")) {
    console.log(div);
    if (div.textContent.includes(searchString)) {
    }
    textChunksWithSearchString.push(div.innerHTML);
  }
}

// console.log(textChunksWithSearchString);
/*
function dragElement(div) {
  let draggedDiv = div;
  let left = 0;
  let top = 0;
  draggedDiv
    .querySelector("#dragheader")
    .addEventListener("mousedown", dragMouseDown);

  function dragMouseDown(e) {
    e.preventDefault();
    let rect = draggedDiv.getBoundingClientRect();
    left = e.clientX - rect.left;
    top = e.clientY - rect.top;
    document.addEventListener("mouseup", closeDragElement);
    document.addEventListener("mousemove", elementDrag);
  }

  function elementDrag(e) {
    e.preventDefault();
    let x = e.clientX;
    let y = e.clientY;
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
  function closeDragElement(e) {
    document.removeEventListener("mouseup", closeDragElement);
    document.removeEventListener("mousemove", elementDrag);
  }
}
*/

/* highlight the selection */

/*
function highlightSelection(wnd, color) {
  if (!wnd) return false;
  var nselections = wnd.getSelection().rangeCount;
  if (nselections === 0) return false;
  var selection = wnd.getSelection().getRangeAt(0);
  var selectionstring = wnd.getSelection() + ""; //selection.toString();
  selectionstring = selectionstring.trim();
  if (selectionstring.length === 0) return false;
  if (selectionstring.indexOf("\n") >= 0) {
    alert("Please select text without new lines");
    return false;
  }
  var docurl = yawas_getGoodUrl(wnd.document);
  var occurence = -1;
  wnd.getSelection().removeAllRanges();
  var found = false;
  while (!found && wnd.find(selectionstring, true, false)) {
    occurence += 1;
    var rng = wnd.getSelection().getRangeAt(0);
    if (
      selection.compareBoundaryPoints(Range.END_TO_START, rng) == -1 &&
      selection.compareBoundaryPoints(Range.START_TO_END, rng) == 1
    )
      found = true;
  }
  if (!found) occurence = -1;
  if (occurence >= 0) {
    lastHighlight = highlightNowFirefox22(
      wnd.getSelection().getRangeAt(0),
      currentColor,
      forecolor,
      wnd.document,
      selectionstring,
      occurence
    );
    wnd.getSelection().removeAllRanges();
    yawas_storeHighlight(
      docurl,
      wnd.document.title,
      selectionstring,
      occurence,
      currentColor,
      addcommentwhendone
    );
    return true;
  } else {
    alert("Sorry, [" + selectionstring + "] was not found.");
    wnd.getSelection().removeAllRanges();
    return false;
  }
}
*/

function highlightDoc(wnd,doc,highlights)
{
    let previousRange = null;
    if (wnd.getSelection().rangeCount > 0)
      previousRange = wnd.getSelection().getRangeAt(0);
    var scrollLeft = wnd.scrollX;
    var scrollTop = wnd.scrollY;
    nremapped = 0;
    notRemapped = [];
    yawas_uncompact(wnd,highlights);
    for (var i=0;i<highlights.length;i++)
    {
        wnd.getSelection().removeAllRanges();
        var selectionString = highlights[i].selection;
        if (highlights[i].selection_unpacted)
        	selectionString = highlights[i].selection_unpacted;
        var n = 0;
        while (n<highlights[i].n && wnd.find(selectionString,true,false))
        {
            n++;
        }
        if (n == highlights[i].n && wnd.find(selectionString,true,false))
        {
          try {
            highlightNowFirefox22(wnd.getSelection().getRangeAt(0), highlights[i].color, forecolor, doc, highlights[i].selection, highlights[i].n,highlights[i].comment);
            nremapped++;
          }
          catch(e){
            console.error('error highlightNowFirefox22',e);
          }
        }
        else
          notRemapped.push(highlights[i]);
    }
    wnd.getSelection().removeAllRanges();
    wnd.scrollTo(scrollLeft,scrollTop);
    if (previousRange)
      wnd.getSelection().addRange(previousRange);
    return nremapped;
}

/* on right-click context menu handler */
// function onContextMenuHandler() {
//   if (hoverElement !== null) {
//     let selection = window.getSelection();
//     if (selection.rangeCount > 0) {
//       selection.removeAllRanges();
//     }
//     let range = document.createRange();
//     range.selectNode(hoverElement);
//     selection.addRange(range);
//   }
// }

/* window listener */

// context menu global event callback function
// https://developer.mozilla.org/en-US/docs/Web/API/Element/contextmenu_event
// window.addEventListener("oncontextmenu", onContextMenuHandler);

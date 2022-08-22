const color: Color = {
  yellow: "yellow",
  red: "red",
  blue: "blue",
  green: "green",
  white: "white",
  grey: "grey",
};

enum EventContext {
  onDOMContentLoaded = "on-dom-content-loaded",
  onUpdatedTabComplete = "on-updated-tab-complete",
  onClickContextMenuItem = "on-click-context-menu-item",
  onClickBrowserActionIcon = "on-click-browser-action-icon",
}

enum UserAction {
  highlightSelectedText = "highlight-selected-text",
  saveData = "save-data",
  fetchData = "fetch-data",
}

enum onUpdatedTabState {
  unloaded = "unloaded",
  loading = "loading",
  complete = "complete",
}

// TODO: add selectionParentNode and selectionChildNode to Annotation interface
class Annotation {
  id!: string;
  highlightColor!: string | number;
  pageUrl!: string;
  selectionText?: string;
  urlTitle?: string;
  comment?: string;
  srcUrl?: string;
  constructor(id: string, highlightColor: string | number, pageUrl: string);
  constructor(
    id: string,
    highlightColor: string | number,
    pageUrl: string,
    selectionText?: string,
    urlTitle?: string,
    comment?: string,
    srcUrl?: string
  ) {
    this.id = id;
    this.highlightColor = highlightColor;
    this.selectionText = selectionText;
    this.pageUrl = pageUrl;
    this.urlTitle = urlTitle;
    this.comment = comment;
    this.srcUrl = srcUrl;
  }
}

export interface Color {
  yellow: string;
  red: string;
  blue: string;
  green: string;
  white: string;
  grey: string;
}

export interface Message {
  context: string;
  action: string;
  data: Annotation;
}

export { color, EventContext, UserAction, onUpdatedTabState, Annotation };

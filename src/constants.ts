interface Color {
  yellow: string;
  red: string;
  blue: string;
  green: string;
  white: string;
  grey: string;
}

const color: Color = {
  yellow: "yellow",
  red: "red",
  blue: "blue",
  green: "green",
  white: "white",
  grey: "grey",
};

enum EventContext {
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
export class Annotation {
  id?: string;
  highlightColor?: string | number;
  selectionText?: string;
  comment?: string;
  pageUrl?: string;
  urlTitle?: string;
  srcUrl?: string;
  constructor();
  constructor(
    id?: string,
    highlightColor?: string | number,
    selectionText?: string,
    comment?: string,
    urlTitle?: string,
    srcUrl?: string
  ) {
    this.id = id;
    this.highlightColor = highlightColor;
    this.selectionText = selectionText;
    this.comment = comment;
    this.urlTitle = urlTitle;
    this.srcUrl = srcUrl;
  }
}

export type Message = {
  context: string;
  action: string;
  data: Annotation;
};

export { color, EventContext, UserAction, onUpdatedTabState };

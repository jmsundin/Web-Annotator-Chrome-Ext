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

export { Color, EventContext, UserAction }
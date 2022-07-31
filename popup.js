/*
This index.js is the Chrome extension popup script that reads the global variables
in the background.js service worker script, which handles the events on the web page
*/

/*
This index.js script handles the events on the Chrome extension popup: index.html
*/

// listener attached to document object waiting for the DOMContentLoadead event

// document.addEventListener('DOMContentLoaded', async () => {

// });

/* basic search with no autocomplete */
// const searchButton = document.getElementById('search-button');
// const searchInput = document.getElementById('search-input');

// searchInput.addEventListener('onkeypress', (event) => {
//     chrome.runtime.sendMessage({"fromIndexPopup": searchDOM, "eventObj": event});
// });

// searchInput.addEventListener('enter', (event) => {
//     searchDOM(event.value);
// });

// searchButton.addEventListener('click', (event) => {
//     searchDOM(event.value);
// });

/* autocomplete search */
// const search_autocomplete = document.querySelector('#search-autocomplete');
// let search_input_string = search_autocomplete.innerHTML;

// let dom_body = document.body
// let text_on_page = [];

// const dataFilter = (value) => {
//     search_input_string
//   return data.filter((item) => {
//     return item.toLowerCase().startsWith(value.toLowerCase());
//   });
// };

// new mdb.Autocomplete(search_autocomplete, {
//   filter: dataFilter
// });

/* end of autocomplete search box */

// to get the background.js service worker `window` object call this function below from the chrome API
// chrome.runtime.getBackgroundPage((background_service_worker_window) => {
//     console.log(background_service_worker_window);
// });

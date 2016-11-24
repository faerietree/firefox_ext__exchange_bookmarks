var ghostifyBookmarks; ghostifyBookmarks = [undefined, undefined];
var currentTab;
var isHidden;

var urlsToGhostify; urlsToGhostify = []; // TODO distinguish promise not fulfilled/arrived yet (undefined) and empty. 
var urlGhosts; urlGhosts = [];

function onError(error) // TODO Reuse in options.js using browser.extension.getBackgroundPage().onError.
{
  console.log(`Error: ${error}`);
}

// request and hopefully get the options:
var gettingOptions = browser.storage.local.get("urlsToGhostify");
gettingOptions.then(function(item) { urlsToGhostify = item.urlsToGhostify.split(/\s+/); } , onError);

gettingOptions = browser.storage.local.get("urlGhosts");
gettingOptions.then(function(item) { /*alert(uneval(item));*/ urlGhosts = item.urlGhosts.split(/\s+/); } , onError);


/*
 * Updates the browserAction icon to reflect whether the current page
 * is already bookmarked.
 */
function updateIcon() {
  browser.browserAction.setIcon({
    path: ghostifyBookmarks[0] && ghostifyBookmarks[1] && isHidden ? {
      19: "icons/star-filled-19.png",
      38: "icons/star-filled-38.png"
    } : {
      19: "icons/star-empty-19.png",
      38: "icons/star-empty-38.png"
    },
    tabId: currentTab.id
  });
}

/*
 * Toggle the bookmark on the current page.
 */
function toggleBookmark() {
  if (urlsToGhostify.length < 1 || urlGhosts.length < 1)
  {
    console.log('No options loaded yet or are empty.');
    browser.runtime.openOptionsPage();
    return;
  }

  for (var index = 0; index < ghostifyBookmarks.length; ++index) {
    var bookmark = ghostifyBookmarks[index];
    var urlToGhostify = urlsToGhostify[index];
    var urlGhost = urlGhosts[index];
    if (!bookmark)
    {
        console.log("Error: No bookmark loaded: " + bookmark + "ghostifyBookmarks: " + ghostifyBookmarks + " . Loading (again) ...");
        updateActiveTab();
    }
    if (bookmark.url != urlToGhostify)
    {
        //browser.bookmarks.remove(currentBookmark.id);
        var updating = browser.bookmarks.update(bookmark.id, {title: bookmark.title, url: urlToGhostify});
        updating.then(function(bookmark) {
          //ghostifyBookmarks[index].url = bookmark.url;
          isHidden = false;
          updateActiveTab();
        });        
    } else {
        //var creating = browser.bookmarks.create({title: currentTab.title, url: currentTab.url});
        //creating.then(function(bookmark) {
        //  currentBookmark = bookmark;
        //  updateIcon();
        //});
        var updating = browser.bookmarks.update(bookmark.id, {title: bookmark.title, url: urlGhost});
        updating.then(function(bookmark) {
          //ghostifyBookmarks[index].url = bookmark.url;
          isHidden = true;
          updateActiveTab();
        });
    }
  }


}

browser.browserAction.onClicked.addListener(toggleBookmark);


/*
 * Switches currentTab and currentBookmark to reflect the currently active tab
 */
function updateActiveTab(tabs) {

  function updateTab(tabs) {
    if (tabs[0]) {
      currentTab = tabs[0];
      // no ghosts:
      var searching = browser.bookmarks.search({url: urlsToGhostify[0]});
      searching.then((bookmarks) => {
        if (bookmarks.length < 1)
            return;
        ghostifyBookmarks[0] = bookmarks[0];
        isHidden = false;
        updateIcon();
      });
      var searching = browser.bookmarks.search({url: urlsToGhostify[1]});
      searching.then((bookmarks) => {
        if (bookmarks.length < 1)
            return;
        ghostifyBookmarks[1] = bookmarks[0];
        isHidden = false;
        updateIcon();
      });
      // if they are ghosts already:
      var searching = browser.bookmarks.search({url: urlGhosts[0]});
      searching.then((bookmarks) => {
        if (bookmarks.length < 1)
            return;
        ghostifyBookmarks[0] = bookmarks[0];
        isHidden = true;
        updateIcon();
      });
      var searching = browser.bookmarks.search({url: urlGhosts[1]});
      searching.then((bookmarks) => {
        if (bookmarks.length < 1)
            return;
        ghostifyBookmarks[1] = bookmarks[0];
        isHidden = true;
        updateIcon();
      });
    }
  }
  /*
  function loadGhostifyBookmarkGhosts(tabs)
  {
    for (var index = 0; index < urlsToGhostify.length; ++index) {
        var bookmark = ghostifyBookmarks[index];
        var urlToGhostify = urlsToGhostify[index];
        var urlGhost = urlGhosts[index];
        if (!bookmark)
        {
            var searching = browser.bookmarks.search({url: urlGhost});
            searching.then((bookmarks) => {
                ghostifyBookmarks[index] = bookmarks[0];
                updateIcon(); // TODO Update ghostifyBookmarksLoadedIcon
            });
        }
    }
  }
  function loadGhostifyBookmarks(tabs)
  {
    for (var index = 0; index < urlGhosts.length; ++index) {
        var bookmark = ghostifyBookmarks[index];
        var urlToGhostify = urlsToGhostify[index];
        var urlGhost = urlGhosts[index];
        if (!bookmark)
        {
            var searching = browser.bookmarks.search({url: urlToGhostify});
            searching.then((bookmarks) => {
                console.log("bookmarks found count: " + bookmarks.length);
                if (bookmarks[0])
                {
                    ghostifyBookmarks[index] = bookmarks[0];
                }
                else
                {
                    loadGhostifyBookmarkGhosts(tabs);
                }
                updateIcon(); // TODO Update ghostifyBookmarksLoadedIcon
            });
        }
    }
  }
  */
  var gettingActiveTab = browser.tabs.query({active: true, currentWindow: true});
  //gettingActiveTab.then(updateTab).then(loadGhostifyBookmarks).then(loadGhostifyBookmarkGhosts);
  gettingActiveTab.then(updateTab);
}



// TODO listen for bookmarks.onCreated and bookmarks.onRemoved once Bug 1221764 lands

// listen to tab URL changes
browser.tabs.onUpdated.addListener(updateActiveTab);

// listen to tab switching
browser.tabs.onActivated.addListener(updateActiveTab);

// update when the extension loads initially
updateActiveTab();

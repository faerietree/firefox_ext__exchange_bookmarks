var ghostifyBookmarks; ghostifyBookmarks = [undefined, undefined];
var currentTab;
var isHidden;

var urlsToGhostify; urlsToGhostify = [ "http://burgauwka.duckdns.org:8011/control/userimage.html", "http://burgauwka.duckdns.org:8012/control/userimage.html" ];
var urlGhosts; urlGhosts = [ "http://burgauwka.duckdns.org:8014/control/userimage.html", "http://burgauwka.duckdns.org:8015/control/userimage.html" ];


/*
 * Updates the browserAction icon to reflect whether the current page
 * is already bookmarked.
 */
function updateIcon() {
  browser.browserAction.setIcon({
    path: ghostifyBookmarks[0] && ghostifyBookmarks[1] && isHidden ? {
      19: "icons/bookmark-it.png",
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

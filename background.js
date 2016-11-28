var ghostifyBookmarks; ghostifyBookmarks = [undefined, undefined];
var currentTab;
var isHidden;

var urlsToGhostify; urlsToGhostify = []; // TODO distinguish promise not fulfilled/arrived yet (undefined) and empty.
var urlGhosts; urlGhosts = [];

function onError(error) // TODO Reuse in options.js using browser.extension.getBackgroundPage().onError.
{
  console.log(`Error: ${error}`);
}


function init()
{
	// request and hopefully get the options:
	var gettingOptions = browser.storage.local.get("urlsToGhostify");
	gettingOptions.then(function(item) { urlsToGhostify = item.urlsToGhostify.split(/\s+/); } , onError);

	gettingOptions = browser.storage.local.get("urlGhosts");
	gettingOptions.then(function(item) { /*alert(uneval(item));*/ urlGhosts = item.urlGhosts.split(/\s+/); } , onError);

	updateGhostifyBookmarks();
}

/*
 * Updates the browserAction icon to reflect whether the current page
 * is already bookmarked.
 */
function updateIcon()
{
  browser.browserAction.setIcon({
    path: ghostifyBookmarks[0] && ghostifyBookmarks[1] && isHidden ? {
      19: "icons/star-filled-19.png",
      38: "icons/star-filled-38.png"
    } : {
      19: "icons/star-empty-19.png",
      38: "icons/star-empty-38.png"
    }
    //,tabId: currentTab.id
  });
}

/*
 * Toggle the bookmark on the current page.
 */
function toggleBookmark()
{

  init();

  if (urlsToGhostify.length < 1 || urlGhosts.length < 1)
  {
    console.log('No options loaded yet or are empty.');
    browser.runtime.openOptionsPage();
    return;
  }

  for (var index = 0; index < ghostifyBookmarks.length; ++index)
  {
    var bookmark = ghostifyBookmarks[index];
    var urlToGhostify = urlsToGhostify[index];
    var urlGhost = urlGhosts[index];
    if (!bookmark)
    {
        console.log("Error: No bookmark loaded: " + bookmark + "ghostifyBookmarks: " + ghostifyBookmarks + " . Loading (again) ...");
        updateGhostifyBookmarks();
    }
    if (bookmark.url != urlToGhostify)
    {
        //browser.bookmarks.remove(currentBookmark.id);
        var updating = browser.bookmarks.update(bookmark.id, {title: bookmark.title, url: urlToGhostify});
        updating.then(function(bookmark) {
          //ghostifyBookmarks[index].url = bookmark.url;
          isHidden = false;
          updateGhostifyBookmarks();
        });
    }
 	else
	{
        //var creating = browser.bookmarks.create({title: currentTab.title, url: currentTab.url});
        //creating.then(function(bookmark) {
        //  currentBookmark = bookmark;
        //  updateIcon();
        //});
        var updating = browser.bookmarks.update(bookmark.id, {title: bookmark.title, url: urlGhost});
        updating.then(function(bookmark) {
          //ghostifyBookmarks[index].url = bookmark.url;
          isHidden = true;
          updateGhostifyBookmarks();
        });
    }
  }


}

browser.browserAction.onClicked.addListener(toggleBookmark);


/*
 * Update ghostifyBookmarks to prevent invalid URL data because the URLs have been swapped. 
 */
function updateGhostifyBookmarks()
{

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


// TODO listen for bookmarks.onCreated and bookmarks.onRemoved once Bug 1221764 lands


// update when the extension loads initially
init();

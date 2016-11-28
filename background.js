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

	// store the bookmarks that are to be ghostified:
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
          updateIcon();
        });
    }
 	else
	{
        //var creating = browser.bookmarks.create({title: currentTab.title, url: currentTab.url});
        //creating.then(function(bookmark) {
        //  currentBookmark = bookmark;
        //  updateIcon();
        //});
        // TODO Swap the urls because else urls may get lost. May require ghostifyBookmarks extension and logic modification here.
        // TODO Restore original URL assignment on options restore.
        var updating = browser.bookmarks.update(bookmark.id, {title: bookmark.title, url: urlGhost});
        updating.then(function(bookmark) {
          //ghostifyBookmarks[index].url = bookmark.url;
          isHidden = true;
          updateIcon();
        });
    }
  }


}

browser.browserAction.onClicked.addListener(toggleBookmark);


/*
 * Update ghostifyBookmarks to prevent invalid URL data because the URLs have been swapped. 
 * This depends upon a consistent reset of the URLs on options update.
 * Else the queries will return more than one result even when URLs were uniquely bookmarked before.  
 */
function updateGhostifyBookmarks()
{

      // no ghosts:
      var searching = browser.bookmarks.search({url: urlsToGhostify[0]});
      searching.then((bookmarks) => {
        if (bookmarks.length < 1)
            return;
        ghostifyBookmarks[0] = bookmarks[0];
      });
      var searching = browser.bookmarks.search({url: urlsToGhostify[1]});
      searching.then((bookmarks) => {
        if (bookmarks.length < 1)
            return;
        ghostifyBookmarks[1] = bookmarks[0];
      });

}


// TODO listen for bookmarks.onCreated and bookmarks.onRemoved once Bug 1221764 lands


// update when the extension loads initially
init();

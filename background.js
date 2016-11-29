var ghostifyBookmarks; ghostifyBookmarks = [];
var ghostBookmarks; ghostBookmarks = [];

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
	gettingOptions.then(
		function(item) {
			var urlsToGhostifyCandidates = [];
			urlsToGhostifyCandidates = item.urlsToGhostify.trim().split(/\s+/); 
			urlsToGhostify = urlsToGhostifyCandidates;
			// store the bookmarks that are to be ghostified:
			updateGhostifyBookmarks();
		}
		, onError
	);

	gettingOptions = browser.storage.local.get("urlGhosts");
	gettingOptions.then(
		function(item) {
			/*alert(uneval(item));*/
			var urlGhostsCandidates = [];
			urlGhostsCandidates = item.urlGhosts.trim().split(/\s+/);
			urlGhosts = urlGhostsCandidates;
			// store the bookmarks that are to be ghostified:
			updateGhostBookmarks();
		}
 		, onError
	);

	gettingOptions = browser.storage.local.get("isHidden");
	gettingOptions.then(
		function(item) {
			/*alert(uneval(item));*/
			// store the bookmarks that are to be ghostified:
			isHidden = item.isHidden;
		}
 		, onError
	);

}



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


function hide()
{
	
  isHidden = true;
  // Required because it is unknown when the browser terminates/resets and persistence is desired.
  browser.storage.local.set({
    isHidden: true 
  });
				updateIcon();

}


function unhide()
{
	
  isHidden = false;
  // Required because it is unknown when the browser terminates/resets and persistence is desired.
  browser.storage.local.set({
    isHidden: false 
  });
				updateIcon();

}


/*
 * Toggle the bookmark on the current page.
 */
function toggleBookmark()
{

  // Init also sets isHidden to the current value (loading from options storage).
  init();

  if (urlsToGhostify.length < 1 || urlGhosts.length < 1)
  {
    console.log('No options loaded yet or are empty.');
    browser.runtime.openOptionsPage();
    return;
  }

  for (var index = 0; index < urlsToGhostify.length; ++index)
  {
    var bookmark = ghostifyBookmarks[index];
    var ghostBookmark = ghostBookmarks[index];
    var urlToGhostify = urlsToGhostify[index];
    var urlGhost = urlGhosts[index];
    // The following is kept as feedback for when the bookmark data is loaded. (Ghost bookmarks must not necessarily exist.)
    if (!bookmark)
    {
        console.log("Error: No bookmark loaded: " + bookmark + "ghostifyBookmarks: " + ghostifyBookmarks);
    }
    //if (bookmark.url != urlToGhostify)
    // Swap the urls because else urls may get lost.
    if (isHidden)
    {
        // Swap/exchange bookmark data to original state:
        //browser.bookmarks.remove(currentBookmark.id);
        var updating = browser.bookmarks.update(bookmark.id, {title: bookmark.title, url: urlToGhostify});
        updating.then(function(bookmark) {
		  console.log("isHidden: " + isHidden + " was: true => did reset bookmark: " + uneval(bookmark));
        });
        var updating = browser.bookmarks.update(ghostBookmark.id, {title: ghostBookmark.title, url: urlGhost});
        updating.then(function(bookmark) {
		  console.log("isHidden: " + isHidden + " was: true => did reset ghost bookmark: " + uneval(ghostBookmark));
        });
    }
 	else // not hidden
	{
		// Hide original data / swap bookmark data:
        //var creating = browser.bookmarks.create({title: currentTab.title, url: currentTab.url});
        //creating.then(function(bookmark) {
        //  currentBookmark = bookmark;
        //});
        var updating = browser.bookmarks.update(bookmark.id, {title: ghostBookmark.title, url: urlGhost});
        updating.then(function(bookmark) {
          //ghostifyBookmarks[index].url = bookmark.url;
		  console.log("isHidden: " + isHidden + " was: false => did ghostify bookmark: " + uneval(bookmark));
        });
        var updating = browser.bookmarks.update(ghostBookmark.id, {title: bookmark.title, url: urlToGhostify});
        updating.then(function(bookmark) {
		  console.log("isHidden: " + isHidden + " was: false => did unghostify ghost bookmark: " + uneval(ghostBookmark));
        });
    }
  }

    // Toggle hidden flag no matter when the promises are fulfilled: (Prior to that, the promises changed it
    //  and the next loop iteration reacted but should not!)
    isHidden = !isHidden;


}

browser.browserAction.onClicked.addListener(toggleBookmark);

function updateGhostifyBookmarks()
{
      for (var i = 0; i < urlsToGhostify.length; ++i)
      {
	      var searching = browser.bookmarks.search({url: urlsToGhostify[i]});
	      searching.then((bookmarks) => {
	        if (bookmarks.length < 1)
	            return;
	        ghostifyBookmarks[i] = bookmarks[0];
	      });
      }
}


function updateGhostBookmarks()
{

      // ghosts:
      for (var i = 0; i < urlGhosts.length; ++i)
      {
	      var searching = browser.bookmarks.search({url: urlGhosts[i]});
	      searching.then((bookmarks) => {
	        if (bookmarks.length < 1)
	            return;
	        ghostBookmarks[i] = bookmarks[0];
	      });
      }

}



function onMessage(request, sender, sendResponse)
{
	// ensure valid loaded ghostifyBookmarks in case the options are updated but toggle action is not triggered.
	// TODO With the tab code to workaround not fulfilled promises or inavailability of bookmarks, this might be superfluous. 
	// FIXME This message never arrives because the promise is never fulfilled. Just like with the bookmark promises.
	if (request.message == "urls_stored")
		init();
	sendResponse({response: "Called init function. Thanks for the information."});
}


// TODO listen for bookmarks.onCreated and bookmarks.onRemoved once Bug 1221764 lands


// update when the extension loads initially
init();

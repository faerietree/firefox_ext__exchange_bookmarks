var ghostifyBookmarks;
var ghostBookmarks;

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
	var gettingUrlsToGhostify = browser.storage.local.get("urlsToGhostify")
		.then(
		function(item1) {
			var urlsToGhostifyCandidates = [];
			urlsToGhostifyCandidates = item1.urlsToGhostify.trim().split(/\s+/);
			urlsToGhostify = urlsToGhostifyCandidates;
		}
		, onError
		).then(updateGhostifyBookmarks, onError);

	var gettingUrlGhosts = browser.storage.local.get("urlGhosts")
		.then(
		function(item2) {
			/*alert(uneval(item2));*/
			var urlGhostsCandidates = [];
			urlGhostsCandidates = item2.urlGhosts.trim().split(/\s+/);
			urlGhosts = urlGhostsCandidates;
		}
		 , onError
		).then(updateGhostBookmarks, onError);

	var gettingIsHidden = browser.storage.local.get("isHidden").then(
		function(item3) {
			/*alert(uneval(item3));*/
			// store the bookmarks that are to be ghostified:
			isHidden = item3.isHidden;
		}
		 , onError
	);

	Promise.all([gettingUrlsToGhostify, gettingUrlGhosts, gettingIsHidden])
		// TODO Is this now giving the itemX or the result of the updateXBookmark promise?
		//.spread(function(item1, item2, item3) {
		//	console.log(item1, item2, item3);
		//	swapBookmarks(item1, item2, item3);
		//};
		.then(
			exchangeBookmarks, onError
		);
}



function updateIcon()
{
	browser.browserAction.setIcon({
		path: isHidden ? {
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
function exchangeBookmarks()
{


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
		var urlGhost = urlGhosts[index] || "";  // replacing by no url is supported if bookmark validator not prevents.
		// The following is kept as feedback for when the bookmark data is loaded. (Ghost bookmarks must not necessarily exist.)
		if (!bookmark)
		{
			console.log("Error: No bookmark loaded: " + bookmark);
			console.log("ghostifyBookmarks: " + uneval(ghostifyBookmarks) + "ghostBookmarks: " + uneval(ghostBookmarks));
			console.log("urlsToGhostify: " + uneval(urlsToGhostify) + " urlGhosts: " + uneval(urlGhosts));
			return;
		}

		//if (!isHidden)
		//{
			//// Hide original data / swap bookmark data:
			// or browser.bookmarks.remove(currentBookmark.id);
		//}
		//else // currently hidden => show
		//{
			//// Recreate bookmark data according to original state:
			//var creating = browser.bookmarks.create({title: currentTab.title, url: currentTab.url});
			//creating.then(function(bookmark) {
				//currentBookmark = bookmark;
			//});
			//console.log("isHidden: " + isHidden + " was: true => did reset bookmark: " + uneval(bookmark));
			//console.log("isHidden: " + isHidden + " was: true => did reset ghost bookmark: " + uneval(ghostBookmark));
		//}

		// Swap the urls because else urls may get lost.
		console.log("b: isHidden: " + isHidden + " toggle from " + uneval(bookmark));
		var updating = browser.bookmarks.update(bookmark.id, {title: ghostBookmark.title, url: urlGhost});
		updating.then(function(b) {
			console.log("[b] isHidden: " + isHidden + " toggle from (see approx. b) " + uneval(bookmark) + " to " + uneval(b));
		});
		console.log("gB: isHidden: " + isHidden + " toggle from " + uneval(bookmark));
		var updating = browser.bookmarks.update(ghostBookmark.id, {title: bookmark.title, url: urlToGhostify});
		updating.then(function(b) {
			console.log("[gB] isHidden: " + isHidden + " toggle from (see approx. gB) " + uneval(ghostBookmark) + " to " + uneval(b));
		});
	}

	// Toggle hidden flag no matter when the promises are fulfilled: (Prior to that, the promises changed it
	//  and the next loop iteration reacted but should not!)
	if (isHidden)
	{
		unhide();
	}
	else
	{
		hide();
	}


}


browser.browserAction.onClicked.addListener(init);

function loadGhostifyBookmarks(arr)
{
	// serial asynchronous call, see stackoverflow.com/questions/24660096/correct-way-to-write-loops-for-promise#answer-24985483
	return arr.reduce(function(promise, arr_entry) {
		return promise.then(function() {
			return updateGhostifyBookmark(arr_entry);
		});
	}, Promise.resolve());
}


function updateGhostifyBookmarks()
{
	// Without this line, it leads to TypeError: ghostifyBookmarks[index] = bookmarks[0]; in updateGhostifyBookmark:
	ghostifyBookmarks = [];
	var indices = [];
	for (var i = 0; i < urlsToGhostify.length; ++i)
		indices[i] = i;
	return loadGhostifyBookmarks(indices).then(function() {
		console.log("Loaded bookmarks for " + urlsToGhostify);
	}, onError);
}


function updateGhostifyBookmark(index)
{
	var searching = browser.bookmarks.search({url: urlsToGhostify[index]});
	return searching.then((bookmarks) => {
		console.log(index + ": updateGhostifyBookmarks promise fulfilled: " + uneval(bookmarks));
		if (bookmarks.length < 1)
			return;
		ghostifyBookmarks[index] = bookmarks[0];
	}, onError);
}


function updateGhostBookmarks()
{
	ghostBookmarks = [];

	// ghosts:
	for (var i = 0; i < urlGhosts.length; ++i)
	{
		var searching = browser.bookmarks.search({url: urlGhosts[i]});
		searching.then((bookmarks) => {
			if (bookmarks.length < 1)
				return;
			console.log(i + ": <- problem!! correct: " + ghostBookmarks.length + ": updateGhostBookmarks promise fulfilled: " + uneval(bookmarks));
			ghostBookmarks[ghostBookmarks.length] = bookmarks[0];
		}, onError);
	}

}


function onMessage(request, sender, sendResponse)
{
	// ensure valid loaded ghostifyBookmarks in case the options are updated but toggle action is not triggered.
	// FIXME This message never arrives because the promise is never fulfilled. Just like with the bookmark promises.
	if (request.message == "urls_stored")
		init();
	sendResponse({response: "Called init function. Thanks for the information."});
}


// TODO listen for bookmarks.onCreated and bookmarks.onRemoved once Bug 1221764 lands



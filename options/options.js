function saveOptions(e)
{
  browser.storage.local.set({
    urlsToGhostify: document.querySelector("#urlsToGhostify").value,
    urlGhosts: document.getElementById("urlGhosts").value
  });
  // They are not always loaded. TODO If this fails, then listen to tab event which did work. 
  notifyBackgroundScript();
}


function notifyBackgroundScript(e)
{
  var sending = browser.runtime.sendMessage({
	  message: "urls_stored"  // TODO Use Enumeration
  });
  sending.then(onResponse, onError);
}


function onResponse(messsage)
{
	console.log("Message from the background script: " + message);
}


function onError(messsage)
{
	console.log(`Error: ${error}`);
}


// Handle the promise:
function restoreOptions()
{
  function setCurrentChoice(result)
  {
    document.querySelector("#urlsToGhostify").value
         = result.urlsToGhostify || "http://burgauwka.duckdns.org:8011/control/userimage.html http://burgauwka.duckdns.org:8012/control/userimage.html";

    document.querySelector("#urlGhosts").value
         = result.urlGhosts || "http://burgauwka.duckdns.org:8014/control/userimage.html http://burgauwka.duckdns.org:8015/control/userimage.html";
  
  }

  function onError(error)
  {
    console.log(`Error: ${error}`);
  }

  var getting = browser.storage.local.get("urlsToGhostify");
  getting.then(setCurrentChoice, onError);

}


document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);


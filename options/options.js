function saveOptions(e)
{
  browser.storage.local.set({
    urlsToGhostify: document.querySelector("#urlsToGhostify").value,
    urlGhosts: document.getElementById("urlGhosts").value
  });

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


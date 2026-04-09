function getUserData(usernames, items) {
  var results = {};
  for (var i = 0; i < usernames.length; i++) {
    var key = usernames[i];
    results[key] = items[key];
  }
  return results;
}

function pruneExpiredEntries(callback) {
  chrome.storage.local.get(null, function(items) {
    var expiredKeys = [];
    var now = Date.now();
    var keys = Object.keys(items);

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var value = items[key];

      if (typeof value !== 'string') {
        continue;
      }

      try {
        var info = JSON.parse(value);
        if (info && typeof info.expire === 'number' && now > info.expire) {
          expiredKeys.push(key);
        }
      } catch (error) {
        // Ignore non-JSON and legacy values.
      }
    }

    if (!expiredKeys.length) {
      callback();
      return;
    }

    chrome.storage.local.remove(expiredKeys, callback);
  });
}

function handleMessage(request, sendResponse) {
  if (request.method == "getAllLocalStorage") {
    chrome.storage.local.get(null, function(items) {
      sendResponse({ data: items });
    });
  }
  else if (request.method == "getLocalStorage") {
    chrome.storage.local.get([request.key], function(items) {
      sendResponse({ data: items[request.key] });
    });
  }
  else if (request.method == "setLocalStorage") {
    chrome.storage.local.set({
      [request.key]: request.value
    }, function() {
      sendResponse({});
    });
  }
  else if (request.method == "getUserData") {
    chrome.storage.local.get(request.usernames, function(items) {
      sendResponse({ data: getUserData(request.usernames, items) });
    });
  }
  else {
    sendResponse({});
  }
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  pruneExpiredEntries(function() {
    handleMessage(request, sendResponse);
  });
  return true;
});

chrome.runtime.onInstalled.addListener(function() {
  pruneExpiredEntries(function() {});
});

chrome.runtime.onStartup.addListener(function() {
  pruneExpiredEntries(function() {});
});

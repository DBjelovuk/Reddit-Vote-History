var voteHistoryDB = null;

var request = indexedDB.open("rVoteHistory", 1);

request.onsuccess = function(e) {
	voteHistoryDB = e.target.result;
};

request.onupgradeneeded = function(e) {
	var db = e.target.result;

	if (db.objectStoreNames.contains("user"))
		db.deleteObjectStore("user");
	
	db.createObjectStore("user", {keyPath: "userName"});
};

chrome.runtime.onInstalled.addListener(function (details) {
	if (details.reason === "install" || details.reason === "update") {
		chrome.notifications.onButtonClicked.addListener(reviewsRedirect);
		chrome.notifications.onClicked.addListener(reviewsRedirect);

		function reviewsRedirect(id, buttonIndex) {
			if (id === "voteHistory") {
				if (buttonIndex !== 1)
					chrome.tabs.create({url:"https://chrome.google.com/webstore/detail/reddit-vote-history/ghjjjcefmjimocidgninghmnbbpjonbo/reviews"});
				chrome.notifications.clear(id);
			}
		}

		var ops = {
			type: "basic", 
			iconUrl: "assets/icon.png",
			title: "Reddit Vote History", 
			message: "Please consider rating or reviewing if you haven't already!",
			buttons: [{title: "Sure!"}, {title: "No thanks / Already have"}],
			isClickable: true
		};
		chrome.notifications.create("voteHistory", ops);
	}
});

chrome.runtime.onMessage.addListener(function(message, sender) {
	if (message.comment)
		updateRecord(message.realName, message.comment, message.voteAdded);
	else if (message.from === 'background') {
		if (message.comments)
			updateComments(message.userName, message.comments);
		else
			getUser(message.userName, sender);
	}
});

function updateRecord(realName, comment, voteAdded) {
	var userName = realName.toLowerCase();
	var trans = voteHistoryDB.transaction("user", "readwrite");
	var store = trans.objectStore("user");
	var userReq = store.get(userName);

	userReq.onsuccess = function(e) {
		var user = e.target.result;		
		if (voteAdded) {
			if (user) {
				var exists = false;
				for (var i = 0; i < user.comments.length; i++) {
					if (user.comments[i] === comment) {
						exists = true;
						break;
					}
				}
				if (!exists) {
					user.comments.unshift(comment);
					store.put(user);
				}
			}
			else {
				user = {userName:userName, realName:realName, comments:[comment]};
				store.put(user);
			}
		}
		else if (user) {
			for (var i = 0; i < user.comments.length; i++) {
				if (user.comments[i] === comment) {
					user.comments.splice(i,1);
					if (user.comments.length)
						store.put(user);
					else
						store.delete(user.userName);
					break;
				}
			}
		}
	};
}

function getUser(userName, sender) {
	var trans = voteHistoryDB.transaction("user", "readonly");
	var store = trans.objectStore("user");
	var userReq = store.get(userName);
	userReq.onsuccess = function(e) {
		chrome.tabs.sendMessage(sender.tab.id, {from:'dao', user:e.target.result})
	};
}

function updateComments(userName, comments) {
	var trans = voteHistoryDB.transaction("user", "readwrite");
	var store = trans.objectStore("user");
	if (comments.length) {
		var userReq = store.get(userName);
		userReq.onsuccess = function(e) {
			var user = e.target.result;
			user.comments = comments;
			store.put(user);
		};
	}
	else
		store.delete(userName);
}
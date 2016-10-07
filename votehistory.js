$(window).bind('hashchange', function() {
	window.location.reload();
});

var startComment = 0;
var allData;
var userVal;
var userName;
var comments;
var commentsHTML = [];
var loaderOps = {segments:8, steps:3, opacity:0.2, space:0.1, speed:1.8, length:5, color:'#369'};

$(document).ready(function() {
	userVal = window.location.hash.slice(1).toLowerCase();	
	$('form').submit(function() {
		var searchInput = $('input').val();
		window.location.hash = '#' + searchInput;
	});
	$('div#loadArea span').click(loadClicked);
	
	chrome.runtime.sendMessage({from:'background', userName:userVal});
});

chrome.runtime.onMessage.addListener(function(message) {
	if (message.from === 'dao')
		initialize(message.user);
});

function initialize(user) {
	if (user) {
		$('div#loadArea').activity(loaderOps);
		userName = user.realName;
		$('title').append(userName);
		$('h1#userName').html(userName);
		comments = user.comments;
		loadComments();
	}
	else {
		$('title').append(userVal);
		$('h1#userName').html(userVal);
		$('div#comments').css({'text-align':'center','padding-top':'30px'}).html('No voted comments.');
	}
}

function loadComments() {
	var endComment = startComment + 10;
	for (var i = startComment; i < endComment; i++) {
		if (comments[i]) {
			getComment(i);
			startComment = i + 1;
		}
		else break;
	}	
}

function getComment(index) {
	$.ajax({
		url: 'http://www.reddit.com/api/info.json?id=t1_' + comments[index],
		dataType: 'json',
		cIndex: index,
		success: function(comment) {
			var index = this.cIndex;
			var cmtData = comment.data.children[0].data;
			var comment = $('<div class="comment">');
			// Arrow
			var arrow = $('<div class="arrow">');
			if (!cmtData.likes)
				arrow.addClass('down');
			comment.append(arrow);
			
			var main = $('<div class="main">');
			var tagline = $('<p class="tagline">');
			tagline.append('<a href="http://www.reddit.com/user/' + userName + '">' + userName + '</a>');
			tagline.append('<span>' + (cmtData.ups - cmtData.downs) + ' points</span>');
			tagline.append('<span>' + moment.unix(cmtData.created_utc).fromNow() + '</span>');
			main.append(tagline);
			// Text
			main.append($("<div>").html(cmtData.body_html).text());
			
			// Link
			getPermalink(cmtData.link_id, function(url) {
				url += comments[index];
				var buttons = $('<div class="buttons">');
				buttons.append('<a href="'+url+'">permalink</a>');
				buttons.append('<a href="'+url+'?context=3">context</a>');
				var deleteButton = $('<span>delete</span>');				
				deleteButton.click(comments[index], deleteComment);
				buttons.append(deleteButton);
				
				main.append(buttons);
				
				comment.append(main);
				commentsHTML[index] = comment;
			});
		},
		error: function(error) {
			// getComment(this.cIndex);
		}
	});
}

function getPermalink(linkId, callback) {
	$.ajax({
		url: 'http://www.reddit.com/api/info.json?id=' + linkId,
		dataType: 'json',
		success: function(link) {
			var url = 'http://www.reddit.com' + link.data.children[0].data.permalink;
			callback(url);
		},
		error: function(error) {
			// getPermalink(linkId, callback);
		}
	});
}

$(document).ajaxStop(function() {
	for (var i = 0; i < commentsHTML.length; i++) {
		$('div#comments').append(commentsHTML[i]);
	}
	if (comments[startComment])
		$('div#loadArea span').css('visibility','visible');
	else
		$('div#loadArea span').css('visibility','hidden');
	commentsHTML = [];
	$('div#loadArea').activity(false);
});

function deleteComment(event) {
	$(this).css('cursor','default').closest('div.comment').slideUp(200);
	var comment = event.data;
	for (var i = 0; i < comments.length; i++) {
		if (comment === comments[i]) {
			comments.splice(i, 1);
			startComment--;
			break;
		}
	}	
	chrome.runtime.sendMessage({from:'background', userName:userVal, comments:comments});
}

function loadClicked(event) {
	$(event.target).css('visibility','hidden');
	$('div#loadArea').activity(loaderOps);
	loadComments();
}
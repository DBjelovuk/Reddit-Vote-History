$(document).ready(function() {
	if ($('#header-bottom-right').children('span.user').children('.userkarma').length) {
		var url = chrome.extension.getURL('votehistory.html');
		
		function prepComment() {
			var comment = $(this);
			var entry = comment.children('div.entry');
			var userName = $(entry[0].firstChild).find('a.author').html();
			
			if (userName) {
				var voteHistory = $('<li><a class="votehistory" href="'+url+'#'+userName +'">vote history</a></li>');
				entry.find('ul.flat-list').children().has('a.give-gold').after(voteHistory);
				
				var arrows = comment.children('div.midcol').find('div.arrow');
				arrows.data('userName', userName);
			}
		}
		
		$('div.comment').each(prepComment);
		
		$(document).on('click', 'div.arrow', function() {
			arrow = $(this);
			var userName  = arrow.data('userName');
			if (userName) {
				var voteAdded = arrow.hasClass('upmod') || arrow.hasClass('downmod');
				var commentId = arrow.closest('div.comment').data('fullname').slice(3);	// Get comment id
				
				chrome.runtime.sendMessage({realName:userName, comment:commentId, voteAdded:voteAdded});
			}
		});
		
		$('span.morecomments').click(function() {
			var observer = new MutationObserver(function(mutations) {
				var moreComments = [];
				mutations.forEach(function(mutation) {
					for (var i = 0; i < mutation.addedNodes.length; i++) {
						var node = mutation.addedNodes[i];
						if (node.classList && node.classList.contains('comment'))
							moreComments.push(node);
					}
				});
				$(moreComments).each(prepComment);
				observer.disconnect();
			});
			var child = $(this).closest('.child');
			var config = { childList: true, subtree: true };
			observer.observe(child[0], config);
		});
	}
});
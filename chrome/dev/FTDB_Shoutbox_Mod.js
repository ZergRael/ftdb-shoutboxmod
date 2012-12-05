// ==UserScript==
// @name            FTDB Shoutbox Mod
// @namespace       http://thetabx.net
// @description     Améliorations et ajout de fonctions pour la Shoutbox de FTDB
// @include         *://*.frenchtorrentdb.com/?section=COMMUNAUTE*
// @downloadURL     https://thetabx.net/download/ftdb/smod/FTDB_Shoutbox_Mod.user.js
// @updateURL       https://thetabx.net/download/ftdb/smod/FTDB_Shoutbox_Mod.meta.js
// @version         0.7.6
// ==/UserScript==

// Changelog (+ : Addition / - : Delete / ! : Bugfix / § : Issue / * : Modification)
// From 0.7.2
// + Antiflood filter
// ! Database revsion updater
// + Remove text style effects
// + Torrent name detector
// ! User filter performance
// + Time correction
// From 0.7.3
// - Time correction
// ! Highlight correction
// ! External process rework
// ! Userlist tampon
// + Updated announce
// ! Data management
// ! Smileys names
// ! Long url without resize
// + Notes on users
// + Idletime / last connection

// TODO
// Separate account data / shared computer

///////////////////////////////////////////////
// Use jquery in userscripts
// Can't find the original author of this funct
// But whoever you are, thanks :)
///////////////////////////////////////////////
function with_jquery(f) {
	var script = document.createElement("script");
	script.type = "text/javascript";
	script.textContent = "(" + f.toString() + ")(jQuery)";
	document.body.appendChild(script);
}

with_jquery(functionsion ($) {
	var shoutboxUpdateEv = document.createEvent('shoutboxUpdateEv');
	var userlistUpdateEv = document.createEvent('userlistUpdateEv');
	$("#website").bind("ajaxSuccess", function(event, request, options) {
		if(options.url.indexOf("/?section=COMMUNAUTE&module=mod_shoutbox&ajax=1&mod_ajax=1&dum=") != -1 || options.url.indexOf("?section=COMMUNAUTE&module=mod_shoutbox&ajax=1&mod_ajax=1&shoutbox=1&message=") != -1) {
			shoutboxUpdateEv.initEvent ("shoutboxUpdateEv", true, true);
			document.body.dispatchEvent(shoutboxUpdateEv);
		}
		if(options.url.indexOf("/?section=COMMUNAUTE&module=mod_shoutbox&ajax=1&mod_ajax=1&uonline=1dum=") != -1) {
			shoutboxUpdateEv.initEvent ("userlistUpdateEv", true, true);
			document.body.dispatchEvent(userlistUpdateEv);
		}
		console.log("UPDATE");
	});
});

// Lets check shoutbox presence
if (!$("#mod_shoutbox").length) { return; }

// General info stuff
var debug = true, revision = 75, scriptVersion = '0.7.6';
var dt = new Date().getTime();

// Debug
var debugMessages = [];
var dbg = function (str) {
	var dd = new Date();
	var debugMessage = "[" + dd.getHours() + ":" + dd.getMinutes() + ":" + dd.getSeconds() + ":" + dd.getMilliseconds() + "] " + str;
	if(debug) { 
		console.log(debugMessage);
	}
	debugMessages.push(debugMessage);
	if(debugMessages.length > 20) {
		debugMessages.shift();
	}
};
var sendReport = function (err) {
	dbg("[Error] Error found, sending report");
	var debugData = {debug_messages: debugMessages};
	var vDebug = ""; 
	for (var prop in err) {  
		vDebug += "property: "+ prop+ " value: ["+ err[prop]+ "]\n"; 
	}
	vDebug += "toString(): " + " value: [" + err.toString() + "]"; 
	debugData.error = vDebug; 
	$.ajax({
		type: 'POST',
		url: urls.debug + calcMD5(uMyself) + '/',
		data: debugData,
		dataType: 'json'
	});
};
window.debugShoutboxMod = function () {
	var debugData = [];
	$.each(optionsDB.opt, function (k, v) {
		if(v.type != "button") {
			var debugString = "optionsDB[" + k + "] : " + optionsDB.get(k);
			debugData.push(debugString);
			dbg(debugString);
		}
	});
	$.each(userData.data, function (k, v) {
		$.each(v, function (k2, v2) {
			var debugString = "userData[" + k + "][" + k2 + "] : " + v2;
			debugData.push(debugString);
			dbg(debugString);
		});
	});
	$.each(userDB.users, function (k, v) {
		$.each(v, function (k2, v2) {
			var debugString = "userDB[" + k + "][" + k2 + "] : " + v2;
			debugData.push(debugString);
			dbg(debugString);
		});
	});
	$("#MAIN").prepend("Copiez le texte ci-dessous et envoyez le en MP à ZergRael. Merci ! |", debugData.join("|"));
};
window.resetShoutboxMod = function () {
	optionsDB.clearAll();
	$.each(userData.data, function (k) {
		userData.clearData(k);
	});
	storageSetValue("data_saved", false);
	userDB.clearUsers();
	alert("ShoutboxMod data cleared !");
	window.location.reload();
};

/////////////////////////////////////
// prepareShoutbox()
// prepare the Shoutbox for inversion
/////////////////////////////////////
var processLink;
var prepareShoutbox = function () {
	processLink = (optionsDB.get("avoidprotocolchange") || optionsDB.get("linknewtab") || optionsDB.get("highlightuser") || optionsDB.get("highlightquote") || optionsDB.get("autolinks"));
	$("#mod_shoutbox").prepend('<div class="frame" id="SHOUT_MESSAGE"></div>');
	$('#TQC_SHOUT_MESSAGE').hide();
	$("#SHOUT_MESSAGE").bind("ajaxUpdateEv", shoutBox_OnChange).trigger("ajaxUpdateEv");
};

//////////////////////////////////////////////////////////////
// shoutBox_OnChange()
// Reverse shoutbox, highlight, link replacement & images mods
//////////////////////////////////////////////////////////////
var stickyScroll = true, lastOriginalHtmlBeforeProcess, messageCount = 0, lastTimestamp;
var shoutBox_OnChange = function (event, request, options) {
	if(options) {
		if(options.url.indexOf("/?section=COMMUNAUTE&module=mod_shoutbox&ajax=1&mod_ajax=1&dum=") == -1 && options.url.indexOf("?section=COMMUNAUTE&module=mod_shoutbox&ajax=1&mod_ajax=1&shoutbox=1&message=") == -1) { return; }

		var timestamp = options.url.match("\\d{13}");
		dbg("[Shoutbox] tt: " + timestamp + " | lastTT: " + lastTimestamp + " | evTT: " + event.timeStamp + " | ttDiff: " + (event.timeStamp - timestamp));
		if(optionsDB.get("ping")) {
			$("#box_mod_shoutbox h1").text("Shoutbox (Ping: " + (event.timeStamp - timestamp) + "ms)");
		}
		if((timestamp < lastTimestamp) || (event.timeStamp - timestamp) > 4000) {
			dbg("[Shoutbox] TOO LATE");
			lastTimestamp = timestamp;
			return;
		}

		dbg("[Shoutbox] In time");
		lastTimestamp = timestamp;
	}
	
	var pureTimestamp = new Date().valueOf();
	var lastOriginalHtmlDuringProcess = $("#TQC_SHOUT_MESSAGE ul:first").html();
	dbg("[Shoutbox] Analysis");
	var foundLastMessage = (!$("#SHOUT_MESSAGE ul").length);
	var notifySound = false;
	var iMess = 0;
	var lastMessage = false;

	$($("#TQC_SHOUT_MESSAGE ul").get().reverse()).each(function () {
		var message = $(this);

		if(!foundLastMessage) {
			if(message.html() == lastOriginalHtmlBeforeProcess) {
				foundLastMessage = true;
			}
			lastMessage = message.html();
			return;
		}

		if(message.html() == lastOriginalHtmlBeforeProcess || lastMessage == message.html()) {
			lastMessage = message.html();
			return;
		}

		lastMessage = message.html();
		iMess++;
		var showThisMessage = true;
		// Images/Smiley process
		message.find("img").each(function () {
			if($(this).hasClass("bbcode_smiley")) {
				if(optionsDB.get("hidesmileys")) {
					$(this).replaceWith($(this).attr("alt"));
				}
			}
			else {
				if(optionsDB.get("hideimages")) {
					$(this).replaceWith('<a href="' + $(this).attr("src") + '">' + $(this).attr("src") + '</a>');
				}
				else {
					$(this).bind("load", function () { scrollNow(); });
					if(optionsDB.get("linkimages")) {
						var imgParent = $(this).parent();
						if(!imgParent.is("a")) {
							$(this).wrap('<a href="' + $(this).attr("src") + '"></a>');
						}
					}
				}
			}
		});

		// Flash process
		if(optionsDB.get("hideflash")) {
			message.find("embed").each(function () {
				$(this).replaceWith('<a href="' + $(this).attr("src") + '">' + $(this).attr("src") + '</a>');
			});
		}

		// User highlight process
		var secureNickU = toSecure(message.find("a").first().text());
		var me = message.find(".me");
		if(me.length) {
			secureNickU = toSecure(me.text().split(" ")[0]);
		}
		message.addClass("u_" + secureNickU);

		// Colors process
		if(optionsDB.get("hidecolor")) {
			message.find('span[style*="color"]').each(function () {
				$(this).replaceWith($(this).text());
			});
			message.find('b').unwrap();
			message.find('i').unwrap();
			message.find('u').unwrap();
			message.find('strike').unwrap();
		}

		// Torrent name detector
		if(optionsDB.get("detectlinks")) {
			var searchText = $(this).text().match("(?:[\\w\\d]*\\.[\\w\\d]*){2,12}-[\\w\\d]*");
			if(searchText) {
				$(this).html($(this).html().replace(searchText, '<a href="/?section=TORRENTS&name=' + searchText + '&search=Rechercher&exact=1">' + searchText + '</a>'));
			}
		}
		
		// Links process
		if(processLink) {
			if(me.length) {
				if(optionsDB.get("banlist") && userDB.isIgnored(secureNickU)) {
					showThisMessage = false;
				}
				else {
					if(usersList[secureNickU]) {
						usersList[secureNickU].lastAct = pureTimestamp + iMess;
					}
				}
			}

			message.find("a").each(function (i) {
				var aLink = $(this);
				if(optionsDB.get("linknewtab")) {
					aLink.attr("target", "blank_");
				}

				if(aLink.attr("class") && aLink.attr("class").indexOf("class_") != -1) {
					var secureNick = toSecure(aLink.text());
					if(i === 0 && !me.length) {
						if(optionsDB.get("banlist") && userDB.isIgnored(secureNick)) {
							showThisMessage = false;
						}
						else {
							if(usersList[secureNick]) {
								usersList[secureNick].lastAct = pureTimestamp + iMess;
							}
							else {
								usersList[secureNick] = { 'secureNick': secureNick, 'userName': aLink.text(), 'hash': aLink.attr("href").substring(29), 'classId': aLink.attr("class").split(" ")[0], 'friend': userDB.isFriend(secureNick), 'ignore': userDB.isIgnored(secureNick), 'note': userDB.getNote(secureNick), 'incomming': false, 'lastAct': pureTimestamp + iMess, 'connected': false };
							}
						}
					}

					if(optionsDB.get("shoutbanlist")) {
						createContextMenu(aLink, secureNick);
					}

					if(secureNick == uMyself && (i !== 0 || me.length) && optionsDB.get("highlightquote")) {
						message.addClass("highlight_quote");
						if(showThisMessage) {
							notifySound = true;
						}
					}
					
					if(optionsDB.get("highlightuser")) {
						aLink.hover(function () {
							$(".u_" + secureNick).addClass("highlight_mouseover");
						}, function () {
							$(".u_" + secureNick).removeClass("highlight_mouseover");
						});
					}
					
					return;
				}
				
				var aHref = aLink.attr("href");
				var aHtml = aLink.text();
				var pUrl = parseUrl(aHref);
				if(!pUrl) { return; }
				
				if(optionsDB.get("avoidprotocolchange")) { 
					var aCrafted = craftUrl(pUrl);
					if(aHref == aHtml) {
						aLink.text(aCrafted);
					}
					aLink.attr("href", aCrafted);
				}
				
				if(optionsDB.get("autolinks") && aHref == aHtml && pUrl.data) {
					if(pUrl.data.section == "FORUMS" && pUrl.data.forum_id && pUrl.data.topic_id) {
						pUrl.data.ajax = 1;
						pUrl.data.module = "mod_forums";
						$.get(craftUrl(pUrl), function (data) { 
							var title = $(data).find("h4").html();
							if(title) {
								aLink.html("[Forum : " + title + "]");
							}
							else {
								aLink.html("[Forum : (Topic introuvable !)]");
							}
						});
					}

					if(pUrl.data.section == "INFOS" && (pUrl.data.hash || pUrl.data.id)) {
						delete pUrl.data.menu;
						pUrl.data.ajax = 1;
						pUrl.data.module = "mod_infos";
						$.get(craftUrl(pUrl), function (data) { 
							var title = $(data).find("h3").html();
							if(title) {
								aLink.html("[Torrent : " + title + "]");
							}
							else {
								aLink.html("[Torrent : (Fiche introuvable !)])");
							}
						});
					}
				}
			});	
		}
		if(optionsDB.get("revertshout")) {
			message.appendTo("#SHOUT_MESSAGE").hide();
		}
		else {
			message.prependTo("#SHOUT_MESSAGE").hide();
		}

		if(filtering !== "" && filtering != secureNickU) {
			showThisMessage = false;
		}
		if(showThisMessage) {
			if(isWindowFocused) {
				message.fadeIn(optionsDB.get("fade_in_duration"));
			}
			else {
				message.show();
			}
			messageCount++;
		}
	});

	// Sound process
	if(notifySound) {
		playNotification("quote");
	}

	lastOriginalHtmlBeforeProcess = lastOriginalHtmlDuringProcess;
	
	cleanOldMessages();	
};

var cleanOldMessages = function() {
	var scrollUp = 0;
	while($("#SHOUT_MESSAGE ul").length > optionsDB.get("messages_to_display")) {
		var firstMessage = $("#SHOUT_MESSAGE ul").last();
		if(optionsDB.get("revertshout")) {
			firstMessage = $("#SHOUT_MESSAGE ul").first();
		}
		scrollUp += firstMessage.height();
		firstMessage.remove(); // Remove old messages
	}
	
	scrollNow(scrollUp);
};

////////////////////////////////////
// parseUrl(url)
// Returns an array with splited url
////////////////////////////////////
var parseUrl = function (url) {
	var baseUrl = url.match("^https?:\\/\\/www\\d?\\.frenchtorrentdb\\.com");
	if(!baseUrl) {
		return false;
	}

	var parsedUrl = {};
	parsedUrl.protocol = location.protocol;
	parsedUrl.address = location.hostname;
	url = url.replace(baseUrl, "");

	if(url.indexOf("?") == -1) {
		return parsedUrl;
	}

	url = url.replace("/?", "");

	var hashtag = url.match("#.*$");
	if(hashtag) {
		url = url.replace(hashtag, "");
		parsedUrl.hashtag = hashtag;
	}

	var urlSplit = url.split('&');
	if(!urlSplit.length) {
		return false;
	}

	parsedUrl.firstKey = urlSplit[0].split('=')[0];

	parsedUrl.data = {};
	$.each(urlSplit, function (k, v) {
		var data = v.split('=');
		if(data.length != 2) {
			return false;
		}
		parsedUrl.data[data[0]] = data[1];
	});
	return parsedUrl;
};

//////////////////////////////////////////////////////
// craftUrl(parsedUrl)
// Returns a complete url by concat data from parseUrl
//////////////////////////////////////////////////////
var craftUrl = function (parsedUrl) {
	if(!parsedUrl.data) {
		return parsedUrl.protocol + "//" + parsedUrl.address;
	}

	var craftUrl = parsedUrl.protocol + "//" + parsedUrl.address + "/?";
	$.each(parsedUrl.data, function (k, v) {
		craftUrl += (parsedUrl.firstKey == k ? '' : '&') + k + "=" + v;
	});
	craftUrl += (parsedUrl.hashtag ? parsedUrl.hashtag : '');

	return craftUrl;
};

/////////////////////////////////////////////////////////////////
// addTextToShoutbox(from, fromLink, fromColorClass, htmlContent)
// Adds a new line in chatbox if available
/////////////////////////////////////////////////////////////////
var addTextToShoutbox = function (from, fromLink, fromColorClass, htmlContent) {
	if(!$("#SHOUT_MESSAGE").length) { return; }

	var dm = new Date(), h = dm.getHours(), m = dm.getMinutes(), s = dm.getSeconds();
	var time = (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
	if(optionsDB.get("revertshout")) {
		$("#SHOUT_MESSAGE").append('<ul class="shout_rowalt user_added" style="display: block; "><li class="time">' + time + '</li><li class="msg"> <a class="' + fromColorClass +'" href="' + fromLink + '">' + from + '</a> : ' + htmlContent + '</li></ul>');
	}
	else {
		$("#SHOUT_MESSAGE").prepend('<ul class="shout_rowalt user_added" style="display: block; "><li class="time">' + time + '</li><li class="msg"> <a class="' + fromColorClass +'" href="' + fromLink + '">' + from + '</a> : ' + htmlContent + '</li></ul>');
	}

	cleanOldMessages();
};

/////////////////////////////////////////
// getUMyself()
// Translate username in secured username
/////////////////////////////////////////
var uMyself;
var getUMyself = function () {
	uMyself = toSecure($(".welcome").find("a").first().text());
};

///////////////////////////////
// scrollNow(scrollOffset)
// Scrolls to required location
///////////////////////////////
var scrollNow = function (scrollUp) {
	dbg("[Shoutbox] Scrolling now | stickyScroll : " + stickyScroll);
	var shoutBox = $("#SHOUT_MESSAGE");
	if(!optionsDB.get("revertshout")) { return; }

	var thisScrollUp = (scrollUp ? scrollUp : 0);
	if(stickyScroll) {
		shoutBox.scrollTop(shoutBox[0].scrollHeight); // Scroll to bottom
	}
	else {
		shoutBox.scrollTop(shoutBox.scrollTop() - thisScrollUp); // Stabilize scrolling (due to removal of first elements)
	}
};

//////////////////////////////////
// shoutBox_OnScroll()
// Update sticky on user scrolling
//////////////////////////////////
var shoutBox_OnScroll = function () { 
	var shoutBox = $("#SHOUT_MESSAGE");
	if((shoutBox.scrollTop() + shoutBox.height()) == shoutBox[0].scrollHeight) {
		stickyScroll = true;
	}
	else {
		stickyScroll = false;
	}
};

///////////////////////////////////////////////////////
// prepareUserList()
// Remap the whole user list to display infos/searchbox
///////////////////////////////////////////////////////
var prepareUserList = function () {
	$(".frame_list").hide();
	// Embed the user list & make some space for N connected users
	$("#mod_shoutbox").prepend('<div id="user_list_block"><div id="user_block"><div id="top_userlist"><span id="nConnected">0</span> connectés' + (optionsDB.get("banlist") ? ' <span id="banlist_management"><a href="#" id="list_friend" class="search_banlist">A</a>/<a href="#" id="list_ignore" class="search_banlist">I</a></span>' : '') + '</div><div id="user_list" class="users"><div id="user_change"></div>' + (optionsDB.get("banlist") ? '<div id="friend_list"></div>' : '') + '<div id="connected_list"></div></div></div><div id="search_block"><div id="searchbox"><input type="text" id="searchbox_input"/></div><div id="search_result" class="users"></div></div></div>');
	$("#search_block").hide();
	$("#user_change").hide();
	$("#searchbox").hide();

	$("#user_list_block").mouseleave(function () {
		if($("#search_block").is(":visible")) {
			$("#search_block").hide();
			$("#user_block").show();
			$("#searchbox").hide();
		}
	});

	// Searchbox
	$("#top_userlist").dblclick(function () {
		$("#searchbox_input").val("");
		$("#searchbox").show();
		$("#search_block").show();
		$("#user_block").hide();
		$("#searchbox_input").bind("keyup", function () {
			var usersArray = getUserByNamePartial($("#searchbox_input").val());
			$("#search_result").empty();
			
			$.each(usersArray, function (i, userData) {
				$("#search_result").append(createContextMenu(createUserLink(userData), userData.secureNick));
				dbg("Adding " + i + userData.secureNick);
			});
				
		}).focus().trigger("keyup");
	});

	$(".search_banlist").click(function() {
		var friend = false;
		if($(this).attr("id") == "list_friend") {
			friend = true;
		}
		$("#search_block").show();
		$("#user_block").hide();
		$("#search_result").empty();

		var userArray = [];
		$.each(userDB.users, function (secureNick, data) {
			var aUser = null;
			if(friend && userDB.isFriend(secureNick)) {
				if(usersList[secureNick]) {
					aUser = createUserLink(usersList[secureNick]);
				}
				else {
					aUser = createUserLink(data);
				}
				createContextMenu(aUser, secureNick);
				userArray.push(aUser);
			}
			else if(!friend && userDB.isIgnored(secureNick)) {
				aUser = createUserLink(data);
				createContextMenu(aUser, secureNick);
				userArray.push(aUser);
			}
		});

		$.each(userArray, function (i, user) {
			$("#search_result").append(user);
		});

		return false;
	});

	if(optionsDB.get("banlist")) {
		$.each(userDB.users, function (secureNick, data) {
			if(data.friend) {
				data.secureNick = secureNick;
				var aFriend = createUserLink(data);
				createContextMenu(aFriend, secureNick);
				if(optionsDB.get("highlightuserfromlist")) {
					aFriend.hover(function () {
						$("#mod_shoutbox ul").removeClass("highlight_mouseover");
						$(".u_" + secureNick).addClass("highlight_mouseover");
					}, function () {
						$(".u_" + secureNick).removeClass("highlight_mouseover");
					});
				}
				$("#friend_list").append(aFriend);
			}
		});
	}

	$("#mod_shoutbox").bind("ajaxSuccess", userList_OnChange).trigger("ajaxSuccess");
};

//////////////////////////////
// userList_OnChange()
// Main userlist modifications
//////////////////////////////
var nConnected = 0, usersList = {};
var userList_OnChange = function (event, request, options) {
	if(options && options.url.indexOf("/?section=COMMUNAUTE&module=mod_shoutbox&ajax=1&mod_ajax=1&uonline=1dum=") == -1) { return; }
	
	dbg("[Userlist] onChange");
	
	$("#user_change").empty();
	var lastSecureNick = "";
	$(".frame_list a").each(function () {
		var secureNick = toSecure($(this).text());
		var user = usersList[secureNick];
		var thisClassId = $(this).attr("class").split(" ")[0];
		if(!user) {
			user = { 'secureNick': secureNick, 'userName': $(this).text(), 'hash': $(this).attr("href").substring(29), 'classId': thisClassId, 'friend': userDB.isFriend(secureNick), 'ignore': userDB.isIgnored(secureNick), 'note': userDB.getNote(secureNick), 'incomming': true, 'lastAct': 0 };
		}
		if(!user.connected) {
			user.incomming = true;
		}
		user.going = false;
		user.connected = true;
		user.lastUpdate = 0;

		// Class change
		if(user.classId != thisClassId || (userDB.get(secureNick) && userDB.get(secureNick).classId != thisClassId)) {
			var thisUserA = $("#u_" + secureNick);
			if(thisUserA.length) {
				thisUserA.attr("class", thisUserA.attr("class").replace(user.classId, thisClassId));
				user.classId = thisClassId;
			}
			userDB.updateUserClass(secureNick, thisClassId);
		}

		if(user.incomming) {
			$("#user_change").append(createChangeLink(user).delay(1).animate({"left": 10}, 1800));
			user.incomming = false;
			usersList[secureNick] = user;

			if(user.friend) {
				$("#u_" + secureNick).removeClass("user_friend_disconnected");
				$("#u_" + secureNick).addClass("user_friend_connected");
			}
			else {
				var userA = createUserLink(user);
				if(optionsDB.get("banlist")) {
					createContextMenu(userA, secureNick);
				}

				if(optionsDB.get("highlightuserfromlist")) {
					userA.hover(function () {
						$("#mod_shoutbox ul").removeClass("highlight_mouseover");
						$(".u_" + secureNick).addClass("highlight_mouseover");
					}, function () {
						$(".u_" + secureNick).removeClass("highlight_mouseover");
					});
				}

				if(lastSecureNick !== "") {
					userA.insertAfter("#u_" + lastSecureNick);
				}
				else {
					$("#connected_list").prepend(userA);
				}
			}
			
			nConnected++;
		}
		lastSecureNick = (user.friend ? lastSecureNick : secureNick);
	});

	var tempUsersList = [];
	$.each(usersList, function (k,v) {
		tempUsersList.push([k, v]);
	});
	tempUsersList.sort(function(a,b) { return (a[1].secureNick < b[1].secureNick ? - 1 : 1); });
	usersList = {};
	$.each(tempUsersList, function(i, v) {
		usersList[v[0]] = v[1];
	});

	var hiddenPos = $("#user_list").width();
	$.each(usersList, function (secureNick, userData) {
		if(!userData.connected) { return; }
		if(userData.lastUpdate <= 1) {
			userData.lastUpdate++;
		}
		else {
			userData.going = true;
			if(userData.friend) {
				$("#u_" + secureNick).removeClass("user_friend_connected");
				$("#u_" + secureNick).addClass("user_friend_disconnected");
			}
			else {
				$("#u_" + secureNick).remove();
			}
			$("#user_change").append(createChangeLink(userData).delay(800).animate({"left": hiddenPos}, 1800));
			userData.connected = false;
			nConnected--;
		}
	});

	$("#nConnected").text(nConnected);
	dbg("[Userlist] Users changed : " + $("#user_change a").length);
	if($("#user_change a").length && $("#user_change a").length <= optionsDB.get("user_disable_threshold")) {
		$("#user_change").slideDown(100).delay(2600).slideUp(100);
	}
};

/////////////////////////////////
// createContextMenu()
// Create a context menu on click
/////////////////////////////////
var filtering = "";
var createContextMenu = function (userA, secureNick) {
	var user = usersList[secureNick];
	if(!user) {
		user = userDB.get(secureNick);
		if(!user) { return; }
	}
	userA.click(function (e) {
		if(e.which == 2) { return true; }

		$("#website").append('<div id="context_menu"><div id="context_head">' + user.userName + '</div><div class="context_option"><a href="/?section=ACCOUNT_INFOS&hash=' + user.hash + '" target="blank_">Profil</a></div><div id="write_mp" class="context_option"><a href="/?section=ACCOUNT_INFOS&hash=' + user.hash + '&module=mod_account_sendmsg#box_mod_account_sendmsg" target="blank_">Envoyer un MP</a></div><div class="context_option"><a id="context_friend">' + (userDB.isFriend(secureNick) ? 'Enlever des amis' : 'Ajouter aux amis') + '</a></div><div class="context_option"><a id="context_ignore">' + (userDB.isIgnored(secureNick) ? 'Ne plus ignorer' : 'Ignorer') + '</a></div><div class="context_option"><a id="context_filter">Filtrer</a></div><div class="context_option"><a id="context_note">Note</a></div></div>');
		$("#context_menu").css({ "left": (e.pageX - 15) + "px", "top": (e.pageY - 10) + "px" });
		$("#context_menu").mouseleave(function () { $(this).remove(); });
		$(".context_option").hover(function () { $(this).css({"background-color": "#CCF"}); }, function () { $(this).css({"background-color": "#CCC"}); });
		if(optionsDB.get("inshoutmp")) {
			$("#write_mp").click(function (e2) {
				if(e2.which == 2) { return true; }

				$("#context_menu").remove();
				if(createMPSendFrame(user.hash, user.userName)) { return false; }
				return true;
			});
		}

		$("#context_ignore").click(function () {
			if(userDB.isIgnored(secureNick)) {
				userDB.removeIgnore(secureNick);
				$("#u_" + secureNick).removeClass("user_ignored");
				$(this).text("Enlevé des ignorés").addClass("selected_option");
				if(filtering === "") {
					$(".u_" + secureNick).show();
					scrollNow();
				}
			}
			else {
				userDB.setIgnore(secureNick, user.userName, userA.attr("class").split(" ")[0], user.hash);
				$("#u_" + secureNick).addClass("user_ignored");
				$(this).text("Ajouté aux ignorés").addClass("selected_option");
				$(".u_" + secureNick).hide();
			}	
		});
		$("#context_friend").click(function () {
			var userAUL = null;
			if(userDB.isFriend(secureNick)) {
				userDB.removeFriend(secureNick);
				$(this).text("Enlevé des amis").addClass("selected_option");
				userAUL = $("#u_" + secureNick);
				if(userAUL.hasClass("user_friend_disconnected")) {
					userAUL.remove();
					return;
				}
				userAUL.removeClass("user_friend");
				userAUL.removeClass("user_friend_connected");
				var lastSecureNick = "";
				$.each(usersList, function (k, v) {
					if(!v.connected) { return; }
					if(v.secureNick == secureNick) { return false; }
					lastSecureNick = (v.friend ? lastSecureNick : v.secureNick);
				});
				if(lastSecureNick !== "") {
					userAUL.insertAfter("#u_" + lastSecureNick);
				}
				else {
					$("#connected_list").prepend(userAUL);
				}
			}
			else {
				userDB.setFriend(secureNick, user.userName, userA.attr("class").split(" ")[0], user.hash);
				userAUL = "";
				if(usersList[secureNick] && usersList[secureNick].connected) {
					userAUL = $("#u_" + secureNick);
					userAUL.addClass("user_friend_connected");
				}
				else {
					user.ignore = userDB.isIgnored(secureNick);
					user.connected = false;
					userAUL = createContextMenu(createUserLink(user), secureNick);
				}
				userAUL.addClass("user_friend");
				$("#friend_list").append(userAUL);
				$(this).text("Ajouté aux amis").addClass("selected_option");
			}	
		});
		$("#context_filter").click(function () {
			addTextToShoutbox("[FTDB Shoutbox Mod]", "/?section=FORUMS&module=mod_forums&forum_id=6&topic_id=6332", "class_70", '<a href="#" id="stop_filter">Arrêter le filtrage</a>');
			filtering = secureNick;
			$("#mod_shoutbox ul").each(function () {
				if(!$(this).hasClass("u_" + secureNick) && !$(this).hasClass("user_added")) {
					$(this).hide();
				}
			});
			$("#stop_filter").click(function () {
				filtering = "";
				$("#mod_shoutbox ul").each(function () {
					if(!userDB.isIgnored(secureNick)) {
						$(this).show();
					}
				});
				$(".user_added").remove();
				scrollNow();
				return false;
			});
		});
		$("#context_note").click(function () {
			openNoteWindow(secureNick, user.userName, userA.attr("class").split(" ")[0], user.hash);
		});
		return false;
	});
	return userA;
};

var createUserLink = function (user) {
	if(!user.hash) {
		user.hash = user.url.substring(29);
	}
	var userA = $('<a href="/?section=ACCOUNT_INFOS&hash=' + user.hash + '" id="u_' + user.secureNick + '" class="' + user.classId + (user.friend ? ' user_friend' + (user.connected ? ' user_friend_connected' : ' user_friend_disconnected') : '') + (user.ignore ? ' user_ignored' : '') + '"' + (user.note && user.note != "" ? ' title="' + user.note + '"' : '') + '>' + user.userName + '</a>');
	if(optionsDB.get("userstats")) {
		userA.mouseenter(function() {
			var now_userstats = new Date().getTime();
			if(now_userstats - userA.data("last_userstats_pull") < 10000) { return; }
			userA.data("last_userstats_pull", now_userstats);
			$.ajax({
				type: 'GET',
				url: urls.userstats + user.hash + '/',
				dataType: 'json',
				success: function(data) {
					if(data.hash) {
						title = "";
						if(user.note && user.note != "") {
							title += user.note + "\n\n";
						}
						title += "Dernière connexion : " + data.lastConnection;
						title += "\nDernière activité : " + data.idleTime;
						userA.attr("title", title);
					}
				}
			});
		});
	}
	return userA;
};

var createChangeLink = function (user) {
	if(!user.hash) {
		user.hash = user.url.substring(29);
	}
	return $('<a href="/?section=ACCOUNT_INFOS&hash=' + user.hash + '" class="' + user.classId + (user.friend ? ' user_friend' : '') + (user.ignore ? ' user_ignored' : '') + (user.incomming ? ' user_change_enter' : '') + (user.going ? ' user_change_gone' : '') +'">' + (user.incomming ? '+ ' : '') + (user.going ? '- ' : '') + user.userName + '</a>');
};

var toSecure = function (str) {
	return str.toLowerCase().replace(/[^a-z0-9]/g, "_");
};

var openNoteWindow = function(secureNick, username, classId, hash) {
	dbg("[Note] Opening set note frame");
	$("#website").append('<div id="note_frame" class="ftdb_panel"><h3><center>Modifier la note de ' + username + '</center></h3>' +
		'<div class="note_text"><textarea id="note_text_input">' + (userDB.getNote(secureNick) ? userDB.getNote(secureNick) : '') + '</textarea></div>' +
		'<div class="frame_buttons" id="note_buttons"><input type="button" id="apply_note" value=" Appliquer " /> <input type="button" id="cancel_note" value=" Annuler " /></div></div>');

	$("#apply_note").click(function() {
		var note = $("#note_text_input").val();
		userDB.setNote(secureNick, username, classId, hash, note);
		$("#u_" + secureNick).attr('title', note);
		$("#note_frame").remove();
	});

	$("#cancel_note").click(function() {
		$("#note_frame").remove();
	});
	dbg("[Note] Note frame is ready");
};

/////////////////////////////////
// shoutBoxText_OnKeyUp(keyEvent)
// Autocomplete nicks
/////////////////////////////////
var selectedUserName = "", keyPressed = 0;
var shoutBoxText_OnKeyUp = function (e) {
	keyPressed = (keyPressed <= 0 ? 0 : keyPressed - 1);
	if(e.which < 32 || e.which > 111 || e.ctrlKey || e.altKey || (e.shiftKey && e.which > 36 && e.which < 41) || optionsDB.get("tabirc")) { return; }

	var inputBox = $(this);
	selectedUserName = "";
	var inputText = inputBox.val().split(' ');
	if(!inputText.length) { return; }

	var lastInputWord = inputText[inputText.length - 1];
	if(lastInputWord.length > 2 && lastInputWord.length < 20) { 
		var usersTab = getUserByNamePartial(lastInputWord);
		if(usersTab.length == 1 && keyPressed === 0) {
			delay(function () {
				if(keyPressed === 0) {
					inputBox.val(inputBox.val().concat(usersTab[0].userName.substring(lastInputWord.length)));
					inputBox[0].selectionStart = inputBox.val().length - usersTab[0].userName.length + lastInputWord.length;
					inputBox[0].selectionEnd = inputBox.val().length;
					selectedUserName = usersTab[0].userName;
				}
			}, 10);
		}
	}
};

///////////////////////////////////////////////////////////////
// Auto redelay function, exec callback only ms after last call
///////////////////////////////////////////////////////////////
var delay = (function (){
	var timer = 0;
	return function (callback, ms){
		clearTimeout (timer);
		timer = setTimeout(callback, ms);
	};
})();

//////////////////////////////////////
// shoutBoxText_OnKeyDown(keyEvent)
// Remove tab default and autocomplete
//////////////////////////////////////
var autocompleteKey = 9, lastKeypress, autocompleteStartWord = "";
var shoutBoxText_OnKeyDown = function (e) {
	var textBox = $(this);
	if(optionsDB.get("tabnames")) {
		if(lastKeypress != e.which) {
			keyPressed++;
		}
		lastKeypress = e.which;
		if(e.which == autocompleteKey) {
			var inputText = textBox.val().split(' ');
			if(optionsDB.get("tabirc")) {
				if(!inputText.length) { return; }

				var lastInputWord = inputText[inputText.length - 1].toLowerCase();
				var usersTab = null, userAutoC = "";
				if(autocompleteStartWord === "") {
					if(lastInputWord.length > 0 && lastInputWord.length < 20) { 
						autocompleteStartWord = lastInputWord;
						usersTab = getUserByNamePartial(lastInputWord);
						if(usersTab.length) {
							usersTab.sort(function(a,b) { return b.lastAct-a.lastAct; });
							userAutoC = usersTab[0].userName;
							textBox.val(textBox.val().substring(0, (textBox[0].selectionEnd - lastInputWord.length)).concat(userAutoC) + (optionsDB.get("addspaceafterautoc") ? ' ' + (optionsDB.get("addcolonafterautoc") && inputText.length == 1 ? ': ' : '') : ''));
						}
					}
				}
				else {
					var i = 1, charsBeforeWord = 0;
					if(!lastInputWord.length) {
						charsBeforeWord += 1;
						i++;
						lastInputWord = inputText[inputText.length - i].toLowerCase();
					}
					if(lastInputWord == ":") {
						charsBeforeWord += 2;
						i++;
						lastInputWord = inputText[inputText.length - i].toLowerCase();
					}
					usersTab = getUserByNamePartial(autocompleteStartWord);
					if(usersTab.length) {
						usersTab.sort(function(a,b) { return b.lastAct-a.lastAct; });
						userAutoC = "";
						$.each(usersTab, function(k, v) {
							if(v.userName.toLowerCase() == lastInputWord) {
								userAutoC = usersTab[(k + 1 >= usersTab.length ? 0 : k + 1)].userName;
								return false;
							}
						});
						if(userAutoC === "") {
							userAutoC = usersTab[0].userName;
						}
						textBox.val(textBox.val().substring(0, (textBox[0].selectionEnd - lastInputWord.length - charsBeforeWord)).concat(userAutoC) + (optionsDB.get("addspaceafterautoc") ? ' ' + (optionsDB.get("addcolonafterautoc") && charsBeforeWord == 3 ? ': ' : '') : ''));
					}
				}
			}
			else {
				if(textBox[0].selectionStart != textBox[0].selectionEnd && textBox[0].selectionEnd == textBox.val().length && selectedUserName.length) {
					textBox.val(textBox.val().substring(0, (textBox[0].selectionEnd - selectedUserName.length)).concat(selectedUserName) + (optionsDB.get("addspaceafterautoc") ? ' ' + (optionsDB.get("addcolonafterautoc") && inputText.length == 1 ? ': ' : '') : ''));
				}
				textBox[0].selectionStart = textBox.val().length;
			}
			e.preventDefault();
		}
		else {
			autocompleteStartWord = "";
		}
		if(e.which == 13 && textBox[0].selectionStart != textBox[0].selectionEnd && textBox[0].selectionEnd == textBox.val().length && selectedUserName.length) {
			textBox.val(textBox.val().substring(0, textBox[0].selectionStart));
		}
	}
	if(e.which == 13) {
		// Parse text
		if(!textBox.val().length) { return; }

		var splitStr = textBox.val().split(" ");
		var firstWord = splitStr[0];
		if(optionsDB.get("chatcommands") && firstWord.indexOf("/") === 0) {
			// Command
			dbg("Command");
			if(firstWord == "/error") {
				dbg("/error : reset");
				textBox.val("");
				return false;
			}
			else if(firstWord == "/mp") {
				if(!optionsDB.get("userlist")) {
					alert("Cette commande requiert la recherche dans la liste d'utilisateurs !");
				}
				else if(!optionsDB.get("inshoutmp")) {
					alert("Cette commande requiert l'affichage des mp dans la shout !");
				}
				else if(splitStr[1] && splitStr[1].length) {
					dbg("/mp " + splitStr[1]);
					var username = getUserByNamePartial(splitStr[1]);
					if(!username.length) {
						username = getUserByNamePartial(splitStr[1], true);
					}
					if(username.length == 1) {
						dbg("MP to " + username[0].userName + " : " + username[0].secureNick + "[" + username[0].hash + "]");
						createMPSendFrame(username[0].hash, username[0].userName);
						textBox.val("");
					}
					else {
						dbg("Not found");
						textBox.val('/error : Impossible de trouver "' + splitStr[1] + '" !');
						setTimeout(function() { if(textBox.val().indexOf("/error") === 0) { textBox.val(""); }}, 2000);
					}
				}
				return false;
			}
			else {
				var str = firstWord.substring(1);
				$.each(userData.data.macro, function (k, data) {
					if(data.name == str) {
						splitStr[0] = data.text;
					}
				});
				textBox.val(splitStr.join(" "));
			}
		}

		if(optionsDB.get("usersmiley")) {
			$.each(splitStr, function(i, str) {
				$.each(userData.data.smiley, function (k, data) {
					if(data.name == str) {
						splitStr[i] = "[img]" + data.url + "[/img]";
					}
				});
			});
			textBox.val(splitStr.join(" "));
		}
	}
};

//////////////////////////////////////////////////
// getUserByNamePartial(lowerCasePartialName)
// Returns an array of ids:names starting with name
//////////////////////////////////////////////////
var getUserByNamePartial = function (name, friendlist) {
	var usersTab = [];
	name = name.toLowerCase();
	if(friendlist) {
		$.each(userDB.users, function (secureNick, userData) {
			if(userData.userName.toLowerCase().indexOf(name) === 0) {
				usersTab.push(userData);
			}
		});
	}
	else {
		$.each(usersList, function (secureNick, userData) {
			if(!userData.connected) { return; }
			if(userData.userName.toLowerCase().indexOf(name) === 0) {
				dbg("push " + secureNick);
				usersTab.push(userData);
			}
		});
	}
	return usersTab.sort(function(a,b) { return (a.secureNick < b.secureNick ? -1 : 1); });
};

var userBbcodeHeight = 0, userInputHeight = 82;
//////////////////////////////
// addUSmileyBar()
// add a bar with user smileys
//////////////////////////////
var addUSmileyBar = function () {
	userBbcodeHeight = 30;
	setTimeout(loadUSmiley, 200);
};

var loadUSmiley = function () {
	$(".markItUpContainer").append('<div id="user_bbcode_bar"><div id="bbcode_usersmiley" class="bbcode_bar"></div><div class="user_bbcode_separator"></div><div id="bbcode_usersmiley_control" class="bbcode_bar"><a href="#" id="usersmiley_management">Gérer les smileys</a></div></div>');
	var sText = $("#shout_text");
	// User smileys
	$.each(userData.getAll("smiley"), function (k,v) {
		$("#bbcode_usersmiley").append('<img src="' + v.url + '" width="16" height="16" alt="' + k + '" title="' + v.name + '" class="bbcode_usersmiley" />');
	});
	$(".bbcode_usersmiley").click(function() {
		sText.val(sText.val().substring(0, sText[0].selectionStart) + ' [img]' + $(this).attr("src") + '[/img] ' + sText.val().substring(sText[0].selectionEnd, sText.val().length));
		sText.focus();
	});

	$("#usersmiley_management").click(function() {
		if($("#smiley_panel").length) { $("#smiley_panel").remove(); }
		$("#website").append('<div id="smiley_panel" class="ftdb_panel"><h3><center>Gestion des smileys</center></h3>' +
		'<div class="smiley_panel_div" id="usm_add">Ajouter un smiley<div class="usm_add_input">Nom : <input type="text" id="usm_add_name" size="26" ></div><div class="usm_add_input">Url : <input type="text" id="usm_add_url" size="28" /></div><center><input type="button" id="usm_add_btn" value=" Ajouter " /></center></div>' +
		'<div class="smiley_panel_div" id="usm_del">Supprimer un smiley</br></div>' +
		'<center><input type="button" id="purge_usersmiley" value=" Tout supprimer " /> <input type="button" id="close_smiley_panel" value=" Fermer " /></center></div>');
		$("#usm_add_btn").click(function() {
			if($("#usersmiley_management option").length >= 30) {
				alert("Il y a trop de smileys !");
				return;
			}
			
			var url = $("#usm_add_url").val();
			if(url === "" || url === null || (url.indexOf("http://") == -1)) {
				$("#usm_add_url").val("");
				alert("Url incorrecte !");
				return;
			}

			var nom = $("#usm_add_name").val();
			if(nom === "" || nom === null) {
				$("#usm_add_name").val("");
				alert("Nom incorrect !");
				return;
			}

			if(userData.getByName("smiley", nom) === false) {
				var img = new Image();
				img.onload = function() {
					dbg("Image w:" + this.width + " h:" + this.height);
					if(this.width > 64 || this.height > 64) {
						if(!confirm("Cette image est trop grosse et risque de ralentir votre navigateur !\nÊtes-vous sur de l'ajouter ?")) { return; }
					}
					var key = userData.add("smiley", { "name": nom, "url": url});

					$("#usm_del").append($(' <img src="' + url + '" width="16" height="16" alt="' + key + '" title="Supprimer ' + nom + '" class="usersmiley_rem" /> ').click(function() {
						$("#usm_add_name").val(nom);
						$("#usm_add_url").val(url);
						userData.unset("smiley", key);
						$('.bbcode_usersmiley[alt="' + key + '"]').remove();
						$('.usersmiley_rem[alt="' + key + '"]').remove();
					}));

					$("#bbcode_usersmiley").append($('<img src="' + url + '" width="16" height="16" alt="' + key + '" title="' + nom + '" class="bbcode_usersmiley" />').click(function() {
						sText.val(sText.val().substring(0, sText[0].selectionStart) + ' [img]' + url + '[/img] ' + sText.val().substring(sText[0].selectionEnd, sText.val().length));
						sText.focus();
					}));
					$("#usm_add_name").val("");
					$("#usm_add_url").val("");
				};
				img.src = url;
			}
			else { alert("Ce smiley existe déjà !"); }
		});

		$.each(userData.getAll("smiley"), function (k,v) {
			$("#usm_del").append(' <img src="' + v.url + '" width="16" height="16" alt="' + k + '" title="Supprimer ' + v.name + '" class="usersmiley_rem" /> ');
		});

		$(".usersmiley_rem").click(function() {
			var key = $(this).attr("alt");
			var smileyData = userData.get("smiley", key)
			$("#usm_add_name").val(smileyData.name);
			$("#usm_add_url").val(smileyData.url);
			userData.unset("smiley", key);
			$('.bbcode_usersmiley[alt="' + key + '"]').remove();
			$(this).remove();
		});

		$("#purge_usersmiley").click(function() {
			if(confirm("Êtes-vous sur de supprimer tous les smileys perso ?")) {
				$('.bbcode_usersmiley').each(function() { $(this).remove(); });
				$('.usersmiley_rem').each(function() { $(this).remove(); });
				userData.clearData("smiley");
			}
		});

		$("#close_smiley_panel").click(function() { $("#smiley_panel").remove(); });
		return false;
	});
};

///////////////////////////////
// addMacroBar()
// add a bar with macro gestion
///////////////////////////////
var addMacroBar = function () {
	userBbcodeHeight = 30;
	setTimeout(loadMacro, 250);
};

var loadMacro = function () {
	if(optionsDB.get("usersmiley")) {
		$("#user_bbcode_bar").append('<div class="user_bbcode_separator"></div><div class="bbcode_bar"><a href="#" id="macro_management">Gérer les macros</a></div>');
	}
	else {
		$(".markItUpContainer").append('<div id="user_bbcode_bar"><div id="bbcode_usersmiley_control" class="bbcode_bar"><a href="#" id="macro_management">Gérer les macros</a></div></div>');
	}

	$("#macro_management").click(function() {
		if($("#macro_panel").length) { $("#macro_panel").remove(); }
		$("#website").append('<div id="macro_panel" class="ftdb_panel"><h3><center>Gestion des macros</center></h3>' +
		'<div class="macro_panel_div" id="macro_add">Ajouter une macro<div class="macro_add_input">Nom : /<input type="text" id="macro_add_name" size="28" ></div><div class="macro_add_input">Texte : <input type="text" id="macro_add_text" size="28" /></div><center><input type="button" id="macro_add_btn" value=" Ajouter " /></center></div>' +
		'<div class="macro_panel_div" id="macro_del">Supprimer une macro</br></div>' +
		'<center><input type="button" id="purge_macro" value=" Tout supprimer " /> <input type="button" id="close_macro_panel" value=" Fermer " /></center></div>');
		$("#macro_add_btn").click(function() {
			if($("#macro_management option").length >= 30) {
				alert("Il y a trop de macros !");
				return;
			}
			
			var text = $("#macro_add_text").val();
			if(text === "" || text === null) {
				$("#macro_add_text").val("");
				alert("Texte incorrect !");
				return;
			}

			var nom = $("#macro_add_name").val();
			if(nom === "" || nom === null) {
				$("#macro_add_name").val("");
				alert("Nom incorrect !");
				return;
			}

			if(userData.getByName("macro", nom) === false && nom != "mp" && nom != "me" && nom != "error") {
				var key = userData.add("macro", {"name": nom, "text": text});

				$("#macro_del").append($('<a class="macro_rem" href="#">/' + nom + '</a><br />').click(function() {
					$("#macro_add_name").val(name);
					$("#macro_add_text").val(text);
					userData.unset("macro", key);
					$(this).remove();
				}));
				$("#macro_add_text").val("");
				$("#macro_add_name").val("");
			}
			else { alert("Cette macro existe déjà !"); }
		});

		$.each(userData.getAll("macro"), function (k, v) {
			$("#macro_del").append('<a class="macro_rem" href="#">/' + v.name + '</a><br />');
		});

		$(".macro_rem").click(function() {
			var name = $(this).text().substring(1);
			var macroKey = userData.getByName("macro", name)
			$("#macro_add_name").val(name);
			$("#macro_add_text").val(userData.get("macro", macroKey).text);
			userData.unset("macro", macroKey);
			$(this).remove();
		});

		$("#purge_macro").click(function() {
			if(confirm("Êtes-vous sur de supprimer toutes les macros ?")) {
				$('.macro_rem').each(function() { $(this).remove(); });
				userData.clearData("macro");
			}
		});

		$("#close_macro_panel").click(function() { $("#macro_panel").remove(); });
		return false;
	});
};

///////////////////////////
// showIRCFrame()
// Append an web irc iframe
///////////////////////////
var showIRCFrame = function () { 
	appendDiv("irc_web", "Web IRC").append('<iframe width="100%" height="' + optionsDB.get("irc_height") + '" scrolling="no" frameborder="0" src="http://widget.mibbit.com/?server=irc.rs2i.net%3A6667&channel=%23ftd&charset=UTF-8"></iframe>');
};

//////////////////////
// hideGrades()
// Hide the grades div
//////////////////////
var hideGrades = function () { 
	$("#box_mod_grade_infos").remove();
};

//////////////////////////////////////////////////////////
// setWindowFocusTracker()
// Adds the unread messages in the window title while blur
//////////////////////////////////////////////////////////
var isWindowFocused = true;
var setWindowFocusTracker = function () { 
	$(window).focus(function () {
		if(!isWindowFocused && messageCount > 0 && optionsDB.get("nmessagetitle")) {
			isWindowFocused = true;
			document.title = "FrenchTorrentDB - ShoutBox";
			$($("#SHOUT_MESSAGE ul").get().reverse()).each(function () {
				messageCount--;
				$(this).addClass("highlight_nonread");
				if(messageCount <= 0) {
					return false;
				}
			});
			setTimeout(function () {$("#SHOUT_MESSAGE ul").removeClass("highlight_nonread"); }, 2000);
		}
		isWindowFocused = true;
	});

	$(window).blur(function () {
		isWindowFocused = false;
		messageCount = 0;
	});

	var refreshTitle = function () {
		if(!isWindowFocused && messageCount > 0) {
			document.title = "FTDB - " + messageCount + " message" + (messageCount > 1 ? "s" : "") + " reçu" + (messageCount > 1 ? "s" : "");
		}
		setTimeout(refreshTitle, 2000);
	};
	if(optionsDB.get("nmessagetitle")) {
		refreshTitle();
	}
};

///////////////////////////////////
// blinkIncommingMP()
// Make the MP icon blink on new MP
///////////////////////////////////
var oldNMP = -1;
var blinkIncommingMP = function () {
	dbg("[MP] Checking");
	$.ajax({
		url: "/?section=ACCOUNT&module=mod_account_mailbox&mailbox=in&ajax=1",
		success: function (data) {
			var htmlData = $(data).find(".DataGrid ul");
			if(htmlData === null) {
				return false;
			}

			var MPData = [];
			htmlData.each(function () {
				if($(this).find(".messages_unread img").attr("src") == "themes/images/message_read_1.png") {
					MPData.push({"subject": $(this).children(".messages_subject").text(), "url": $(this).find(".messages_subject a").attr("href"), "sender": $(this).children(".users_username").text(), "senderHash": $(this).find(".users_username a").attr("href").substring(29)});
				}
			});

			var nMP = MPData.length;
			if(oldNMP == -1) {
				oldNMP = nMP;
			}
			
			$.each(MPData, function (k, MP) {
				if(k >= (nMP - oldNMP)) {
					return false;
				}
				MP.id = MP.url.match("\\d{3,9}");
				addTextToShoutbox("[FTDB Shoutbox Mod]", "/?section=FORUMS&module=mod_forums&forum_id=6&topic_id=6332", "class_70", '<a href="/?section=ACCOUNT&module=mod_account_mailbox#box_mod_account_mailbox">Nouveau message privé</a> de ' + MP.sender + ': <a href="' + MP.url + '">' + MP.subject + '</a>' + (optionsDB.get("inshoutmp") ? ' (<a href="' + MP.url + '" id="readmp_' + MP.id + '">Le lire ici</a>)' : ''));
				if(optionsDB.get("inshoutmp")) {
					$("#readmp_" + MP.id).click(MP, function () {
						if(createMPReceiveFrame(MP.id, MP.sender, MP.senderHash, MP.subject)) {
							return false;
						}
					});
				}
				playNotification("mp");
			});

			if(nMP != oldNMP) {
				$(".mailbox").text(nMP);
			}

			if(nMP > 0 && isWindowFocused) {
				$(".mailbox").fadeToggle('slow').fadeToggle('slow').delay(1700).fadeToggle('slow').fadeToggle('slow').delay(1700).fadeToggle('slow').fadeToggle('slow').delay(1700).fadeToggle('slow').fadeToggle('slow').delay(1700).fadeToggle('slow').fadeToggle('slow');
			}

			oldNMP = nMP;
		},
		complete: function () {
			setTimeout(blinkIncommingMP, 15000);
		}
	});
};

/////////////////////////
// createMPReceiveFrame()
// MP reader frame
/////////////////////////
var createMPReceiveFrame = function (MPId, MPSender, MPSenderHash, MPSubject) {
	cleanAllFrames(false);

	$.ajax({
		url: "/?section=ACCOUNT&module=mod_account_mailbox&id=" + MPId + "&ajax=1",
		success: function(data) {
			if($("#receive_mp_frame").length) {
				$("#receive_mp_frame").remove();
			}
			$("#website").append('<div id="receive_mp_frame" class="ftdb_panel mp_frame"><div class="mp_from">De : <b>' + MPSender + '</b></div><div class="mp_subject">Sujet : ' + MPSubject + '</div><div class="mp_text">' + $($(data).find('div [style="padding: 0 0 10px 0; line-height: 25px"]')[0]).html() + '</div><div class="frame_buttons" id="receive_mp_buttons"><input type="button" id="reply_frame_show" value=" Répondre au MP " /> <input type="button" id="close_mp" value=" Fermer " /></div></div>');
			$("#reply_frame_show").click(function () { appendMPReplyFrame(MPId, MPSenderHash, MPSender); });
			$("#close_mp").click(function () { $("#receive_mp_frame").remove(); });
		}
	});
	return true;
};

///////////////////////
// appendMPReplyFrame()
// MP replyer frame
///////////////////////
var appendMPReplyFrame = function (MPId, hash, userName) {
	cleanAllFrames(true);
	
	$("#receive_mp_buttons").hide();
	$("#receive_mp_frame").append('<div id="reply_mp_frame"><div class="mp_to">Répondre a : <b>' + userName + '</b></div><div class="mp_text"><textarea id="mp_text_input" name="msg"></textarea></div><div class="frame_buttons" id="reply_mp_buttons"><input type="button" name="submit" id="reply_mp" value=" Envoyer " /> <input type="button" id="cancel_reply_mp" value=" Annuler " /> <input type="button" id="close_mp_full" value=" Fermer " /></div><div class="confirm">Message envoyé !</div></div>');
	$("#reply_mp").click(function () {
		if($("#mp_text_input").val() === "") { return; }

		var oldEncodeURIComponent = encodeURIComponent;
		encodeURIComponent = URLEncode2;
		$.ajax({
			type: "POST",
			url: "/?section=ACCOUNT&module=mod_account_mailbox&id=" + MPId,
			// uid seems useless here
			data: { uid: hash, msg: $("#mp_text_input").val() },
			success: function () { encodeURIComponent = oldEncodeURIComponent; }
		});
		$("#reply_mp_buttons").hide();
		$(".confirm").show().fadeOut(2000);
		setTimeout(function () { $("#reply_mp_frame").remove(); $("#receive_mp_buttons").show(); }, 2000);
	});
	$("#cancel_reply_mp").click(function () { 
		$("#reply_mp_frame").remove(); 
		$("#receive_mp_buttons").show();
	});
	$("#close_mp_full").click(function () { $("#receive_mp_frame").remove(); });
	return true;
};

/////////////////////////
// createMPSendFrame()
// MP writer frame
/////////////////////////
var createMPSendFrame = function (hash, userName) {
	cleanAllFrames(false);
	
	$("#website").append('<div id="send_mp_frame" class="ftdb_panel mp_frame"><div class="mp_to">A : <b>' + userName + '</b></div><div class="mp_subject"><input type="text" id="mp_subject_input"/></div><div class="mp_text"><textarea id="mp_text_input"></textarea></div><div class="frame_buttons" id="send_mp_buttons"><input type="button" id="send_mp" value=" Envoyer le MP " /> <input type="button" id="cancel_mp" value=" Annuler " /></div><div class="confirm">Message envoyé !</div></div>');
	$("#send_mp").click(function () { 
		if($("#mp_subject_input").val() === "" || $("#mp_text_input").val() === "") { return; }

		var oldEncodeURIComponent = encodeURIComponent;
		encodeURIComponent = URLEncode2;
		$.ajax({
			type: "POST",
			url: "/?section=ACCOUNT_INFOS&module=mod_account_sendmsg&ajax=1&hash=" + hash,
			data: { titre: $("#mp_subject_input").val(), message: $("#mp_text_input").val() },
			success: function () { encodeURIComponent = oldEncodeURIComponent; }
		});
		$("#send_mp_buttons").hide();
		$(".confirm").show().fadeOut(2000);
		setTimeout(function () { $("#send_mp_frame").remove(); }, 2000);
	});
	$("#cancel_mp").click(function () { $("#send_mp_frame").remove(); });
	return true;
};

var cleanAllFrames = function(isReply) {
	if($("#send_mp_frame").length) {
		$("#send_mp_frame").remove();
	}
	if($("#reply_mp_frame").length) {
		$("#reply_mp_frame").remove();
	}
	if($("#receive_mp_frame").length && !isReply) {
		$("#receive_mp_frame").remove();
	}

};

var URLEncode2 = function (string) {
	var SAFECHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_.!~*'()";
	var HEX = "0123456789ABCDEF";

	var plaintext = string;
	var encoded = "";

	for (var i = 0; i < plaintext.length; i++ ) {
		var ch = plaintext.charAt(i);
		if (ch == " ") {
			encoded += "+";				// x-www-urlencoded, rather than %20
		}
		else if (SAFECHARS.indexOf(ch) != -1) {
			encoded += ch;
		}
		else {
			var charCode = ch.charCodeAt(0);
			if (charCode > 255) {
				alert("Caractère inconnu : " + ch + " (" + charCode + "). Il sera remplacé par '+'. Reportez le sur le forum !");
				encoded += "+";
			}
			else {
				encoded += "%";
				encoded += HEX.charAt((charCode >> 4) & 0xF);
				encoded += HEX.charAt(charCode & 0xF);
			}
		}
	}
	return encoded;
};

///////////////////////
// playNotification()
// Embed and play sound
///////////////////////
var soundFileArray = ["Aucune", "Par défaut", "ICQ.mp3", "Simple_Low.mp3", "Little.mp3", "Organ.mp3", "One.mp3", "Chimes.mp3", "Major.mp3", "Flute.mp3", "Woodblock.mp3", "Confirm.mp3", "Echo_Sms.mp3", "Simple_High.mp3", "boss_you_have_a_msg.mp3"];
var playNotification = function (type, test, soundFileTest) {
	var soundFile;
	if(type == "quote") {
		soundFile = optionsDB.get("notificationchoice");
		if(test) {
			soundFile = soundFileTest;
		}
		if(soundFile == "Par défaut") {
			soundFile = "notification.mp3";
		}
	}
	else if(type == "mp") {
		soundFile = optionsDB.get("soundmpchoice");
		if(test) {
			soundFile = soundFileTest;
		}
		if(soundFile == "Par défaut") {
			soundFile = "boss_you_have_a_msg.mp3";
		}
	}
	else { return; }

	if(soundFile == "Aucune") {
		return;
	}

	$("#website").append('<embed id="notification" type="application/x-shockwave-flash" flashvars="audioUrl=' + urls.soundNotif + soundFile + '&autoPlay=true" src="' + urls.audioPlayer + '" width="0" height="0" quality="best"></embed>');
	setTimeout(function () { $("#notification").remove(); }, 4000);
};
								

////////////////////////////
// sendStatistics()
// Send anonymous statistics
////////////////////////////
var lastVersion = false;
var sendStatistics = function () {
	$.ajax({
		type: 'POST',
		url: urls.statistics + scriptVersion + '/' + (debug ? 'debug/' : ''),
		data: {'options': optionsDB.getSendable()},
		dataType: 'json',
		success: function(data) {
			if(data.error) {
				dbg("[Statistics] Error returned");
				if(data.bad_formating) {
					dbg("[Statistics] Bad formating");
				}
			}
			else if(data.debug) {
				scriptVersion += " (debug)";
			}
			else if(data.needUpdate) {
				dbg("[Statistics] New version available");
				lastVersion = data.lastVersion;
				addTextToShoutbox("[FTDB Shoutbox Mod]", "/?section=FORUMS&module=mod_forums&forum_id=6&topic_id=6332", "class_70", '<a href="/?section=FORUMS&module=mod_forums&forum_id=6&topic_id=6332">Une nouvelle version est disponible (' + data.lastVersion + ') !</a> ' + (($.browser.chrome || $.browser.mozilla) ? "La mise à jour devrait être automatique au prochain redémarage de votre navigateur." : "N'oubliez pas de la télécharger !"));
			}
			else {
				dbg("[Statistics] Can't get version from server");
			}
		}
	});
};

////////////////////////////
// backupOptions()
// Send anonymous statistics
////////////////////////////
var backupOptions = function() {
	var md5pseudo = calcMD5(uMyself);
	if(userData.isFirstLaunch()) {
		$.ajax({
			type: 'GET',
			url: urls.check + md5pseudo + '/',
			dataType: 'json',
			success: function(data) {
				dbg("[Backup] Can I backup from this ?");
				if(data && data.status && data.status != "KO") {
					dbg("[Backup] Looks like some backup is available");
					var backupFrame = '<div id="backup_retrieve" class="ftdb_panel"><div class="backup_title">FTDB ShoutboxMod Backup</div><div class="backup_info">Il semblerait que vos options aient disparu.<br />Cependant, elles ont été sauvegardées avec l\'option de backup.<br />Quelle sauvegarde voulez-vous récupérer ?</br /><br /><div class="backup_list">';
					var thisBackup = "";
					$.each(data.backups, function(k, v) {
						var OSUA = v.os + " - " + v.ua;
						if(v.prefered) {
							thisBackup = OSUA;
							backupFrame += '<input type="radio" class="backRadio" name="backRadio" checked="checked" value="' + OSUA + '" /> ' + OSUA + '<br />';
						}
						else {
							backupFrame += '<input type="radio" class="backRadio" name="backRadio" value="' + OSUA + '" /> ' + OSUA + '<br />';
						}
					});
					
					backupFrame += '</div>' + (thisBackup === "" ? '' : '<br />Attention : \'Ignorer\' écrasera définitevement la sauvegarde <b>' + thisBackup + '</b>');
					$("#website").append(backupFrame + '</div><div id="frame_buttons"><input type="button" id="backup_button_retrieve" value=" Récupération " /> <input type="button" id="backup_button_ignore" value=" Ignorer " /></div></div>');
				
					$("#backup_button_retrieve").click(function() {
						var radioChecked = $(".backRadio:checked");
						if(!radioChecked) { return; }
						var OSUA = radioChecked.val().split(" - ");
						dbg("[Backup] Trying to backup from " + radioChecked.val());
						$.ajax({
							type: 'GET',
							url: urls.retrieve + md5pseudo + '/' + OSUA[0] + '/' + OSUA[1] + '/',
							dataType: 'json',
							success: function(data) {
								try {
									pauseStorage = true;
									if(data.options) {
										dbg("[Backup] Set raw array for options");
										optionsDB.setAllRaw(data.options);
									}
									if(data.friends) {
										dbg("[Backup] Set raw array for friends");
										userDB.setFriendsRaw(data.friends);
									}
									$.each(data.userdata, function(s, d) {
										if(d) {
											dbg("[Backup] Set raw array for userdata[" + s + "]");
											userData.setAllRaw(s, d);
										}
									});
								}
								catch (err) {
									sendReport(err);
								}
								window.location.reload();
							}
						});
					});
					$("#backup_button_ignore").click(function() { $("#backup_retrieve").remove(); });
				}
			}
		});
		userData.setLaunchedFirst();
	}
};

var hex_chr = "0123456789abcdef";
function rhex(num)
{
	var str = "";
	for(var j = 0; j <= 3; j++) {
		str += hex_chr.charAt((num >> (j * 8 + 4)) & 0x0F) + hex_chr.charAt((num >> (j * 8)) & 0x0F);
	}
	return str;
}

/*
* Convert a string to a sequence of 16-word blocks, stored as an array.
* Append padding bits and the length, as described in the MD5 standard.
*/
function str2blks_MD5(str)
{
	var nblk = ((str.length + 8) >> 6) + 1;
	var blks = new Array(nblk * 16);
	for(var i = 0; i < nblk * 16; i++) { blks[i] = 0; }
	for(var i = 0; i < str.length; i++) {
		blks[i >> 2] |= str.charCodeAt(i) << ((i % 4) * 8);
	}
	blks[i >> 2] |= 0x80 << ((i % 4) * 8);
	blks[nblk * 16 - 2] = str.length * 8;
	return blks;
}

/*
* Add integers, wrapping at 2^32. This uses 16-bit operations internally 
* to work around bugs in some JS interpreters.
*/
function add(x, y)
{
	var lsw = (x & 0xFFFF) + (y & 0xFFFF);
	var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
	return (msw << 16) | (lsw & 0xFFFF);
}

/*
* Bitwise rotate a 32-bit number to the left
*/
function rol(num, cnt)
{
	return (num << cnt) | (num >>> (32 - cnt));
}

/*
* These functions implement the basic operation for each round of the
* algorithm.
*/
function cmn(q, a, b, x, s, t)
{
	return add(rol(add(add(a, q), add(x, t)), s), b);
}
function ff(a, b, c, d, x, s, t)
{
	return cmn((b & c) | ((~b) & d), a, b, x, s, t);
}
function gg(a, b, c, d, x, s, t)
{
	return cmn((b & d) | (c & (~d)), a, b, x, s, t);
}
function hh(a, b, c, d, x, s, t)
{
	return cmn(b ^ c ^ d, a, b, x, s, t);
}
function ii(a, b, c, d, x, s, t)
{
	return cmn(c ^ (b | (~d)), a, b, x, s, t);
}

/*
* Take a string and return the hex representation of its MD5.
*/
function calcMD5(str)
{
	var x = str2blks_MD5(str);
	var a =  1732584193;
	var b = -271733879;
	var c = -1732584194;
	var d =  271733878;

	for(var i = 0; i < x.length; i += 16)
	{
		var olda = a;
		var oldb = b;
		var oldc = c;
		var oldd = d;

		a = ff(a, b, c, d, x[i+ 0], 7 , -680876936);
		d = ff(d, a, b, c, x[i+ 1], 12, -389564586);
		c = ff(c, d, a, b, x[i+ 2], 17,  606105819);
		b = ff(b, c, d, a, x[i+ 3], 22, -1044525330);
		a = ff(a, b, c, d, x[i+ 4], 7 , -176418897);
		d = ff(d, a, b, c, x[i+ 5], 12,  1200080426);
		c = ff(c, d, a, b, x[i+ 6], 17, -1473231341);
		b = ff(b, c, d, a, x[i+ 7], 22, -45705983);
		a = ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
		d = ff(d, a, b, c, x[i+ 9], 12, -1958414417);
		c = ff(c, d, a, b, x[i+10], 17, -42063);
		b = ff(b, c, d, a, x[i+11], 22, -1990404162);
		a = ff(a, b, c, d, x[i+12], 7 ,  1804603682);
		d = ff(d, a, b, c, x[i+13], 12, -40341101);
		c = ff(c, d, a, b, x[i+14], 17, -1502002290);
		b = ff(b, c, d, a, x[i+15], 22,  1236535329);    

		a = gg(a, b, c, d, x[i+ 1], 5 , -165796510);
		d = gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
		c = gg(c, d, a, b, x[i+11], 14,  643717713);
		b = gg(b, c, d, a, x[i+ 0], 20, -373897302);
		a = gg(a, b, c, d, x[i+ 5], 5 , -701558691);
		d = gg(d, a, b, c, x[i+10], 9 ,  38016083);
		c = gg(c, d, a, b, x[i+15], 14, -660478335);
		b = gg(b, c, d, a, x[i+ 4], 20, -405537848);
		a = gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
		d = gg(d, a, b, c, x[i+14], 9 , -1019803690);
		c = gg(c, d, a, b, x[i+ 3], 14, -187363961);
		b = gg(b, c, d, a, x[i+ 8], 20,  1163531501);
		a = gg(a, b, c, d, x[i+13], 5 , -1444681467);
		d = gg(d, a, b, c, x[i+ 2], 9 , -51403784);
		c = gg(c, d, a, b, x[i+ 7], 14,  1735328473);
		b = gg(b, c, d, a, x[i+12], 20, -1926607734);

		a = hh(a, b, c, d, x[i+ 5], 4 , -378558);
		d = hh(d, a, b, c, x[i+ 8], 11, -2022574463);
		c = hh(c, d, a, b, x[i+11], 16,  1839030562);
		b = hh(b, c, d, a, x[i+14], 23, -35309556);
		a = hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
		d = hh(d, a, b, c, x[i+ 4], 11,  1272893353);
		c = hh(c, d, a, b, x[i+ 7], 16, -155497632);
		b = hh(b, c, d, a, x[i+10], 23, -1094730640);
		a = hh(a, b, c, d, x[i+13], 4 ,  681279174);
		d = hh(d, a, b, c, x[i+ 0], 11, -358537222);
		c = hh(c, d, a, b, x[i+ 3], 16, -722521979);
		b = hh(b, c, d, a, x[i+ 6], 23,  76029189);
		a = hh(a, b, c, d, x[i+ 9], 4 , -640364487);
		d = hh(d, a, b, c, x[i+12], 11, -421815835);
		c = hh(c, d, a, b, x[i+15], 16,  530742520);
		b = hh(b, c, d, a, x[i+ 2], 23, -995338651);

		a = ii(a, b, c, d, x[i+ 0], 6 , -198630844);
		d = ii(d, a, b, c, x[i+ 7], 10,  1126891415);
		c = ii(c, d, a, b, x[i+14], 15, -1416354905);
		b = ii(b, c, d, a, x[i+ 5], 21, -57434055);
		a = ii(a, b, c, d, x[i+12], 6 ,  1700485571);
		d = ii(d, a, b, c, x[i+ 3], 10, -1894986606);
		c = ii(c, d, a, b, x[i+10], 15, -1051523);
		b = ii(b, c, d, a, x[i+ 1], 21, -2054922799);
		a = ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
		d = ii(d, a, b, c, x[i+15], 10, -30611744);
		c = ii(c, d, a, b, x[i+ 6], 15, -1560198380);
		b = ii(b, c, d, a, x[i+13], 21,  1309151649);
		a = ii(a, b, c, d, x[i+ 4], 6 , -145523070);
		d = ii(d, a, b, c, x[i+11], 10, -1120210379);
		c = ii(c, d, a, b, x[i+ 2], 15,  718787259);
		b = ii(b, c, d, a, x[i+ 9], 21, -343485551);

		a = add(a, olda);
		b = add(b, oldb);
		c = add(c, oldc);
		d = add(d, oldd);
	}
	return rhex(a) + rhex(b) + rhex(c) + rhex(d);
}

///////////////////////////////
// appendDiv(divName, h1_title)
// Used to create new divs
///////////////////////////////
var appendDiv = function (name, title) { 
	$("#MAIN").append('<div class="big_box" id="box_' + name + '"><h1 class="title_2" >' + title + '</h1><div id="' + name + '" class="mcontent"></div></div>');
	$("#box_"+name).click(function () {$("#"+name).slideToggle('fast');});
	return $("#"+name);
};

/////////////////////////////////////
// optionsPanelCreator()
// Options main frame create on click
/////////////////////////////////////
var optionsPanelCreator = function () {
	$(".tech").append(' | <a href="#" id="open_options_panel">SMod Options</a>');
	
	$("#open_options_panel").click(function () {
		if($("#options_panel").length) {
			$("#options_panel").fadeOut(600, function () { $(this).remove(); }); 
			return false;
		}
		$("#website").append('<div class="ftdb_panel" id="options_panel"><h3>Options FTDB Shoutbox Mod</h3><span id="obtn_shoutbox" class="obtn">Shoutbox</span><span id="obtn_input" class="obtn">Champ de saisie</span><span id="obtn_userlist" class="obtn">Liste d\'utilisateurs</span><span id="obtn_resize" class="obtn">Redimensionnement</span><span id="obtn_notif" class="obtn">Notifications</span><span id="obtn_other" class="obtn">Autres</span>' +
			'<div id="options_box"><div id="option_shoutbox"></div><div id="option_input"></div><div id="option_userlist"></div><div id="option_resize"></div><div id="option_notif"></div><div id="option_other"></div></div>' +
			'<div style="font-size:0.8em;text-align:right;">By <a href="/?section=ACCOUNT_INFOS&id=775418">Zergrael</a> | Version <a href="/?section=FORUMS&module=mod_forums&forum_id=6&topic_id=6332">' + scriptVersion + '</a>' + (lastVersion ? ' | Nouvelle version disponnible : <a href="/?section=FORUMS&module=mod_forums&forum_id=6&topic_id=6332">' + lastVersion + '</a> !' : '') + '</div>' +
			'<center><input type="button" id="save_options_panel" value=" Enregistrer " />  <input type="button" id="close_options_panel" value=" Annuler " /></center></div>');
		$.each(optionsDB.opt, function (option, data) {
			if(data.type == "check") {
				$(data.frame).append('<span id="o_' + option + '">' + (data.reqLast ? '╚ ' : '') + '<input type="checkbox" id="check_' + option + '" ' + (optionsDB.get(option) ? 'checked' : '') + '/> ' + data.text + '<br /></span>');
			}
			else if(data.type == "number") {
				$(data.frame).append('<span id="o_' + option + '">' + (data.reqLast ? '╚ ' : '') + '<input type="text" id="txt_' + option + '" size="2" value="' + optionsDB.get(option) + '"/> ' + data.text + ' (' +  data.minVal + '-' + data.maxVal + ')' + '<br /></span>');
			}
			else if(data.type == "button") {
				$(data.frame).append('<span id="o_' + option + '">' + (data.reqLast ? '╚ ' : '') + '<input type="button" id="button_' + option + '" value=" ' + data.text + ' "/><br /></span>');
				$("#button_" + option).click(function () { if(confirm(data.confirm)) { data.funct(); }});
			}
			else if(data.type == "select") {
				$(data.frame).append('<span id="o_' + option + '">' + (data.reqLast ? '╚ ' : '') + ' ' + data.text + ' <select id="select_' + option + '"></select><br /></span>');
				$.each(data.options, function (k, v) {
					$("#select_" + option).append("<option" + (optionsDB.get(option) == v ? " selected" : "") + ">" + v + "</option>");
				});
				if(data.onChangeOpt) {
					$("#select_" + option).change(data.onChangeOpt);
				}
			}
				
			
			$.each(data.requires, function (k, reqOption) {
				if(!k) { return; }
				$(reqOption).change(function () {
					$("#o_" + option).toggleClass("opt_disabled", !$(reqOption).is(":checked"));
					if($("#o_" + option + " input").length) {
						$("#o_" + option + " input").attr("disabled", !$(reqOption).is(":checked"));
					}
					else {
						$("#o_" + option + " select").attr("disabled", !$(reqOption).is(":checked"));
					}
				});
			});
		});
		$.each(optionsDB.opt, function (option) { $("#check_" + option).trigger("change"); });
		$("#options_panel").hide().fadeIn(600);

		$(".obtn").click(function () {
			$(".obtn").removeClass("obtn_press");
			$(this).addClass("obtn_press");
			$("#options_box div").hide();
			$("#option_" + $(this).attr("id").substring(5)).show();
		});
		$("#obtn_shoutbox").click();
		
		$("#save_options_panel").click(function () {
			$.each(optionsDB.opt, function (option, data) {
				if(typeof data == "function") { return; }

				var value = true;
				if(data.type == "check") {
					$.each(optionsDB.opt[option].requires, function (_, check) {
						if(! $(check).is(":checked")) {
							value = false;
						}
					});
					optionsDB.set(option, value);
				}
				else if(data.type == "number") {
					value = $(optionsDB.opt[option].requires[0]).val();
					if(!isNaN(value) && Number(value) >= optionsDB.opt[option].minVal && Number(value) <= optionsDB.opt[option].maxVal) {
						optionsDB.set(option, Number(value));
					}
				}
				else if(data.type == "select") {
					value = $(optionsDB.opt[option].requires[0]).val();
					optionsDB.set(option, value);
				}
			});

			optionsDB.storeAll();
			$("#options_panel").fadeOut(600, function () { window.location.reload(); });
			return false;
		});
		
		$("#close_options_panel").click(function () { $("#options_panel").fadeOut(600, function () { $(this).remove(); }); return false; });
		return false;
	});
};

//////////////////////////
// setResizer()
// Resize most of the divs
//////////////////////////
var minSBHeight = 82;
var setResizer = function () { 
	minSBHeight += userBbcodeHeight;

	if(!optionsDB.get("resizeclic")) { return; }

	var inTextZone = false;
	$("#shout_text").hover(function () { inTextZone = true; }, function () { inTextZone = false; });
	$(".form").mousedown(function () {
		if(inTextZone) { return; }

		var eY;
		$(document).mousemove(function (e) {
			if(!eY) {
				eY = e.pageY;
			}
			if(eY != e.pageY) {
				var height = $("#mod_shoutbox").height() + e.pageY - eY;
				$("#mod_shoutbox").height((height < minSBHeight ? minSBHeight : height));
				resizeShoutbox();
				eY = e.pageY;
			}
		}).mouseup(function () {
			optionsDB.set("shoutbox_height", $("#mod_shoutbox").height());
			$(document).unbind("mousemove");
			$(document).unbind("mouseup");
		});
	});
};

///////////////////////////////////////////////////////////////
// resizeShoutbox()
// Reset the aspect of the shoutbox (sort of css hack) + scroll
///////////////////////////////////////////////////////////////
var resizeShoutbox = function () {
	var shoutBoxHeight = $("#mod_shoutbox").height() - userInputHeight - userBbcodeHeight;
	var userListHeight = shoutBoxHeight;
	$("#resizableCSS").html(
		"#SHOUT_MESSAGE { height: " + shoutBoxHeight + "px; } " +
		"#TQC_SHOUT_MESSAGE { height: " + shoutBoxHeight + "px; } " +
		"#user_mod { height: " + shoutBoxHeight + "px; } " +
		".mod_shoutbox #user_list_block, .mod_shoutbox .frame_list { height: " + userListHeight + "px; } " +
		"#search_result { height: " + userListHeight + "px; }");
};

////////////////
// initCSS()
// Init full CSS
////////////////
var initCSS = function () {
	var userlist_width = optionsDB.get("autoresize") ? 200 : 150;

	$("head").append("<style>" +
		(optionsDB.get("autoresize") ?
			(optionsDB.get("resizestats") ?
				"#top_content .arian_nav { width: " + optionsDB.get("shoutbox_width") + "%; } " +
				"#top_content .users_stats { width: 100%; } " : "") +
			".mod_shoutbox .markItUp { width: auto; } " +
			".mod_shoutbox .markItUpContainer { width: auto; } " +
			"#MAIN { width: " + optionsDB.get("shoutbox_width") + "%; } " +
			".big_box h1 { width: 100%; } " +
			"#mod_shoutbox { height: " + optionsDB.get("shoutbox_height") + "px; } " + 
			"#shout_text { width: 99%; } " : "") +

		"#SHOUT_MESSAGE { overflow-x: hidden; } " +
		"#mod_shoutbox { " + (optionsDB.get("font") != "Par défaut" ? 'font-family: ' + optionsDB.get("font") + '; ' : '') + "} " +
		".mod_shoutbox ul.highlight_mouseover { background-color: #BFD !important; } " +
		".mod_shoutbox ul.highlight_quote { background-color: #FFA !important; } " +
		".mod_shoutbox ul.highlight_nonread { background-color: #FAC !important; } " +
		".mod_shoutbox .frame { width: auto; height : 100%; } " +
		".mod_shoutbox #user_list_block { width: " + userlist_width + "px;  float: right; overflow-x: hidden; } " +

		"#notification { position: absolute; height: 0px; width: 0px; } " +
		"#user_mod { width: " + userlist_width + "px; } " +
		"#searchbox_input { width: 126px; height: 14px } " +
		"#search_result { width: " + userlist_width + "px; overflow: auto; } " +
		".users a { line-height: 20px; padding: 0 10px 0 10px; display: block; } " +
		"#top_userlist { padding: 0 10px 0 10px; } " +
		".user_change_enter { position: relative; left: " + userlist_width + "px; } " +
		".user_change_gone { position: relative; left: 10px; } " +
		"#context_menu { position: absolute; z-index: 9000; border: 1px solid #222; background-color: #CCC; } " +
		"#context_head { font-weight: bold; background-color: #BBB; border-bottom: 1px solid #AAA; padding: 2px; text-align: center; cursor: default; } " +
		".context_option { border-bottom: 1px solid #AAA; padding: 2px; } " +
		".context_option a { cursor: pointer; } " +
		".user_ignored { text-decoration: line-through; } " +
		".user_friend { font-style: italic; } " +
		".user_friend_connected:before { content: '● '; color: lime; } " +
		".user_friend_disconnected:before { content: '● '; color: red; } " +
		".selected_option { font-style: italic; } " +

		".ftdb_panel { padding: 10px; width: auto; height: auto; position: absolute; display: block; z-index: 9000; top: 200px; left: 200px; background-color: #EEE; color: #111; border-radius: 15px; border: 2px solid #222; } " +
		".frame_buttons { text-align: center; margin-top: 12px; } " + 

		".bbcode_bar { padding: 4px; float: left; } " +
		"#user_bbcode_bar { height: 30px; border-top: 1px solid #DDD; line-height: 18px; clear: both; } " +
		".user_bbcode_separator {float: left; background-color: #DDD; padding-top: 30px; padding-left: 1px; margin-right: 4px; margin-left: 4px} " +
		".bbcode_usersmiley { cursor: pointer; margin-right: 2px; margin-left: 2px; } " +
		".usersmiley_rem { cursor: pointer; margin-right: 2px; margin-left: 2px; } " +
		"#bbcode_usersmiley_control { padding-left: 4px; } " +
		".smiley_panel_div { padding: 2px; border-top: 1px solid #DDD; } " +
		".usm_add_input { padding: 2px 0 2px 0; }" +

		".mp_frame { max-width: 640px; } " +
		".mp_frame .confirm { text-align: center; font-style: italic; color: green; display: none; }" +
		".mp_subject { margin-top: 4px; width: 100%; padding-right: 4px;} " +
		".mp_text { margin-top: 4px; } " +
		"#mp_subject_input { width: 100%; box-sizing: border-box; } " +
		"#mp_text_input { width: 335px; height: 120px; box-sizing: border-box; } " +
		"#reply_mp_frame { padding-top: 8px; margin-top: 8px; border-top: 1px solid #666} " +

		".backup_title { font-size: 1.4em; font-weight: bold; text-align: center; border-bottom: 1px solid #DDD; } " +

		"#options_box { margin-top: 9px; border: 2px groove threedface; padding: 6px; } " +
		"#options_panel a:hover { color: #FFF; } " +
		"#options_panel h3 { text-align: center; margin-bottom: 6px; } " +
		".opt_disabled { color: gray; } " +
		".obtn { background-color:#f5f5f5; border:1px solid #dedede; border-top:1px solid #eee; border-left:1px solid #eee; font-weight:bold; color:#565656; cursor:pointer; padding:5px 10px 6px 7px; } " +
		".obtn_press { background-color:#6299c5; border:1px solid #6299c5; color:#fff; } " +
		"</style>");
	$("head").append('<style id="resizableCSS"></style>');
};

////////////////////////////////////////////////////////////////
// storageGetValue(name, default) / storageSetValue(name, value)
// localStorage management
////////////////////////////////////////////////////////////////
if(localStorage === null) {
	alert("[FTDB] Il semblerait que le localStorage soit désactivé.\nVeuillez l'activer avant d'utiliser le script!");
}
var storageGetValue = function (name, defaultValue) {
	var value = localStorage.getItem(name);
	if (!value) {
		return defaultValue;
	}
	var type = value[0];
	value = value.substring(1);
	switch (type) {
		case 'b':
			return value == 'true';
		case 'n':
			return Number(value);
		default:
			return value;
	}
};
var storageSetValue = function (name, value) {
	value = (typeof value)[0] + value;
	localStorage.setItem(name, value);
};

////////////////
// Options array
////////////////
var optionsDB = {
	opt: {
		// Shoutbox
		shoutbox: {defaultVal: true, type: "check", requires: ["#check_shoutbox"], frame: "#option_shoutbox", text: 'Traitement de la shoutbox', reqLast: false},
		revertshout: {defaultVal: true, type: "check", requires: ["#check_revertshout", "#check_shoutbox"], frame: "#option_shoutbox", text: 'Inverser shoutbox', reqLast: true},
		hidesmileys: {defaultVal: false, type: "check", requires: ["#check_hidesmileys", "#check_shoutbox"], frame: "#option_shoutbox", text: 'Remplacer les smileys par leur équivalent texte', reqLast: false},
		hideimages: {defaultVal: false, type: "check", requires: ["#check_hideimages", "#check_shoutbox"], frame: "#option_shoutbox", text: 'Remplacer les images par leur lien', reqLast: false},
		hideflash: {defaultVal: true, type: "check", requires: ["#check_hideflash", "#check_shoutbox"], frame: "#option_shoutbox", text: 'Remplacer les embed flash par leur lien', reqLast: false},
		hidecolor: {defaultVal: false, type: "check", requires: ["#check_hidecolor", "#check_shoutbox"], frame: "#option_shoutbox", text: 'Enlever les effets de style du texte', reqLast: false},
		linkimages: {defaultVal: false, type: "check", requires: ["#check_linkimages", "#check_shoutbox"], frame: "#option_shoutbox", text: 'Rendre les images cliquables', reqLast: false},
		stickyscroll: {defaultVal: true, type: "check", requires: ["#check_stickyscroll", "#check_revertshout", "#check_shoutbox"], frame: "#option_shoutbox", text: 'Scroll statique intelligent', reqLast: false},
		avoidprotocolchange: {defaultVal: true, type: "check", requires: ["#check_avoidprotocolchange", "#check_shoutbox"], frame: "#option_shoutbox", text: 'Eviter les changements http/https des liens', reqLast: false},
		autolinks: {defaultVal: true, type: "check", requires: ["#check_autolinks", "#check_shoutbox"], frame: "#option_shoutbox", text: 'Remplacer les liens vers un torrent/topic par leur titre', reqLast: false},
		detectlinks: {defaultVal: true, type: "check", requires: ["#check_detectlinks", "#check_shoutbox"], frame: "#option_shoutbox", text: 'Detecteur de titre de torrents', reqLast: false},
		linknewtab: {defaultVal: false, type: "check", requires: ["#check_linknewtab", "#check_shoutbox"], frame: "#option_shoutbox", text: 'Ouvrir les liens de la shoutbox dans un nouvel onglet', reqLast: false},
		highlightuser: {defaultVal: false, type: "check", requires: ["#check_highlightuser", "#check_shoutbox"], frame: "#option_shoutbox", text: 'Mettre en surbrillance les posts d\'un utilisateur par passage de souris sur son pseudo', reqLast: false},
		highlightuserfromlist: {defaultVal: false, type: "check", requires: ["#check_highlightuserfromlist", "#check_highlightuser", "#check_shoutbox"], frame: "#option_shoutbox", text: 'Depuis la liste d\'utilisteurs aussi', reqLast: true},
		messages_to_display: {defaultVal: 30, type: "number", requires: ["#txt_messages_to_display", "#check_shoutbox"], minVal: 10, maxVal: 400, frame: "#option_shoutbox", text: 'Nombre max de messages à afficher', reqLast: false},
		fade_in_duration: {defaultVal: 1000, type: "number", requires: ["#txt_fade_in_duration", "#check_shoutbox"], minVal: 0, maxVal: 4000, frame: "#option_shoutbox", text: 'Durée du fade in des nouveaux messages en ms', reqLast: false},

		// Input
		tabnames: {defaultVal: true, type: "check", requires: ["#check_tabnames", "#check_userlist"], frame: "#option_input", text: 'Autocomplétion des pseudos', reqLast: false},
		tabirc: {defaultVal: true, type: "check", requires: ["#check_tabirc", "#check_tabnames", "#check_userlist"], frame: "#option_input", text: 'Méthode IRC (Pas de suggestion)', reqLast: true},
		addspaceafterautoc: {defaultVal: true, type: "check", requires: ["#check_addspaceafterautoc", "#check_tabnames", "#check_userlist"], frame: "#option_input", text: 'Ajouter un espace après l\'autocomplétion', reqLast: true},
		addcolonafterautoc: {defaultVal: false, type: "check", requires: ["#check_addcolonafterautoc", "#check_addspaceafterautoc", "#check_tabnames", "#check_userlist"], frame: "#option_input", text: 'Ajouter ": " si l\'autocomplétion est en début de phrase', reqLast: true},
		changeautockey: {defaultVal: false, type: "check", requires: ["#check_changeautockey", "#check_tabnames", "#check_userlist"], frame: "#option_input", text: 'Autocompléter avec → au lieu de Tab', reqLast: true},
		usersmiley: {defaultVal: true, type: "check", requires: ["#check_usersmiley"], frame: "#option_input", text: 'Smileys personnalisés', reqLast: false},
		chatcommands: {defaultVal: false, type: "check", requires: ["#check_chatcommands"], frame: "#option_input", text: 'Macros textuelles', reqLast: false},

		// Userlist
		userlist: {defaultVal: true, type: "check", requires: ["#check_userlist"], frame: "#option_userlist", text: 'Annonce des (dé)connexions des utilisateurs &amp; recherche', reqLast: false},
		user_disable_threshold: {defaultVal: 10, type: "number", requires: ["#txt_user_disable_threshold", "#check_userlist"], minVal: 0, maxVal: 100, frame: "#option_userlist", text: 'Nombre de (dé)connexions annoncées', reqLast: false},
		banlist: {defaultVal: false, type: "check", requires: ["#check_banlist", "#check_userlist", "#check_shoutbox"], frame: "#option_userlist", text: 'Ajoute un menu contextuel au clic sur les utilisateurs (MP/Amis/Ignorer)', reqLast: false},
		shoutbanlist: {defaultVal: false, type: "check", requires: ["#check_shoutbanlist", "#check_banlist", "#check_userlist", "#check_shoutbox"], frame: "#option_userlist", text: 'Depuis la shoutbox aussi', reqLast: true},
		userstats: {defaultVal: false, type: "check", requires: ["#check_userstats", "#check_banlist", "#check_userlist"], frame: "#option_userlist", text: 'Ajouter les stats au mouseover de l\'utilisateur', reqLast: false},
		resetbanlist: {type: "button", requires: ["#check_banlist", "#check_userlist"], frame: "#option_userlist", text: 'Réinitialiser la liste d\'amis/ignorés', confirm: 'Etes-vous sur de supprimer la liste des amis/ignorés ?', funct: function () { userDB.clearUsers(); }, reqLast: false},

		// Resize
		autoresize : {defaultVal: false, type: "check", requires: ["#check_autoresize"], frame: "#option_resize", text: 'Redimensionnement de la shoutbox', reqLast: false},
		shoutbox_width: {defaultVal: 90, type: "number", requires: ["#txt_shoutbox_width", "#check_autoresize"], minVal: 10, maxVal: 100, frame: "#option_resize", text: 'Largeur de la shoutbox (en %)', reqLast: false},
		shoutbox_height: {defaultVal: 376, type: "number", requires: ["#txt_shoutbox_height", "#check_autoresize"], minVal: 86, maxVal: 10000, frame: "#option_resize", text: 'Hauteur de la shoutbox', reqLast: false},
		resizestats: {defaultVal: true, type: "check", requires: ["#check_resizestats", "#check_autoresize"], frame: "#option_resize", text: 'Ajuster la case des statistiques-ratio', reqLast: true},
		resizeclic: {defaultVal: false, type: "check", requires: ["#check_resizeclic", "#check_autoresize"], frame: "#option_resize", text: 'Redimensionnement de la hauteur au clic', reqLast: true},
		irc_height: {defaultVal: 440, type: "number", requires: ["#txt_irc_height", "#check_autoresize"], minVal: 200, maxVal: 10000, frame: "#option_resize", text: 'Hauteur du client IRC Web', reqLast: false},

		// Notification
		highlightquote: {defaultVal: true, type: "check", requires: ["#check_highlightquote", "#check_shoutbox"], frame: "#option_notif", text: 'Mettre en surbrillance lorsque vous êtes cité', reqLast: false},
		notificationchoice: {defaultVal: "Aucune", type: "select", requires: ["#select_notificationchoice", "#check_highlightquote", "#check_shoutbox"], frame: "#option_notif", text: 'Notification sonore lorsque vous êtes cité', options: soundFileArray, onChangeOpt: function() { playNotification("quote", true, $(this).val()); }, reqLast: true},
		blinkmp: {defaultVal: true, type: "check", requires: ["#check_blinkmp"], frame: "#option_notif", text: 'Faire clignoter &amp; annoncer l\'arrivée de nouveaux MPs', reqLast: false},
		soundmpchoice: {defaultVal: "Aucune", type: "select", requires: ["#select_soundmpchoice", "#check_blinkmp"], frame: "#option_notif", text: 'Notification sonore à la réception de MPs', options: soundFileArray, onChangeOpt: function() { playNotification("mp", true, $(this).val()); }, reqLast: true},
		nmessagetitle: {defaultVal: false, type: "check", requires: ["#check_nmessagetitle", "#check_shoutbox"], frame: "#option_notif", text: 'Nombre de messages non lus dans le titre', reqLast: false},
		
		// Others
		javairc: {defaultVal: false, type: "check", requires: ["#check_javairc"], frame: "#option_other", text: 'Ajout d\'un client IRC Web sous la Shoutbox', reqLast: false},
		hidegrades: {defaultVal: true, type: "check", requires: ["#check_hidegrades"], frame: "#option_other", text: 'Cacher la barre d\'info grades', reqLast: false},
		inshoutmp: {defaultVal: true, type: "check", requires: ["#check_inshoutmp", "#check_blinkmp"], frame: "#option_other", text: 'Lire/Répondre/Créer des MP depuis la shoutbox', reqLast: false},
		ping: {defaultVal: false, type: "check", requires: ["#check_ping"], frame: "#option_other", text: 'Afficher le ping', reqLast: false},
		font: {defaultVal: "Par défaut", type: "select", requires: ["#select_font"], frame: "#option_other", text: 'Police', options: ["Par défaut", "Arial", "Comic Sans MS", "Times New Roman"], reqLast: false},
		optionsbak: {defaultVal: true, type: "check", requires: ["#check_optionsbak"], frame: "#option_other", text: 'Backup des options/amis/smileys perso', reqLast: false},
		statistics: {defaultVal: true, type: "check", requires: ["#check_statistics"], frame: "#option_other", text: 'Autoriser l\'envoi de statistiques anonymes', reqLast: false},
		resetall: {type: "button", requires: [], frame: "#option_other", text: 'Réinitialiser toutes les données (options/amis/smileys)', confirm: 'Etes-vous sur de réinitialiser l\'ensemble des données ?', funct: function () { window.resetShoutboxMod(); }, reqLast: false}
	},

	set: function (k, v) {
		if(this.opt[k] === undefined) { return; }
		this.opt[k].val = v;
		storageSetValue(k, v);
	},
	get: function (k) {
		if(this.opt[k].val === undefined) {
			this.opt[k].val = storageGetValue(k);
			if(this.opt[k].val === undefined) {
				this.opt[k].val = this.opt[k].defaultVal;
			}
			this.opt[k].val = (this.opt[k].type == "number" ? Number(this.opt[k].val) : this.opt[k].val);
		}
		return this.opt[k].val;
	},
	getSendable: function() {
		var optionsData = {};
		$.each(optionsDB.opt, function (k, v) {
			if(v.type != "button") {
				optionsData[k] = { val: optionsDB.get(k) };
			}
		});
		return optionsData;
	},
	clearAll: function() {
		$.each(optionsDB.opt, function (k, v) {
			if(v.type != "button") {
				storageSetValue(k, v.defaultVal);
			}
		});
	},
	setAllRaw: function(dArray) {
		$.each(dArray, function (k, v) {
			optionsDB.set(k, strToTyped(v.val));
		});
		this.storeAll();
	},
	storeAll: function() {
		if(pauseStorage) { return; }
		$.ajax({
			type: 'POST',
			url: urls.store + calcMD5(uMyself) + '/options/',
			data: {options: optionsDB.getSendable()},
			dataType: 'json'
		});
	}
};

////////////
// User data
////////////
var userData = {
	data: {
		smiley: [],
		macro: []
	},

	set: function(s, k, v) {
		this.data[s][k] = v;
		this.save(s);
	},
	add: function(s, v) {
		this.data[s].push(v);
		this.save(s);
		return this.getByName(s, v.name);
	},
	get: function(s, k) {
		return this.data[s][k];
	},
	getByName: function(s, name) {
		for (k in this.data[s]) {
			if (this.data[s][k].name == name) {
				return k;
			}
		}
		return false;
	},
	unset: function(s, k) {
		if(this.data[s][k] !== undefined) {
			this.data[s].splice(k, 1);
			this.save(s);
		}
	},

	save: function(s) {
		storageSetValue("data_" + s, JSON.stringify(this.data[s]));
		this.storeAll();
	},
	getAll: function(s) {
		return this.data[s];
	},
	setAllRaw: function(s, dArray) {
		this.data[s] = dArray;
		this.save(s);
	},
	clearData: function(s) {
		this.data[s] = [];
		storageSetValue("data_" + s, JSON.stringify(this.data[s]));
	},
	loadData: function() {
		var thisData = this;
		$.each(this.data, function (k) {
			var dataGM = storageGetValue("data_" + k);
			if(dataGM !== undefined) {
				thisData.data[k] = JSON.parse(dataGM);
			}
		});
	},
	storeAll: function() {
		if(pauseStorage) { return; }
		$.ajax({
			type: 'POST',
			url: urls.store + calcMD5(uMyself) + '/userdata/',
			data: {userdata: userData.data},
			dataType: 'json'
		});
	},

	isFirstLaunch: function() {
		return storageGetValue("data_saved") !== true;
	},
	setLaunchedFirst: function() {
		storageSetValue("data_saved", true);
	},
	getDbRev: function() {
		return storageGetValue("data_db_rev");
	},
	setDbRev: function() {
		storageSetValue("data_db_rev", revision);
	}
};

/////////////////
// users Database
/////////////////
var userDB = {
	users: {},

	setIgnore: function (secureName, userName, classId, hash) {
		if(!this.users[secureName]) {
			this.users[secureName] = {};
		}
		this.users[secureName].ignore = true;
		this.users[secureName].secureNick = secureName;
		this.users[secureName].userName = userName;
		this.users[secureName].classId = classId;
		this.users[secureName].hash = hash;
		this.save();
	},
	isIgnored: function (secureName) {
		return (optionsDB.get("banlist") && this.users[secureName] && this.users[secureName].ignore === true);
	},
	removeIgnore: function (secureName) {
		if(this.users[secureName]) {
			this.users[secureName].ignore = false;
			if(!this.isUsable(secureName)) {
				delete this.users[secureName];
			}
			this.save();
		}
	},

	setFriend: function (secureName, userName, classId, hash) {
		if(!this.users[secureName]) {
			this.users[secureName] = {};
		}
		this.users[secureName].friend = true;
		this.users[secureName].secureNick = secureName;
		this.users[secureName].userName = userName;
		this.users[secureName].classId = classId;
		this.users[secureName].hash = hash;
		this.save();
	},
	isFriend: function (secureName) {
		return (optionsDB.get("banlist") && this.users[secureName] && this.users[secureName].friend === true);
	},
	removeFriend: function (secureName) {
		if(this.users[secureName]) {
			this.users[secureName].friend = false;
			if(!this.isUsable(secureName)) {
				delete this.users[secureName];
			}
			this.save();
		}
	},

	setNote: function (secureName, userName, classId, hash, note) {
		if(!this.users[secureName]) {
			this.users[secureName] = {};
		}
		this.users[secureName].secureNick = secureName;
		this.users[secureName].userName = userName;
		this.users[secureName].classId = classId;
		this.users[secureName].hash = hash;
		this.users[secureName].note = note;
		if(!this.isUsable(secureName)) {
			delete this.users[secureName];
		}
		this.save();
	},
	getNote: function (secureName) {
		return (optionsDB.get("banlist") && this.users[secureName] && this.users[secureName].note) ? this.users[secureName].note : false;
	},

	get: function(secureName) {
		if(this.users[secureName]) {
			return this.users[secureName];
		}
		return false;
	},
	updateUserClass: function (secureName, classId) {
		if(!this.users[secureName]) {
			return;
		}
		this.users[secureName].classId = classId;
		this.save();
	},
	isUsable: function (secureName) {
		return (this.users[secureName].friend || this.users[secureName].ignore || (this.users[secureName].note && this.users[secureName].note != ""));
	},

	save: function() {
		storageSetValue("users", JSON.stringify(this.users));
		this.storeAll();
	},
	storeAll: function() {
		if(pauseStorage) { return; }
		$.ajax({
			type: 'POST',
			url: urls.store + calcMD5(uMyself) + '/friends/',
			data: {friends: userDB.users},
			dataType: 'json'
		});
	},
	setFriendsRaw: function(dArray) {
		$.each(dArray, function (secureNick, data) {
			data.ignore = (data.ignore ? strToTyped(data.ignore) : false);
			data.friend = (data.friend ? strToTyped(data.friend) : false);
			userDB.users[secureNick] = data;
		})
		this.save();
	},
	clearUsers: function () {
		this.users =  {};
		storageSetValue("users", JSON.stringify(this.users));
	},
	loadUsers: function () {
		var usersGM = storageGetValue("users");
		if(usersGM !== undefined) {
			this.users = JSON.parse(usersGM);
		}
	}
};

// Builds typed variable with str variable
var strToTyped = function(str) {
	if(str == "true") {
		return true;
	}
	if(str == "false") {
		return false;
	}
	if(str.match("^\\d+$")) {
		return Number(str);
	}
	else {
		return str;
	}
};

// External urls
var urls = {
	soundNotif: 	location.protocol + "//thetabx.net/download/ftdb/smod/audio/notifications/",
	audioPlayer: 	location.protocol + "//thetabx.net/download/ftdb/smod/audio-player.swf",
	store: 			location.protocol + "//thetabx.net/ftdb_smod/backup/store/",
	check: 			location.protocol + "//thetabx.net/ftdb_smod/backup/check/",
	retrieve: 		location.protocol + "//thetabx.net/ftdb_smod/backup/retrieve/",
	statistics: 	location.protocol + "//thetabx.net/ftdb_smod/statistics/upload/",
	debug: 			location.protocol + "//thetabx.net/ftdb_smod/debug/upload/",
	userstats:		location.protocol + "//thetabx.net/ftdb/user_stats/get/"
};

// Delay some functions in case of late UI redrawing
var loadFinished = function() {
	$("#shout_text").trigger("click"); // Remove "Ecrire un message"
	stickyScroll = true;
	scrollNow();
};

// Start process
try {
	dbg("[Init] F: getUMyself");
	getUMyself();

	dbg("[Init] Loading data");
	userDB.loadUsers();
	if(userData.getDbRev() < 75) {
		userData.data.smiley = {};
		userData.data.macro = {};
	}
	userData.loadData();

	// Database updates if needed
	dbg("[Init] Check for database updates");
	var pauseStorage = false;
	if(userData.getDbRev() != revision) {
		pauseStorage = true;
		var oldRev = userData.getDbRev();
		dbg("[Init] Upgrading DB from " + oldRev);
		if(oldRev == null) { // Before revision implementation
			$.each(userDB.users, function (secureNick, user) {
				if(user.url) {
					var hash = user.url.substring(29);
					if(user.hash) {
						delete user.url;
						userDB.users[secureNick] = user;
					}
					else if(hash.length == 12) {
						user.hash = hash;
						delete user.url;
						userDB.users[secureNick] = user;
					}
				}
				if(!user.ignore && !user.friend) {
					delete userDB.users[secureNick];
				}
			});
		}
		if(oldRev < 75) {
			$.each(userDB.users, function (secureNick, user) {
				if(!secureNick.match(/^[a-z0-9]+$/i)) {
					var securedNick = secureNick.replace(/[^a-z0-9]/g, "_");
					user.secureNick = securedNick;
					delete userDB.users[secureNick];
					userDB.users[securedNick] = user;
				}
			});
			var tempSmileys = [];
			$.each(userData.data.smiley, function (k, v) {
				if(typeof v == "string") {
					tempSmileys.push({ "name": k, "url": v });
				}
			});
			if(tempSmileys.length) {
				userData.setAllRaw("smiley", tempSmileys);
			}
			var tempMacros = [];
			$.each(userData.data.macro, function (k, v) {
				if(typeof v == "string") {
					tempMacros.push({ "name": k, "text": v });
				}
			});
			if(tempMacros.length) {
				userData.setAllRaw("macro", tempMacros);
			}
		}

		pauseStorage = false;
		userDB.save();
		userData.save();
		optionsDB.storeAll();

		userData.setDbRev();
		setTimeout(function() {
			addTextToShoutbox("[FTDB Shoutbox Mod]", "/?section=FORUMS&module=mod_forums&forum_id=6&topic_id=6332", "class_70", 'SMod a été mis à jour correctement. Pensez à regarder le <a href="/?section=FORUMS&module=mod_forums&forum_id=6&topic_id=6332">topic associé</a> pour les nouvelles fonctionnalités.');
		}, 2000);
	}

	dbg("[Init] Starting");
	initCSS();
	if(optionsDB.get("statistics")) {
		dbg("[Init] F: statistics");
		sendStatistics();
	}
	if(optionsDB.get("optionsbak")) {
		dbg("[Init] F: optionsbak");
		backupOptions();
	}
	if(optionsDB.get("usersmiley")) {
		dbg("[Init] F: usersmiley");
		addUSmileyBar();
	}
	if(optionsDB.get("chatcommands")) {
		dbg("[Init] F: chatcommands");
		addMacroBar();
	}
	if(optionsDB.get("autoresize")){
		dbg("[Init] F: autoresize");
		setResizer();
	}
	if(optionsDB.get("shoutbox")) {
		dbg("[Init] F: shoutbox");
		prepareShoutbox();
	}
	if(optionsDB.get("userlist")) {
		dbg("[Init] F: userlist");
		prepareUserList();
	}
	else {
		dbg("[Init] A: userlist");
		$("#mod_shoutbox").prepend($(".frame_list"));
	}
	dbg("[Init] F: resizeShoutbox");
	resizeShoutbox();
	if(optionsDB.get("stickyscroll")) {
		dbg("[Init] F: stickyscroll");
		$("#SHOUT_MESSAGE").bind("scroll", shoutBox_OnScroll);
	}
	if(optionsDB.get("tabnames")) {
		dbg("[Init] F: tabnames");
		$('#shout_text').bind("keyup", shoutBoxText_OnKeyUp);
	}
	if(optionsDB.get("usersmiley") || optionsDB.get("tabnames")) {
		dbg("[Init] F: usersmiley || tabnames");
		$('#shout_text').bind("keydown", shoutBoxText_OnKeyDown);
	}
	if(optionsDB.get("changeautockey")) {
		autocompleteKey = 39;
	}
	if(optionsDB.get("javairc")) {
		dbg("[Init] F: javairc");
		showIRCFrame();
	}
	if(optionsDB.get("hidegrades")) {
		dbg("[Init] F: hidegrades");
		hideGrades();
	}
	if(optionsDB.get("blinkmp")) {
		dbg("[Init] F: blinkmp");
		blinkIncommingMP();
	}
	dbg("[Init] Ending");
	setWindowFocusTracker();
	optionsPanelCreator();
	scrollNow();
	setTimeout(loadFinished, 200);
	dbg("[Init] Loading took " + (new Date().getTime() - dt) + "ms");
}
catch(err) {
	sendReport(err);
}
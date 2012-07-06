// ==UserScript==
// @name            FTDB Shoutbox Mod
// @namespace       http://thetabx.net
// @description     Améliorations et ajout de fonctions pour la Shoutbox de FTDB (Version IE)
// @include         *://*.frenchtorrentdb.com/?section=COMMUNAUTE
// @version         0.5.0
// ==/UserScript==

// Changelog (+ : Addition / - : Delete / ! : Bugfix / § : Issue / * : Modification)
// From 0.4.19
// ! Image load scroll
// ! Sound on quote when ignore
// * CSS rework
// ! Harmony CSS hacks

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

with_jquery(function ($) {
	if (!$("#mod_shoutbox").length) { return; }

	var debug = false, scriptVersion = '0.5.0';
	var d = new Date().getTime();
	// Debug
	dbg = function (str) {
		if(!debug) { return; }

		var d = new Date();
		console.log("[" + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + ":" + d.getMilliseconds() + "] " + str);
	};
	debugShoutboxMod = function () {
		var debugData = [];
		$.each(optionsDB.opt, function (k, v) {
			if(v.type != "button") {
				var debugString = "optionDB[" + k + "] : " + optionsDB.get(k);
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
	resetShoutboxMod = function () {
		optionsDB.clearAll();
		$.each(userData.data, function (k, v) {
			userData.clearData(k);
		});
		userDB.clearUsers();
		alert("ShoutboxMod data cleared !");
	};

	/////////////////////////////////////
	// prepareShoutbox()
	// prepare the Shoutbox for inversion
	/////////////////////////////////////
	var processLink;
	var prepareShoutbox = function () {
		processLink = (optionsDB.get("avoidprotocolchange") || optionsDB.get("linknewtab") || optionsDB.get("highlightuser") || optionsDB.get("highlightquote"));
		$("#mod_shoutbox").prepend('<div class="frame" id="SHOUT_MESSAGE"></div>');
		$('#TQC_SHOUT_MESSAGE').hide();
		$("#SHOUT_MESSAGE").bind("ajaxSuccess", shoutBox_OnChange).trigger("ajaxSuccess");
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
			if((timestamp < lastTimestamp) || (event.timeStamp - timestamp) > 4000) {
				dbg("[Shoutbox] TOO LATE");
				lastTimestamp = timestamp;
				return;
			}

			dbg("[Shoutbox] In time");
			lastTimestamp = timestamp;
		}

		var lastOriginalHtmlDuringProcess = $("#TQC_SHOUT_MESSAGE ul:first").html();
		dbg("[Shoutbox] Analysis");
		var foundLastMessage = (!$("#SHOUT_MESSAGE ul").length);
		var notifySound = false;

		$($("#TQC_SHOUT_MESSAGE ul").get().reverse()).each(function () {
			var message = $(this);

			if(!foundLastMessage) {
				if(message.html() == lastOriginalHtmlBeforeProcess) {
					foundLastMessage = true;
				}
				return;
			}
			
			var showThisMessage = true;
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
					}
				}
			});

			if(optionsDB.get("hideflash")) {
				message.find("embed").each(function () {
					$(this).replaceWith('<a href="' + $(this).attr("src") + '">' + $(this).attr("src") + '</a>');
				});
			}

			if(optionsDB.get("highlightuser")) {
				message.addClass("u_" + message.find("a").first().text().toLowerCase().replace(".", "_"));
			}
			
			if(processLink) {
				message.find("a").each(function (i, e) {
					var aLink = $(this);
					if(optionsDB.get("linknewtab")) {
						aLink.attr("target", "blank_");
					}

					if(aLink.attr("class") && aLink.attr("class").indexOf("class_") != -1) {
						var secureNick = aLink.text().toLowerCase().replace(".", "_");
						if(i == 0) {
							if(optionsDB.get("banlist") && userDB.isIgnored(secureNick)) {
								showThisMessage = false;
							}
							if(optionsDB.get("shoutbanlist")) {
								createContextMenu(aLink);
							}
						}

						if(secureNick == uMyself && i != 0 && optionsDB.get("highlightquote")) {
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

					if(!optionsDB.get("avoidprotocolchange")) { return; }

					var aHref = aLink.attr("href");
					var aHtml = aLink.text();
					var pUrl = parseUrl(aHref);
					if(!pUrl) { return; }
					
					var aCrafted = craftUrl(pUrl);
					if(aHref == aHtml) {
						aLink.text(aCrafted);
					}
					aLink.attr("href", aCrafted);
					
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

						if(pUrl.data.section == "INFOS" && pUrl.data.id) {
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
	}

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

		urlSplit = url.split('&');
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

		var d = new Date(), h = d.getHours(), m = d.getMinutes(), s = d.getSeconds();
		var time = (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
		if(optionsDB.get("revertshout")) {
			$("#SHOUT_MESSAGE").append('<ul class="shout_rowalt" style="display: block; "><li class="time">' + time + '</li><li class="msg"> <a class="' + fromColorClass +'" href="' + fromLink + '">' + from + '</a> : ' + htmlContent + '</li></ul>');
		}
		else {
			$("#SHOUT_MESSAGE").prepend('<ul class="shout_rowalt" style="display: block; "><li class="time">' + time + '</li><li class="msg"> <a class="' + fromColorClass +'" href="' + fromLink + '">' + from + '</a> : ' + htmlContent + '</li></ul>');
		}

		cleanOldMessages();
	};

	///////////////////////////
	// setQuoteHighlighter()
	// Enable quote highlighter
	///////////////////////////
	var uMyself;
	var setQuoteHighlighter = function () {
		uMyself = $(".welcome").children("a").first().text().toLowerCase().replace(".", "_");
	};

	///////////////////////////////
	// scrollNow(scrollOffset)
	// Scrolls to required location
	///////////////////////////////
	var scrollNow = function (scrollUp) {
		dbg("[Shoutbox] Scrolling now");
		var shoutBox = $("#SHOUT_MESSAGE");
		if(!optionsDB.get("revertshout")) { return; }

		var thisScrollUp = (scrollUp ? scrollUp : 0);
		if(stickyScroll) {
			shoutBox.scrollTop(shoutBox[0].scrollHeight - shoutBox.height()); // Scroll to bottom
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
		var userList = $(".frame_list");
		// Embed the user list & make some space for N connected users
		$("#mod_shoutbox").prepend('<div id="user_mod"></div>');
		$("#user_mod").append('<div id="top_userlist"><span id="nConnected">0 connectés</span>' + (optionsDB.get("banlist") ? ' <span id="banlist_management"><a href="#" id="search_friend" class="search_banlist">A</a>/<a href="#" id="search_ignore" class="search_banlist">I</a></span>' : '') + '</div>');
		$("#user_mod").append(userList).mouseleave(function () {
			if($("#searchbox")) {
				$("#nConnected").text(nUsersBeforeUpdate + " connectés");
			}
			if($("#search_result").is(":visible")) {
				$("#banlist_management").show();
				$(".frame_list").show();
				$("#search_result").hide();
			}
		});
		userList.height(userList.height() - $("#nConnected").height());

		var createSearchResultFrame = function(empty) {
			if(!$("#search_result").length) {
				$("#user_mod").append('<div id="search_result"></div>');
				//$(".frame_list").clone(true).appendTo("#user_mod").removeClass("frame_list").attr("id", "search_result");
			}

			// Hide normal userlist and show the results
			$(".frame_list").hide();
			$("#banlist_management").hide();
			$("#search_result").show().empty();
		}

		// Searchbox
		$("#nConnected").dblclick(function () {
			createSearchResultFrame();
			$(this).html('<input type="text" id="searchbox"/>');
			$("#searchbox").bind("keyup", function () {
				var usersArray = getUserByNamePartial($("#searchbox").val().toLowerCase());
				if(!usersArray.length) {
					if($("#search_result").length) {
						$("#search_result").empty();
					}
					return;
				}

				$("#search_result").empty();
				$.each(usersArray, function (i, userData) {
					$("#search_result").append(oldUserList[userData.secureNick]);
				});
					
			}).focus().trigger("keyup");
		}).mouseleave(function () {
			if(! $("#search_result").is(":visible")) {
				$("#nConnected").text(nUsersBeforeUpdate + " connectés");
				$("#banlist_management").show();
			}
		});

		$(".search_banlist").click(function() {
			var friend = false;
			if($(this).attr("id") == "search_friend")
				friend = true;
			createSearchResultFrame();
			var userArray = [];
			$.each(userDB.users, function (secureNick, data) {
				if(friend && userDB.isFriend(secureNick)) {
					var aUser = createUsername(data.url, data.classId, data.userName, secureNick, true, data.ignore, (oldUserList[secureNick] == null ? false : true))
					createContextMenu(aUser);
					userArray.push(aUser);
				}
				else if(!friend && userDB.isIgnored(secureNick)) {
					var aUser = createUsername(data.url, data.classId, data.userName, secureNick, data.friend, true, (oldUserList[secureNick] == null ? false : true))
					createContextMenu(aUser);
					userArray.push(aUser);
				}
			});

			if(!userArray.length) {
				return false;
			}

			$.each(userArray, function (i, user) {
				$("#search_result").append(user);
			});

			return false;
		});

		$("#mod_shoutbox").bind("ajaxSuccess", userList_OnChange).trigger("ajaxSuccess");
	};

	//////////////////////////////
	// userList_OnChange()
	// Main userlist modifications
	//////////////////////////////
	var oldUserList = {}, nUsersBeforeUpdate = 0;
	var userList_OnChange = function (event, request, options) {
		if(options && options.url.indexOf("/?section=COMMUNAUTE&module=mod_shoutbox&ajax=1&mod_ajax=1&uonline=1dum=") == -1) { return; }
		
		dbg("[Userlist] onChange");
		if(optionsDB.get("banlist")) {
			$(".frame_list").prepend("<div id='user_friend_list'></div>");
		}

		$(".frame_list").prepend("<div id='user_change'></div>");
		$("#user_change").hide();

		var nUsers = $(".frame_list a").length;
		if(!$("#nConnected input").length) {
			$("#nConnected").text(nUsers + " connectés");
		}

		var newUserList = {};
		$(".frame_list a").each(function () {
			var secureNick =  $(this).text().toLowerCase().replace(".", "_");
			if(optionsDB.get("banlist")) {
				createContextMenu($(this));
				if(userDB.isIgnored(secureNick)) {
					$(this).addClass("user_ignored");
				}
			}

			$(this).attr("id", "u_" + secureNick);
			newUserList[secureNick] = $(this).clone();
			if(oldUserList[secureNick] == null) {
				$("#user_change").append($(this).clone(true).text("+ " + $(this).text()).addClass("user_change_enter").delay(1).animate({"left": 10}, 1800));
			}
			if(optionsDB.get("highlightuserfromlist")) {
				$(this).hover(function () {
					$(".u_" + secureNick).addClass("highlight_mouseover");
				}, function () {
					$(".u_" + secureNick).removeClass("highlight_mouseover");
				});
			}
		});

		if(optionsDB.get("banlist")) {
			$.each(userDB.users, function (secureNick, data) {
				if(data.friend) {
					if(newUserList[secureNick] != null) {
						var classId = newUserList[secureNick].attr("class").split(" ")[0];
						if(classId != data.classId) {
							data.classId = classId;
							userDB.updateUserClass(secureNick, data.classId);
						}
					}
					var aFriend = createUsername(data.url, data.classId, data.userName, secureNick, true, data.ignore, (newUserList[secureNick] == null ? false : true));
					$("#user_friend_list").append(aFriend);
					createContextMenu(aFriend);
					if(optionsDB.get("highlightuserfromlist")) {
						aFriend.hover(function () {
							$(".u_" + secureNick).addClass("highlight_mouseover");
						}, function () {
							$(".u_" + secureNick).removeClass("highlight_mouseover");
						});
					}
				}
			});
		}

		var hiddenPos = $(".frame_list").width();
		$.each(oldUserList, function (secureNick, userData) {
			if(newUserList[secureNick] == null) {
				$("#user_change").append(userData.clone(true).text("- " + userData.text()).addClass("user_change_gone").delay(800).animate({"left": hiddenPos}, 1800));
			}
		});

		if(nUsersBeforeUpdate != 0 && $("#user_change a").length && $("#user_change a").length <= optionsDB.get("user_disable_threshold")) {
			$("#user_change").slideDown(100).delay(2600).slideUp(100);
		}

		oldUserList = newUserList;
		nUsersBeforeUpdate = nUsers;
		dbg("[Userlist] Update end");
	};

	/////////////////////////////////
	// createContextMenu()
	// Create a context menu on click
	/////////////////////////////////
	var createContextMenu = function (userE) {
		userE.click(function (e) {
			if(e.which == 2) { return true; }

			var userName = userE.text().replace("● ", "");
			var secureNick = userName.toLowerCase().replace(".", "_");
			$("#website").append('<div id="context_menu"><div id="context_head">' + userName + '</div><div class="context_option"><a href="' + userE.attr("href") + '" target="blank_">Profil</a></div><div id="write_mp" class="context_option"><a href="' + userE.attr("href") + '&module=mod_account_sendmsg#box_mod_account_sendmsg" target="blank_">Envoyer un MP</a></div><div class="context_option"><a id="context_friend">' + (userDB.isFriend(secureNick) ? 'Enlever des amis' : 'Ajouter aux amis') + '</a></div><div class="context_option"><a id="context_ignore">' + (userDB.isIgnored(secureNick) ? 'Ne plus ignorer' : 'Ignorer') + '</a></div></div>');
			$("#context_menu").css({ "left": (e.pageX - 15) + "px", "top": (e.pageY - 10) + "px" });
			$("#context_menu").mouseleave(function () { $(this).remove(); });
			$(".context_option").hover(function () { $(this).css({"background-color": "#CCF"}); }, function () { $(this).css({"background-color": "#CCC"}); });
			if(optionsDB.get("inshoutmp")) {
				$("#write_mp").click(function (e2) {
					if(e2.which == 2) { return true; }

					$("#context_menu").remove();
					if(createMPSendFrame(userE.attr("href").substring(27), userName)) { return false; }
					return true;
				});
			}

			$("#context_ignore").click(function () {
				if(userDB.isIgnored(secureNick)) {
					userDB.removeIgnore(secureNick);
					$("#u_" + secureNick).removeClass("user_ignored");
					if($("#f_" + secureNick)) {
						$("#f_" + secureNick).removeClass("user_ignored");
					}
					$(this).text("Enlevé des ignorés").addClass("selected_option"); 
				}
				else {
					userDB.setIgnore(secureNick, userName, userE.attr("class").split(" ")[0], userE.attr("href"));
					$("#u_" + secureNick).addClass("user_ignored");
					if($("#f_" + secureNick)) {
						$("#f_" + secureNick).addClass("user_ignored");
					}
					$(this).text("Ajouté aux ignorés").addClass("selected_option"); 
				}	
			});
			$("#context_friend").click(function () {
				if(userDB.isFriend(secureNick)) {
					userDB.removeFriend(secureNick);
					$("#f_" + secureNick).remove();
					$(this).text("Enlevé des amis").addClass("selected_option");
				}
				else {
					userDB.setFriend(secureNick, userName, userE.attr("class").split(" ")[0], userE.attr("href"));
					var aFriend = createUsername(userDB.users[secureNick].url, userDB.users[secureNick].classId, userDB.users[secureNick].userName, secureNick, true, userDB.users[secureNick].ignore, true);
					$("#user_friend_list").append(aFriend);
					createContextMenu(aFriend);
					$(this).text("Ajouté aux amis").addClass("selected_option");
				}	
			});
			return false;
		});
	};

	var createUsername = function (url, classId, userName, secureNick, friend, ignore, connected) {
		return $('<a href="' + url + '" id="f_' + secureNick + '" class="' + classId + (friend ? ' user_friend' : '') + (ignore ? ' user_ignored' : '') + '">' + (friend ? '<span class="' + (connected ? 'user_dot_connected' : 'user_dot_disconnected') + '">● </span>' : '') + userName + '</a>');
	}

	/////////////////////////////////
	// shoutBoxText_OnKeyUp(keyEvent)
	// Autocomplete nicks
	/////////////////////////////////
	var selectedUserName = "", keyPressed = 0;
	var shoutBoxText_OnKeyUp = function (e) {
		keyPressed = (keyPressed == 0 ? keyPressed : keyPressed - 1);
		if(e.which < 32 || e.which > 111 || e.ctrlKey || e.altKey || (e.shiftKey && e.which > 36 && e.which < 41)) { return; }

		var inputBox = $(this);
		selectedUserName = "";
		var inputText = inputBox.val().split(' ');
		if(!inputText.length) { return; }

		var lastInputWord = inputText[inputText.length - 1].toLowerCase();
		if(lastInputWord.length > 2 && lastInputWord.length < 16) { 
			var usersTab = getUserByNamePartial(lastInputWord);
			if(usersTab.length == 1 && keyPressed == 0) {
				delay(function () {
					if(keyPressed == 0) {
						inputBox.val(inputBox.val().concat(usersTab[0].name.substring(lastInputWord.length)));
						inputBox[0].selectionStart = inputBox.val().length - usersTab[0].name.length + lastInputWord.length;
						inputBox[0].selectionEnd = inputBox.val().length;
						selectedUserName = usersTab[0].name;
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
	var autocompleteKey = 9, lastKeypress;
	var shoutBoxText_OnKeyDown = function (e) {
		var textBox = $(this);
		if(optionsDB.get("tabnames")) {
			if(lastKeypress != e.which) {
				keyPressed++;
			}
			lastKeypress = e.which;
			if(e.which == autocompleteKey) {
				if(textBox[0].selectionStart != textBox[0].selectionEnd && textBox[0].selectionEnd == textBox.val().length && selectedUserName.length) {
					textBox.val(textBox.val().substring(0, (textBox[0].selectionEnd - selectedUserName.length)).concat(selectedUserName) + (optionsDB.get("addspaceafterautoc") ? ' ' : ''));
				}
				textBox[0].selectionStart = textBox.val().length;
				e.preventDefault();
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
			if(optionsDB.get("chatcommands") && firstWord.indexOf("/") == 0) {
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
						var username = getUserByNamePartial(splitStr[1].toLowerCase());
						if(!username.length)
							username = getUserByNamePartial(splitStr[1].toLowerCase(), true);
						if(username.length == 1) {
							dbg("MP to " + username[0].name + " : " + username[0].secureNick + "[" + username[0].userId + "]");
							createMPSendFrame(username[0].userId, username[0].name);
							textBox.val("");
						}
						else {
							dbg("Not found");
							textBox.val('/error : Impossible de trouver "' + splitStr[1] + '" !');
							setTimeout(function() { if(textBox.val().indexOf("/error") == 0) { textBox.val(""); }}, 2000);
						}
					}
					return false;
				}
			}

			if(optionsDB.get("usersmiley")) {
				$.each(splitStr, function(i, str) {
					$.each(userData.data.smiley, function (nom, url) {
						if(nom == str) {
							splitStr[i] = "[img]" + url + "[/img]";
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
		var usersTab = Array();
		if(friendlist) {
			$.each(userDB.users, function (secureNick, userData) {
				if(userData.userName.toLowerCase().indexOf(name) == 0) {
					usersTab.push({'secureNick':secureNick, 'name': userData.userName, 'userId': userData.url.substring(27)});
				}
			});
		}
		else {
			$.each(oldUserList, function (secureNick, userData) {
				if(userData.text().toLowerCase().indexOf(name) == 0) {
					usersTab.push({'secureNick':secureNick, 'name': userData.text(), 'userId': userData.attr("href").substring(27)});
				}
			});
		}
		return usersTab;
	};

	var bbcodeHeight = 0, userBbcodeHeight = 0, userInputHeight = 42;
	//////////////////////////////////////////////////////////
	// addBBcodeBar()
	// add a bar with buttons to format text with bbcode tags
	//////////////////////////////////////////////////////////
	var addBBcodeBar = function () {
		bbcodeHeight = 26;
		$("#mod_shoutbox").append('<div id="bbcode_bar"><div id="bbcode_bbcode" class="bbcode_bar"></div><div class="bbcode_separator"></div><div id="bbcode_color" class="bbcode_bar"></div><div class="bbcode_separator"></div><div id="bbcode_smiley" class="bbcode_bar"></div><div class="bbcode_separator"></div><div id="bbcode_command" class="bbcode_bar"></div></div>');

		var sText = $("#shout_text");
		// BBCode
		var bbcode = [{ url:'bold', alt:'b'}, { url:'italic', alt:'i'}, { url:'underline', alt:'u'}, { url:'picture', alt:'img'}, {url:'link', alt:'url', spec:true}];
		$.each(bbcode, function (k, v) { $("#bbcode_bbcode").append('<img src="themes/images/bbcode/' + v.url + '.png" alt="' + v.alt + '" class="bbcode_bbcode' + (v.spec?' spec':'') + '" /> '); });
		$(".bbcode_bbcode").click(function () { 
			sText.val(sText.val().substring(0, sText[0].selectionStart) + '[' + $(this).attr("alt") + ($(this).hasClass("spec")?'=':']') + sText.val().substring(sText[0].selectionStart, sText[0].selectionEnd) + ($(this).hasClass("spec")?']':'') + '[/' + $(this).attr("alt") + ']' + sText.val().substring(sText[0].selectionEnd, sText.val().length));
			sText.focus();
		});
		
		// Colors
		var colors = ["white", "darkgray", "red", "yellow", "lime", "aqua", "blue", "fuchsia", "black", "gray", "maroon", "orange", "green", "teal", "navy", "purple"];  
		$.each(colors, function (k,v) {
			$("#bbcode_color").append('<div id="' + v + '" class="bbcode_color ' + (colors.length/2 == k ?'bbcode_color_newline':'') + '"></div>');
			$("#" + v).css({"background-color": v});
		});
		$(".bbcode_color").click(function () {
			sText.val(sText.val().substring(0, sText[0].selectionStart) + '[color=' + $(this).attr("id") + ']' + sText.val().substring(sText[0].selectionStart, sText[0].selectionEnd) + '[/color]' + sText.val().substring(sText[0].selectionEnd, sText.val().length));
			sText.focus();
		});

		// Smileys
		var smileys = [{ url:'smile', alt:':)' }, { url:'wink', alt:';)' }, { url:'frown', alt:':(' }, { url:'bigsmile', alt:':D' }, { url:'tongue', alt:':P' }, { url:'laugh', alt:'XD' }, { url:'sweatdrop', alt:'^^;' }, { url:'boggle', alt:'o.O' }, { url:'worry', alt:':s' }, { url:'teeth', alt:'<g>' }, { url:'heart', alt:'<3' }, { url:'angry', alt:'D:' }, {url:'anime',alt:'^_^'}, {url:'bigeyes',alt:'8)'}, {url:'bigwink',alt:';D'}, {url:'blue',alt:':blue:'}, {url:'confuse',alt:':?'}, {url:'cool',alt:'B)'}, {url:'evil',alt:'>:)'}, {url:'irritated',alt:':/'}, {url:'lookleft',alt:'<_<'}, {url:'lookright',alt:'>_>'}, {url:'neutral',alt:':|'}, {url:'saint',alt:'O:)'}, {url:'sleepy',alt:':zzz:'}, {url:'smile3',alt:':3'}, {url:'sneaky',alt:'>;)'}, {url:'star',alt:':star:'}, {url:'surprise',alt:':O'}, {url:'wink3',alt:';3'}];
		$.each(smileys, function (k, v) { $("#bbcode_smiley").append('<img src="themes/images/smileys/' + v.url + '.gif" alt="' + v.alt + '" class="bbcode_smiley" /> '); });
		$(".bbcode_smiley").click(function () {
			sText.val(sText.val().substring(0, sText[0].selectionStart) + ' ' + $(this).attr("alt") + ' ' + sText.val().substring(sText[0].selectionEnd, sText.val().length));
			sText.focus();
		});

		// Commands
		var command = ["/me"];
		$.each(command, function (k, v) { $("#bbcode_command").append('<span class="bbcode_command">' + v + '</span> '); });
		$(".bbcode_command").click(function () {
			sText.val($(this).text() + ' ' + sText.val().substring(0, sText.val().length));
			sText.focus();
		});

		// User smileys
		if(optionsDB.get("usersmiley")) {
			userBbcodeHeight = 30;
			
			$("#mod_shoutbox").append('<div id="user_bbcode_bar"><div id="bbcode_usersmiley" class="bbcode_bar"></div><div class="user_bbcode_separator"></div><div id="bbcode_usersmiley_control" class="bbcode_bar"><a href="#" id="usersmiley_management">Gérer les smileys</a></div></div>');

			// User smileys
			userData.loadData();
			$.each(userData.getAll("smiley"), function (k,v) {
				$("#bbcode_usersmiley").append('<img src="' + v + '" width="16" height="16" alt="' + k + '" class="bbcode_usersmiley" />');
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
					if(url == "" || url === null || (url.indexOf("http://") == -1)) {
						$("#usm_add_url").val("Url incorrecte");
						return;
					}

					var nom = $("#usm_add_name").val();
					if(nom == "" || nom === null || nom.indexOf(" ") != -1) {
						$("#usm_add_name").val("Nom incorrect. Ne doit pas contenir d'espace");
						return;
					}

					if(userData.get("smiley", nom) == undefined) {
						var img = new Image();
						img.onload = function() {
							dbg("Image w:" + this.width + " h:" + this.height);
							if(this.width > 64 || this.height > 64) {
								if(!confirm("Cette image est trop grosse et risque de ralentir votre navigateur !\nÊtes-vous sur de l'ajouter ?")) { return; }
							}
							userData.set("smiley", nom, url);

							$("#usm_del").append($(' <img src="' + url + '" width="16" height="16" alt="' + nom + '" class="usersmiley_rem" /> ').click(function() {
								userData.unset("smiley", nom);
								$('.bbcode_usersmiley[alt="' + nom + '"]').remove();
								$('.usersmiley_rem[alt="' + nom + '"]').remove();
							}));

							$("#bbcode_usersmiley").append($(' <img src="' + url + '" width="16" height="16" alt="' + nom + '" class="bbcode_usersmiley" /> ').click(function() {
								sText.val(sText.val().substring(0, sText[0].selectionStart) + ' [img]' + url + '[/img] ' + sText.val().substring(sText[0].selectionEnd, sText.val().length));
								sText.focus();
							}));
						}
						img.src = url;
					}
					else { alert("Ce smiley existe déjà !"); }
				});

				$.each(userData.getAll("smiley"), function (k,v) {
					$("#usm_del").append('<img src="' + v + '" width="16" height="16" alt="' + k + '" class="usersmiley_rem" />');
				});

				$(".usersmiley_rem").click(function() {
					var name = $(this).attr("alt");
					userData.unset("smiley", name);
					$('.bbcode_usersmiley[alt="' + name + '"]').remove();
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
		}
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
				if(htmlData == null) {
					return false;
				}

				var MPData = [];
				htmlData.each(function (i, e) {
					if($(this).find(".messages_unread img").attr("src") == "themes/images/message_read_1.png") {
						MPData.push({"subject": $(this).children(".messages_subject").text(), "url": $(this).find(".messages_subject a").attr("href"), "sender": $(this).children(".users_username").text(), "senderId": $(this).find(".users_username a").attr("href").substring(27)});
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
							if(createMPReceiveFrame(MP.id, MP.sender, MP.senderId, MP.subject)) {
								return false;
							}
						});
					}
					playNotification("mp");
				});

				if(nMP != oldNMP) {
					$(".welcome").html($(".welcome").html().replace("</a> " + oldNMP, "</a> " + nMP));
				}

				if(nMP > 0 && isWindowFocused) {
					$(".welcome img:first").animate({width: '30', height: '24'}, 'fast').animate({width: '15', height: '12'}, 'fast').fadeTo('fast', 0).fadeTo('fast', 1);
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
	var MPTopPos = 200, MPLeftPos = 200;
	var createMPReceiveFrame = function (MPId, MPSender, MPSenderId, MPSubject) {
		cleanAllFrames(false);

		$.ajax({
			url: "/?section=ACCOUNT&module=mod_account_mailbox&id=" + MPId + "&ajax=1",
			success: function(data) {
				if($("#receive_mp_frame").length) {
					$("#receive_mp_frame").remove();
				}
				$("#website").append('<div id="receive_mp_frame" class="ftdb_panel mp_frame"><div class="mp_from">De : <b>' + MPSender + '</b></div><div class="mp_subject">Sujet : ' + MPSubject + '</div><div class="mp_text">' + $($(data).find("div")[0]).html() + '</div><div class="mp_buttons" id="receive_mp_buttons"><input type="button" id="reply_frame_show" value=" Répondre au MP " /> <input type="button" id="close_mp" value=" Fermer " /></div></div>');
				$("#reply_frame_show").click(function () { appendMPReplyFrame(MPId, MPSenderId, MPSender); });
				$("#close_mp").click(function () { $("#receive_mp_frame").remove(); });
			}
		});
		return true;
	};

	///////////////////////
	// appendMPReplyFrame()
	// MP replyer frame
	///////////////////////
	var appendMPReplyFrame = function (MPId, userId, userName) {
		cleanAllFrames(true);
		
		$("#receive_mp_buttons").hide();
		$("#receive_mp_frame").append('<div id="reply_mp_frame"><div class="mp_to">Répondre a : <b>' + userName + '</b></div><div class="mp_text"><textarea id="mp_text_input" name="msg"></textarea></div><div class="mp_buttons" id="reply_mp_buttons"><input type="button" name="submit" id="reply_mp" value=" Envoyer " /> <input type="button" id="cancel_reply_mp" value=" Annuler " /> <input type="button" id="close_mp_full" value=" Fermer " /></div><div class="confirm">Message envoyé !</div></div>');
		$("#reply_mp").click(function () {
			if($("#mp_text_input").val() == "") { return; }

			var oldEncodeURIComponent = encodeURIComponent;
			encodeURIComponent = URLEncode2;
			$.ajax({
				type: "POST",
				url: "/?section=ACCOUNT&module=mod_account_mailbox&id=" + MPId,
				data: { uid: userId, msg: $("#mp_text_input").val() },
				success: function (data) { encodeURIComponent = oldEncodeURIComponent; }
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
	var createMPSendFrame = function (userId, userName) {
		cleanAllFrames(false);
		
		$("#website").append('<div id="send_mp_frame" class="ftdb_panel mp_frame"><div class="mp_to">A : <b>' + userName + '</b></div><div class="mp_subject"><input type="text" id="mp_subject_input"/></div><div class="mp_text"><textarea id="mp_text_input"></textarea></div><div class="mp_buttons" id="send_mp_buttons"><input type="button" id="send_mp" value=" Envoyer le MP " /> <input type="button" id="cancel_mp" value=" Annuler " /></div><div class="confirm">Message envoyé !</div></div>');
		$("#send_mp").click(function () { 
			if($("#mp_subject_input").val() == "" || $("#mp_text_input").val() == "") { return; }

			var oldEncodeURIComponent = encodeURIComponent;
			encodeURIComponent = URLEncode2;
			$.ajax({
				type: "POST",
				url: "/?section=ACCOUNT_INFOS&module=mod_account_sendmsg&ajax=1&id=" + userId,
				data: { titre: $("#mp_subject_input").val(), message: $("#mp_text_input").val() },
				success: function (data) { encodeURIComponent = oldEncodeURIComponent; }
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

	}

	var URLEncode2 = function (string) {
		var SAFECHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_.!~*'()";
		var HEX = "0123456789ABCDEF";
		var REPLACE = {"’": "'", "€": "e"};

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
			else if (REPLACE[ch] != undefined) {
				encoded += REPLACE[ch];
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

		$("#website").append('<embed id="notification" type="application/x-shockwave-flash" flashvars="audioUrl=https://thetabx.net/download/audio/notifications/' + soundFile + '&autoPlay=true" src="http://thetabx.net/download/audio-player.swf" width="0" height="0" quality="best"></embed>');
		setTimeout(function () { $("#notification").remove(); }, 4000);
	};
									

	////////////////////////////
	// sendStatistics()
	// Send anonymous statistics
	////////////////////////////
	var lastVersion = "KO";
	var sendStatistics = function () {
		if(debug) { return; }
		var url = 'http://thetabx.net/statistics/upload/ftdb/shoutbox/' + scriptVersion + '/';
		$.each(optionsDB, function (option, data) {
			if(typeof data == "function") {
				return;
			}
			url += (data.type == "number" ? optionsDB.get(option) : (optionsDB.get(option) ? '1' : '0')) + ':';
		});
		var xdr = new XDomainRequest();
		xdr.open("get", url);
		xdr.onload = function () {
			lastVersion = xdr.responseText;
			switch(lastVersion) {
				case "OK": {
					break;
				}
				case "error": {
					dbg("[Statistics] Can't get version from server");
					break;
				}
				case "debug": {
					scriptVersion += " (debug)";
					break;
				}
				default: {
					addTextToShoutbox("[FTDB Shoutbox Mod]", "/?section=FORUMS&module=mod_forums&forum_id=6&topic_id=6332", "class_70", '<a href="/?section=FORUMS&module=mod_forums&forum_id=6&topic_id=6332">Une nouvelle version est disponible (' + lastVersion + ') !</a>');
					break;
				}

			}
		};
		setTimeout(function () {
			xdr.send();	
		}, 0);
	};

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
		$(".fil").append(' &lt; <a href="#" id="open_options_panel">Options</a>');
		
		$("#open_options_panel").click(function () {
			if($("#options_panel").length) {
				$("#options_panel").fadeOut(600, function () { $(this).remove(); }); 
				return false;
			}
			$("#website").append('<div class="ftdb_panel" id="options_panel"><h3><center>Options FTDB Shoutbox Mod</center></h3>' +
				'<form><fieldset id="option_shoutbox"><legend>Shoutbox</legend></fieldset><fieldset id="option_input"><legend>Zone d\'insertion de texte</legend></fieldset><fieldset id="option_userlist"><legend>Liste des utilisateurs</legend></fieldset><fieldset id="option_resize"><legend>Dimensions</legend></fieldset><fieldset id="option_other"><legend>Autres</legend></fieldset></form>' +
				'<div style="font-size:0.8em;text-align:right;">By <a href="/?section=ACCOUNT_INFOS&id=775418">Zergrael</a> | Version <a href="/?section=FORUMS&module=mod_forums&forum_id=6&topic_id=6332">' + scriptVersion + '</a>' + (lastVersion == "KO" || lastVersion == "OK" ? '' : ' | Nouvelle version disponnible : <a href="/?section=FORUMS&module=mod_forums&forum_id=6&topic_id=6332">' + lastVersion + '</a> !') + '</div>' +
				'<center><input type="button" id="save_options_panel" value=" Enregistrer " />  <input type="button" id="close_options_panel" value=" Annuler " /></center></div>');
			$.each(optionsDB.opt, function (option, data) {
				if(data.type == "check") {
					$(data.frame).append('<span id="o_' + option + '">' + (data.reqLast ? '╚ ' : '') + '<input type="checkbox" id="check_' + option + '" ' + (optionsDB.get(option) ? 'checked' : '') + '/> ' + data.text + '<br /></span>');
				}
				else if(data.type == "number") {
					$(data.frame).append('<span id="o_' + option + '">' + (data.reqLast ? '╚ ' : '') + '<input type="text" id="txt_' + option + '" size="2" value="' + optionsDB.get(option) + '"/> ' + data.text + ' (' +  data.minVal + '-' + data.maxVal + ')' + '<br /></span>');
				}
				else if(data.type == "button") {
					$(data.frame).append('<span id="o_' + option + '">' + (data.reqLast ? '╚ ' : '') + '<input type="button" id="button_' + option + '" value="' + data.text + '"/><br /></span>');
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
					$(reqOption).change(function () { $("#o_" + option).toggle($(reqOption).is(":checked")); });
				});
			});
			$.each(optionsDB.opt, function (option, data) { $("#check_" + option).trigger("change"); });
			$("#options_panel").hide().fadeIn(600);
			
			$("#save_options_panel").click(function () {
				$.each(optionsDB.opt, function (option, data) {
					if(typeof data == "function") { return; }

					var value = true;
					if(data.type == "check") {
						$.each(optionsDB.opt[option].requires, function (i, check) {
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

				$("#options_panel").fadeOut(600, function () { window.location = window.location; });
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
	var minSBHeight = 68;
	var setResizer = function () { 
		if(optionsDB.get("bbcode")) {
			minSBHeight += (bbcodeHeight + userBbcodeHeight);
		}

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
		var shoutBoxHeight = $("#mod_shoutbox").height() - userInputHeight - bbcodeHeight - userBbcodeHeight - (isHarmonyCss ? 5 : 0);
		var userListHeight = shoutBoxHeight - (optionsDB.get("userlist") ? 18 : 0);
		$("#resizableCSS").html(
			"#SHOUT_MESSAGE { height: " + shoutBoxHeight + "px; } " +
			"#TQC_SHOUT_MESSAGE { height: " + shoutBoxHeight + "px; } " +
			"#user_mod { height: " + shoutBoxHeight + "px; } " +
			".mod_shoutbox .frame_list { height: " + userListHeight + "px !important; } " +
			"#search_result { height: " + userListHeight + "px; }");
	};

	////////////////
	// initCSS()
	// Init full CSS
	////////////////
	var isHarmonyCss = ($('select[name="select_css"]').val() == 3192);
	var initCSS = function () {
		dbg("isHarmonyCss : " + isHarmonyCss);
		var userlist_width = optionsDB.get("autoresize") ? 200 : 150;

		$("head").append("<style>" +
			(optionsDB.get("autoresize") ?
				"#SHOUT_MESSAGE { overflow-x: hidden; } " +
				"#top_content .arian_nav { width: 90%; } " +
				"#MAIN { width: 90%; } " +
				".big_box h1 { width: " + (isHarmonyCss ? '100.7%' : '100%') + "; } " +
				"#mod_shoutbox { height: " + optionsDB.get("shoutbox_height") + "px; } " + 
				"#shout_text { width: " + (isHarmonyCss ? '98.7%' : '100%' ) + "; } " +
				".mod_shoutbox .form { " + (isHarmonyCss ? 'width: 98.7%' : 'height: 32px; padding: 4px 6px 4px 4px;') + " } " : "") +

			"#MAIN {" + (isHarmonyCss ? 'padding: 5px 0 0 0; ' : '') + "} " +
			".mod_shoutbox .form { " + (isHarmonyCss ? 'padding: 0;' : '') + " } " +
			"#mod_shoutbox { " + (optionsDB.get("font") != "Par défaut" ? 'font-family: ' + optionsDB.get("font") + '; ' : '') + "} " +
			".mod_shoutbox .shout_rowalt.highlight_mouseover { background-color: #BFD !important; } " +
			".mod_shoutbox .shout_rowalt.highlight_quote { background-color: #FFA !important; } " +
			".mod_shoutbox .shout_rowalt.highlight_nonread { background-color: #FAC !important; } " +
			".mod_shoutbox .frame { width: auto; height : 100%; } " +
			".mod_shoutbox .frame_list { width: " + userlist_width + "px; overflow-x: hidden; } " +

			"#notification { position: absolute; height: 0px; width: 0px; } " +
			"#user_mod { width: " + userlist_width + "px; float: right; } " +
			"#searchbox { width: 126px; height: 14px } " +
			"#search_result { width: " + userlist_width + "px; overflow: auto; } " +
			"#search_result a { line-height: 20px; padding: 0 10px 0 10px; display: block; } " +
			"#top_userlist { padding: 0 10px 0 10px; } " +
			".user_change_enter { position: relative; left: " + userlist_width + "px; } " +
			".user_change_gone { position: relative; left: 10px; } " +
			"#context_menu { position: absolute; z-index: 9000; border: 1px solid #222; background-color: #CCC; } " +
			"#context_head { font-weight: bold; background-color: #BBB; border-bottom: 1px solid #AAA; padding: 2px; text-align: center; cursor: default; } " +
			".context_option { border-bottom: 1px solid #AAA; padding: 2px; } " +
			".context_option a { cursor: pointer; } " +
			".user_ignored { text-decoration: line-through; } " +
			".user_friend { font-style: italic; } " +
			".user_dot_connected { color: lime; } " +
			".user_dot_disconnected { color: red; } " +
			".selected_option { font-style: italic; } " +
			
			
			"#bbcode_bar { height: 26px; border-top: 1px solid #DDD; line-height: 18px; } " +
			".bbcode_bar { padding: 4px; float: left; } " +
			".bbcode_separator {float: left; background-color: #DDD; padding-top: 26px; padding-left: 1px; margin-right: 4px; margin-left: 4px} " +
			".bbcode_bbcode { cursor: pointer; } " +
			".bbcode_color_newline { clear: both; } " +
			".bbcode_color { float: left; cursor: pointer; padding: 4px; } " +
			".bbcode_smiley { cursor: pointer; } " +
			".bbcode_command { cursor: pointer; border: 1px groove threedface; background-color: #DDD; padding-left: 2px; padding-right: 2px; } " +

			".ftdb_panel { padding: 10px; width: auto; height: auto; position: absolute; display: block; z-index: 9000; top: 200px; left: 200px; background-color: #EEE; color: #111; border-radius: 15px; border: 2px solid #222; } " +

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
			".mp_buttons { text-align: center; margin-top: 12px; } " +
			"#reply_mp_frame { padding-top: 8px; margin-top: 8px; border-top: 1px solid #666} " +
			
			"#options_panel fieldset { border: 2px groove threedface; padding: 6px; } " +
			"#options_panel legend { color: #111; } " +
			"#options_panel a:hover { color: #FFF; } " +
			"</style>");
		$("head").append('<style id="resizableCSS"></style>');
	}

	////////////////////////////////////////////////////////
	// GM_getValue(name, default) / GM_setValue(name, value)
	// GreaseMonkey functs adapt to IE
	////////////////////////////////////////////////////////
	GM_getValue = function (name, defaultValue) {
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
	GM_setValue = function (name, value) {
		value = (typeof value)[0] + value;
		localStorage.setItem(name, value);
	};

	//////////////////
	// IE Refresh Hack
	//////////////////
	$(document).bind("keydown", function(e) {
		if(e.which == 116) {
			e.stopPropagation();
			e.preventDefault();
			window.location = window.location;
		}
	});

	////////////////
	// Options array
	////////////////
	var optionsDB = {
		opt: {
			shoutbox: {defaultVal: true, type: "check", requires: ["#check_shoutbox"], frame: "#option_shoutbox", text: 'Traitement de la shoutbox shoutbox', reqLast: false},
			revertshout: {defaultVal: true, type: "check", requires: ["#check_revertshout", "#check_shoutbox"], frame: "#option_shoutbox", text: 'Inverser shoutbox', reqLast: true},
			hidesmileys: {defaultVal: false, type: "check", requires: ["#check_hidesmileys", "#check_shoutbox"], frame: "#option_shoutbox", text: 'Remplacer les smileys par leur équivalent texte', reqLast: false},
			hideimages: {defaultVal: false, type: "check", requires: ["#check_hideimages", "#check_shoutbox"], frame: "#option_shoutbox", text: 'Remplacer les images par leur lien', reqLast: false},
			hideflash: {defaultVal: true, type: "check", requires: ["#check_hideflash", "#check_shoutbox"], frame: "#option_shoutbox", text: 'Remplacer les embed flash par leur lien', reqLast: false},
			stickyscroll: {defaultVal: true, type: "check", requires: ["#check_stickyscroll", "#check_revertshout", "#check_shoutbox"], frame: "#option_shoutbox", text: 'Scroll statique intelligent', reqLast: false},
			avoidprotocolchange: {defaultVal: true, type: "check", requires: ["#check_avoidprotocolchange", "#check_shoutbox"], frame: "#option_shoutbox", text: 'Eviter les changements http/https des liens', reqLast: false},
			autolinks: {defaultVal: true, type: "check", requires: ["#check_autolinks", "#check_avoidprotocolchange", "#check_shoutbox"], frame: "#option_shoutbox", text: 'Remplacer les liens vers un torrent/topic par leur titre', reqLast: true},
			linknewtab: {defaultVal: false, type: "check", requires: ["#check_linknewtab", "#check_shoutbox"], frame: "#option_shoutbox", text: 'Ouvrir les liens de la shoutbox dans un nouvel onglet', reqLast: false},
			highlightuser:  {defaultVal: false, type: "check", requires: ["#check_highlightuser", "#check_shoutbox"], frame: "#option_shoutbox", text: 'Mettre en surbrillance les posts d\'un utilisateur par passage de souris sur son pseudo', reqLast: false},
			highlightuserfromlist:  {defaultVal: false, type: "check", requires: ["#check_highlightuserfromlist", "#check_highlightuser", "#check_shoutbox"], frame: "#option_shoutbox", text: 'Depuis la liste d\'utilisteurs aussi', reqLast: true},
			highlightquote:  {defaultVal: true, type: "check", requires: ["#check_highlightquote", "#check_shoutbox"], frame: "#option_shoutbox", text: 'Mettre en surbrillance lorsque vous êtes cité', reqLast: false},
			notificationchoice: {defaultVal: "Aucune", type: "select", requires: ["#select_notificationchoice", "#check_highlightquote", "#check_shoutbox"], frame: "#option_shoutbox", text: 'Notification sonore lorsque vous êtes cité', options: soundFileArray, onChangeOpt: function() { playNotification("quote", true, $(this).val()); }, reqLast: true},
			nmessagetitle:  {defaultVal: false, type: "check", requires: ["#check_nmessagetitle", "#check_shoutbox"], frame: "#option_shoutbox", text: 'Indiquer le nombre de non lus de la shoutbox lorsque l\'onglet n\'est pas séléctionné', reqLast: false},
			messages_to_display: {defaultVal: 30, type: "number", requires: ["#txt_messages_to_display", "#check_shoutbox"], minVal: 10, maxVal: 400, frame: "#option_shoutbox", text: 'Nombre max de messages à afficher', reqLast: false},
			fade_in_duration: {defaultVal: 1000, type: "number", requires: ["#txt_fade_in_duration", "#check_shoutbox"], minVal: 0, maxVal: 4000, frame: "#option_shoutbox", text: 'Durée du fade in des nouveaux messages en ms', reqLast: false},

			tabnames: {defaultVal: true, type: "check", requires: ["#check_tabnames"], frame: "#option_input", text: 'Autocomplétion des pseudos', reqLast: false},
			addspaceafterautoc: {defaultVal: true, type: "check", requires: ["#check_addspaceafterautoc", "#check_tabnames"], frame: "#option_input", text: 'Ajouter un espace après l\'autocomplétion', reqLast: true},
			changeautockey: {defaultVal: false, type: "check", requires: ["#check_changeautockey", "#check_tabnames"], frame: "#option_input", text: 'Autocompléter avec → au lieu de Tab', reqLast: true},
			bbcode: {defaultVal: true, type: "check", requires: ["#check_bbcode"], frame: "#option_input", text: 'Barre de boutons de formatage BBcode', reqLast: false},
			usersmiley: {defaultVal: false, type: "check", requires: ["#check_usersmiley", "#check_bbcode"], frame: "#option_input", text: 'Smileys personnalisés', reqLast: true},
			chatcommands: {defaultVal: true, type: "check", requires: ["#check_chatcommands"], frame: "#option_input", text: 'Commandes dans le chat (/mp <user>)', reqLast: false},

			userlist: {defaultVal: true, type: "check", requires: ["#check_userlist"], frame: "#option_userlist", text: 'Annonce des (dé)connexions des utilisateurs &amp; recherche', reqLast: false},
			user_disable_threshold: {defaultVal: 10, type: "number", requires: ["#txt_user_disable_threshold", "#check_userlist"], minVal: 0, maxVal: 100, frame: "#option_userlist", text: 'Nombre de (dé)connexions annoncées', reqLast: false},
			banlist: {defaultVal: false, type: "check", requires: ["#check_banlist", "#check_userlist"], frame: "#option_userlist", text: 'Ajoute un menu contextuel au clic sur les utilisateurs (MP/Amis/Ignorer)', reqLast: false},
			shoutbanlist: {defaultVal: false, type: "check", requires: ["#check_shoutbanlist", "#check_banlist", "#check_userlist", "#check_shoutbox"], frame: "#option_userlist", text: 'Depuis la shoutbox aussi', reqLast: true},
			resetbanlist: {type: "button", requires: ["#check_banlist", "#check_userlist"], frame: "#option_userlist", text: 'Réinitialiser la liste d\'amis/ignorés', confirm: 'Etes-vous sur de supprimer la liste des amis/ignorés ?', funct: function () { userDB.clearUsers(); }, reqLast: false},

			autoresize : {defaultVal: false, type: "check", requires: ["#check_autoresize"], frame: "#option_resize", text: 'Redimensionnement de la shoutbox', reqLast: false},
			shoutbox_height: {defaultVal: 376, type: "number", requires: ["#txt_shoutbox_height", "#check_autoresize"], minVal: 86, maxVal: 10000, frame: "#option_resize", text: 'Hauteur de la shoutbox', reqLast: false},
			resizeclic : {defaultVal: false, type: "check", requires: ["#check_resizeclic", "#check_autoresize"], frame: "#option_resize", text: 'Redimensionnement au clic', reqLast: true},
			irc_height: {defaultVal: 440, type: "number", requires: ["#txt_irc_height", "#check_autoresize"], minVal: 200, maxVal: 10000, frame: "#option_resize", text: 'Hauteur du client IRC Web', reqLast: false},

			javairc: {defaultVal: false, type: "check", requires: ["#check_javairc"], frame: "#option_other", text: 'Ajout d\'un client IRC Web sous la Shoutbox', reqLast: false},
			hidegrades: {defaultVal: true, type: "check", requires: ["#check_hidegrades"], frame: "#option_other", text: 'Cacher la barre d\'info grades', reqLast: false},
			blinkmp: {defaultVal: true, type: "check", requires: ["#check_blinkmp"], frame: "#option_other", text: 'Faire clignoter &amp; annoncer l\'arrivée de nouveaux MPs', reqLast: false},
			soundmpchoice: {defaultVal: "Aucune", type: "select", requires: ["#select_soundmpchoice", "#check_blinkmp"], frame: "#option_other", text: 'Notification sonore à la réception de MPs', options: soundFileArray, onChangeOpt: function() { playNotification("mp", true, $(this).val()); }, reqLast: true},
			inshoutmp: {defaultVal: true, type: "check", requires: ["#check_inshoutmp", "#check_blinkmp"], frame: "#option_other", text: 'Lire/Répondre/Créer des MP depuis la shoutbox', reqLast: true},
			font: {defaultVal: "Par défaut", type: "select", requires: ["#select_font"], frame: "#option_other", text: 'Police', options: ["Par défaut", "Arial", "Comic Sans MS", "Times New Roman"], reqLast: false},
			statistics: {defaultVal: true, type: "check", requires: ["#check_statistics"], frame: "#option_other", text: 'Autoriser l\'envoi de statistiques anonymes', reqLast: false},
		},

		set: function (k, v) {
			this.opt[k].val = v;
			GM_setValue(k, v);
		},
		get: function (k) {
			if(this.opt[k].val == undefined) {
				this.opt[k].val = GM_getValue(k);
				if(this.opt[k].val == undefined) {
					this.opt[k].val = this[k].defaultVal;
				}
				this.opt[k].val = (this.opt[k].type == "number" ? Number(this.opt[k].val) : this.opt[k].val);
			}
			return this.opt[k].val;
		},
		clearAll: function() {
			$.each(optionsDB.opt, function (k, v) {
				if(v.type != "button") {
					GM_setValue(k, v.defaultVal);
				}
			});
		}
	};

	////////////
	// User data
	////////////
	var userData = {
		data: {
			smiley: {}
		},

		set: function(s, k, v) {
			this.data[s][k] = v;
			GM_setValue("data_" + s, JSON.stringify(this.data[s]));
		},
		get: function(s, k) {
			return this.data[s][k];
		},
		unset: function(s, k) {
			if(this.data[s][k] != undefined) {
				delete this.data[s][k];
				GM_setValue("data_" + s, JSON.stringify(this.data[s]));
			}
		},
		getAll: function(s) {
			return this.data[s];
		},
		clearData: function(s) {
			this.data[s] = {};
			GM_setValue("data_" + s, JSON.stringify(this.data[s]));
		},
		loadData: function() {
			var thisData = this;
			$.each(this.data, function(k, v) {
				var dataGM = GM_getValue("data_" + k);
				if(dataGM != undefined) {
					thisData.data[k] = JSON.parse(dataGM);
				}
			});
		}
	};

	//////////
	// user DB
	//////////
	var userDB = {
		users: {},

		setIgnore: function (secureName, userName, classId, url) {
			if(!this.users[secureName]) {
				this.users[secureName] = {};
			}
			this.users[secureName].ignore = true;
			this.users[secureName].userName = userName;
			this.users[secureName].classId = classId;
			this.users[secureName].url = url;
			GM_setValue("users", JSON.stringify(this.users));
		},
		isIgnored: function (secureName) {
			if(this.users[secureName] && this.users[secureName].ignore) {
				return true;
			}
			return false;
		},
		removeIgnore: function (secureName) {
			if(this.users[secureName]) {
				this.users[secureName].ignore = false;
				GM_setValue("users", JSON.stringify(this.users));
			}
		},

		setFriend: function (secureName, userName, classId, url) {
			if(!this.users[secureName]) {
				this.users[secureName] = {};
			}
			this.users[secureName].friend = true;
			this.users[secureName].userName = userName;
			this.users[secureName].classId = classId;
			this.users[secureName].url = url;
			GM_setValue("users", JSON.stringify(this.users));
		},
		isFriend: function (secureName) {
			if(this.users[secureName] && this.users[secureName].friend) {
				return true;
			}
			return false;
		},
		removeFriend: function (secureName) {
			if(this.users[secureName]) {
				this.users[secureName].friend = false;
				GM_setValue("users", JSON.stringify(this.users));
			}
		},

		updateUserClass: function (secureName, classId) {
			if(!this.users[secureName]) {
				return;
			}
			this.users[secureName].classId = classId;
			GM_setValue("users", JSON.stringify(this.users));
		},

		clearUsers: function () {
			this.users =  {};
			GM_setValue("users", JSON.stringify(this.users));
		},
		loadUsers: function () {
			var usersGM = GM_getValue("users");
			if(usersGM != undefined) {
				this.users = JSON.parse(usersGM);
			}
		}
	};


	userDB.loadUsers();
	dbg("Starting");
	initCSS();
	if(optionsDB.get("bbcode")) {
		addBBcodeBar();
	}
	if(optionsDB.get("autoresize")){
		setResizer();
	}
	if(optionsDB.get("highlightquote")) {
		setQuoteHighlighter();
	}
	if(optionsDB.get("shoutbox")) {
		prepareShoutbox();
	}
	if(optionsDB.get("userlist")) {
		prepareUserList();
	}
	resizeShoutbox();
	if(optionsDB.get("stickyscroll")) {
		$("#SHOUT_MESSAGE").bind("scroll", shoutBox_OnScroll);
	}
	if(optionsDB.get("tabnames")) {
		$('#shout_text').bind("keyup", shoutBoxText_OnKeyUp);
	}
	if(optionsDB.get("usersmiley") || optionsDB.get("tabnames")) {
		$('#shout_text').bind("keydown", shoutBoxText_OnKeyDown);
	}
	if(optionsDB.get("changeautockey")) {
		autocompleteKey = 39;
	}
	if(optionsDB.get("javairc")) {
		showIRCFrame();
	}
	if(optionsDB.get("hidegrades")) {
		hideGrades();
	}
	if(optionsDB.get("statistics")) {
		sendStatistics();
	}
	if(optionsDB.get("blinkmp")) {
		blinkIncommingMP();
	}
	setWindowFocusTracker();
	optionsPanelCreator();
	$("#shout_text").trigger("click"); // Remove "Ecrire un message"
	dbg("Loading took " + (new Date().getTime() - d) + "ms");
});
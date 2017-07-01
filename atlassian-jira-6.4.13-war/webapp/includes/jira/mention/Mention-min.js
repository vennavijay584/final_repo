define("jira/mention/mention",["jira/ajs/control","jira/dialog/dialog","jira/mention/mention-user","jira/mention/mention-group","jira/mention/mention-matcher","jira/mention/scroll-pusher","jira/mention/uncomplicated-inline-layer","jira/ajs/layer/inline-layer/standard-positioning","jira/ajs/dropdown/dropdown-list-item","jira/util/events","jira/util/navigator","aui/progressive-data-set","jquery","underscore"],function(Control,Dialog,UserModel,MentionGroup,MentionMatcher,ScrollPusher,UncomplicatedInlineLayer,InlineLayerStandardPositioning,DropdownListItem,Events,Navigator,ProgressiveDataSet,jQuery,_){return Control.extend({CLASS_SIGNATURE:"AJS_MENTION",lastInvalidUsername:"",lastRequestMatch:true,lastValidUsername:"",init:function(){var instance=this;this.listController=new MentionGroup();this.dataSource=new ProgressiveDataSet([],{model:UserModel,queryEndpoint:contextPath+"/rest/api/2/user/viewissue/search",queryParamKey:"username",queryData:_.bind(this._getQueryParams,this)});this.dataSource.matcher=function(model,query){var matches=false;matches=matches||instance._stringPartStartsWith(model.get("name"),query);matches=matches||instance._stringPartStartsWith(model.get("displayName"),query);return matches};this.dataSource.bind("respond",function(response){var results=response.results;var username=response.query;if(!username){return }if(!results.length){if(username){if(instance.dataSource.hasQueryCache(username)){if(!instance.lastInvalidUsername||username.length<=instance.lastInvalidUsername.length){instance.lastInvalidUsername=username}}}instance.lastRequestMatch=false}else{instance.lastInvalidUsername="";instance.lastValidUsername=username;instance.lastRequestMatch=true}var $suggestions=instance.generateSuggestions(results,username);instance.updateSuggestions($suggestions)});this.dataSource.bind("activity",function(response){if(response.activity){instance.layerController._showLoading()}else{instance.layerController._hideLoading()}})},updateSuggestions:function($suggestions){if(this.layerController){this.layerController.content($suggestions);this.layerController.show();this.layerController.refreshContent()}},_getQueryParams:function(){return this.restParams},_setQueryParams:function(){var params={issueKey:this.$textarea.attr("data-issuekey"),projectKey:this.$textarea.attr("data-projectkey"),maxResults:10};if(Dialog.current&&Dialog.current.options.id==="create-issue-dialog"){delete params.issueKey}this.restParams=params},_composeCustomEventForFollowScroll:function(customEvents){customEvents=customEvents||{};var followScroll=this.$textarea.attr("follow-scroll");if(followScroll&&followScroll.length){customEvents[followScroll]={"scroll":function(){this.setPosition()}}}return customEvents},textarea:function(textarea){var instance=this;if(textarea){this.$textarea=jQuery(textarea);jQuery("#mentionDropDown").remove();if(this.$textarea.attr("push-scroll")){var positioningController=new InlineLayerStandardPositioning();var scrollPusher=ScrollPusher(this.$textarea,10)}this.layerController=new UncomplicatedInlineLayer({offsetTarget:this.textarea(),allowDownsize:true,positioningController:positioningController,customEvents:this._composeCustomEventForFollowScroll(),width:function(){return instance.$textarea.width()}});this.layerController.bind("showLayer",function(){instance.listController.trigger("focus");instance._assignEvents("win",window)}).bind("hideLayer",function(){instance.listController.trigger("blur");instance._unassignEvents("win",window);if(scrollPusher){scrollPusher.reset()}}).bind("contentChanged",function(){if(!instance.layerController.$content){return }instance.listController.removeAllItems();instance.layerController.$content.find("li").each(function(){var li=jQuery(this);li.click(function(event){instance._acceptSuggestion(li);event.preventDefault()});instance.listController.addItem(new DropdownListItem({element:li,autoScroll:true}))});instance.listController.prepareForInput();instance.listController.shiftFocus(0)}).bind("setLayerPosition",function(event,positioning,inlineLayer){if(Dialog.current&&Dialog.current.$form){var buttonRow=Dialog.current.$popup.find(".buttons-container:visible");if(buttonRow.length&&positioning.top>buttonRow.offset().top){positioning.top=buttonRow.offset().top}}if(scrollPusher){scrollPusher.push(positioning.top+inlineLayer.layer().outerHeight(true))}});this.layerController.layer().attr("id","mentionDropDown");this._assignEvents("inlineLayer",instance.layerController.layer());this._assignEvents("textarea",instance.$textarea);this._setQueryParams()}else{return this.$textarea}},generateSuggestions:function(data,username){var regex=new RegExp("(^|.*?(\\s+|\\())("+RegExp.escape(username)+")(.*)","i");function highlight(text){var result={text:text};if(text&&text.length&&text.toLowerCase().indexOf(username.toLowerCase())>-1){text.replace(regex,function(_,prefix,spaceOrParenthesis,match,suffix){result={prefix:prefix,match:match,suffix:suffix}})}return result}var filteredData=_.map(data,function(model){var user=model.toJSON();user.username=user.name;user.emailAddress=highlight(user.emailAddress);user.displayName=highlight(user.displayName);user.name=highlight(user.name);return user});return jQuery(JIRA.Templates.mentionsSuggestions({suggestions:filteredData,query:username,activity:(this.dataSource.activeQueryCount>0)}))},_acceptSuggestion:function(li){this._hide();this._replaceCurrentUserName(li.find("a").attr("rel"));this.listController.removeAllItems()},_replaceCurrentUserName:function(selectedUserName){var raw=this._rawInputValue(),caretPos=this._getCaretPosition(),beforeCaret=raw.substr(0,caretPos),wordStartIndex=MentionMatcher.getLastWordBoundaryIndex(beforeCaret,true);var before=raw.substr(0,wordStartIndex+1).replace(/\r\n/g,"\n");var username="[~"+selectedUserName+"]";var after=raw.substr(caretPos);this._rawInputValue([before,username,after].join(""));this._setCursorPosition(before.length+username.length)},_setCursorPosition:function(index){var input=this.$textarea.get(0);if(input.setSelectionRange){input.focus();input.setSelectionRange(index,index)}else{if(input.createTextRange){var range=input.createTextRange();range.collapse(true);range.moveEnd("character",index);range.moveStart("character",index);range.select()}}},_getCaretPosition:function(){var element=this.$textarea.get(0);var rawElementValue=this._rawInputValue();var caretPosition,range,offset,normalizedElementValue,elementRange;if(typeof element.selectionStart==="number"){return element.selectionStart}if(document.selection&&element.createTextRange){range=document.selection.createRange();if(range){elementRange=element.createTextRange();elementRange.moveToBookmark(range.getBookmark());if(elementRange.compareEndPoints("StartToEnd",element.createTextRange())>=0){return rawElementValue.length}else{normalizedElementValue=rawElementValue.replace(/\r\n/g,"\n");offset=elementRange.moveStart("character",-rawElementValue.length);caretPosition=normalizedElementValue.slice(0,-offset).split("\n").length-1;return caretPosition-offset}}else{return rawElementValue.length}}return 0},_rawInputValue:function(){var el=this.$textarea.get(0);if(typeof arguments[0]=="string"){el.value=arguments[0]}return el.value},fetchUserNames:function(username){this.dataSource.query(username)},_getCurrentUserName:function(){return this.currentUserName},_hide:function(){this.layerController.hide()},_show:function(){this.layerController.show()},_keyUp:function(){var caret=this._getCaretPosition();var username=this._getUserNameFromInput(caret);username=jQuery.trim(username||"");if(this._isNewRequestRequired(username)){this.fetchUserNames(username)}else{if(!this._keepSuggestWindowOpen(username)){this._hide()}}this.lastQuery=username;delete this.willCheck},_keepSuggestWindowOpen:function(username){if(!username){return false}if(this.layerController.isVisible()){return this.dataSource.activeQueryCount||this.lastRequestMatch}return false},_isNewRequestRequired:function(username){if(!username){return false}username=jQuery.trim(username);if(username===this.lastQuery){return false}else{if(this.lastInvalidUsername){if(username.indexOf(this.lastInvalidUsername)===0&&(this.lastInvalidUsername.length<username.length)){return false}}else{if(!this.lastRequestMatch&&username===this.lastValidUsername){return true}}}return true},_stringPartStartsWith:function(text,startsWith){text=jQuery.trim(text||"").toLowerCase();startsWith=(startsWith||"").toLowerCase();var nameParts=text.split(/\s+/);if(!text||!startsWith){return false}if(text.indexOf(startsWith)===0){return true}return _.any(nameParts,function(word){return word.indexOf(startsWith)===0})},_getUserNameFromInput:function(caret){if(typeof caret!="number"){caret=this._getCaretPosition()}return this.currentUserName=MentionMatcher.getUserNameFromCurrentWord(this._rawInputValue(),caret)},_events:{win:{resize:function(){this.layerController.setWidth(this.$textarea.width())}},textarea:{"keydown":function(e){if(e.keyCode===jQuery.ui.keyCode.ESCAPE){if(this.layerController.isVisible()){if(Dialog.current){Events.one("Dialog.beforeHide",function(e){e.preventDefault()})}this.$textarea.one("keyup",function(keyUpEvent){if(keyUpEvent.keyCode===jQuery.ui.keyCode.ESCAPE){keyUpEvent.stopPropagation();Events.trigger("Mention.afterHide")}})}if(Navigator.isIE()&&Navigator.majorVersion()<11){e.preventDefault()}}else{if(!this.willCheck){this.willCheck=_.defer(_.bind(this._keyUp,this))}}},"focus":function(){this._keyUp()},"mouseup":function(){this._keyUp()},"blur":function(){this.listController.removeAllItems();this.lastQuery=this.lastValidUsername=this.lastInvalidUsername=""}},inlineLayer:{mousedown:function(e){e.preventDefault()}}}})});define("jira/mention/mention-user",["backbone"],function(Backbone){return Backbone.Model.extend({idAttribute:"name"})});define("jira/mention/mention-matcher",["jquery"],function(jQuery){return{AT_USERNAME_START_REGEX:/^@(.*)/i,AT_USERNAME_REGEX:/[^\[]@(.*)/i,WIKI_MARKUP_REGEX:/\[[~@]+([^~@]*)/i,ACCEPTED_USER_REGEX:/\[~[^~\]]*\]/i,WORD_LIMIT:3,getUserNameFromCurrentWord:function(text,caretPosition){var before=text.substr(0,caretPosition);var lastWordStartIndex=this.getLastWordBoundaryIndex(before,false);var prevChar=before.charAt(lastWordStartIndex-1);var currentWord;var foundMatch=null;if(!prevChar||!/\w/i.test(prevChar)){currentWord=this._removeAcceptedUsernames(before.substr(lastWordStartIndex));if(/[\r\n]/.test(currentWord)){return null}jQuery.each([this.AT_USERNAME_START_REGEX,this.AT_USERNAME_REGEX,this.WIKI_MARKUP_REGEX],function(i,regex){var match=regex.exec(currentWord);if(match){foundMatch=match[1];return false}})}return(foundMatch!=null&&this.lengthWithinLimit(foundMatch,this.WORD_LIMIT))?foundMatch:null},lengthWithinLimit:function(input,length){var parts=jQuery.trim(input).split(/\s+/);return parts.length<=~~length},getLastWordBoundaryIndex:function(text,strip){var lastAt=text.lastIndexOf("@"),lastWiki=text.lastIndexOf("[~");if(strip){lastAt=lastAt-1;lastWiki=lastWiki-1}return(lastAt>lastWiki)?lastAt:lastWiki},_removeAcceptedUsernames:function(phrase){var match=this.ACCEPTED_USER_REGEX.exec(phrase);if(match){return phrase.split(match)[1]}else{return phrase}}}});define("jira/mention/scroll-pusher",["jquery"],function(jQuery){return function($el,defaultMargin){defaultMargin=defaultMargin||0;var $scroll=jQuery($el.attr("push-scroll")),originalScrollHeight;function push(layerBottom,margin){if(typeof margin=="undefined"){margin=defaultMargin}var scrollBottom=$scroll.offset().top+$scroll.outerHeight();var overflow=layerBottom-scrollBottom;if(overflow+margin>0){if(!originalScrollHeight){originalScrollHeight=$scroll.height()}$scroll.height($scroll.height()+overflow+margin)}}function reset(){if(originalScrollHeight){$scroll.height(originalScrollHeight)}}return{push:push,reset:reset}}});AJS.namespace("JIRA.MentionUserModel",null,require("jira/mention/mention-user"));AJS.namespace("JIRA.Mention",null,require("jira/mention/mention"));AJS.namespace("JIRA.Mention.Matcher",null,require("jira/mention/mention-matcher"));AJS.namespace("JIRA.Mention.ScrollPusher",null,require("jira/mention/scroll-pusher"));
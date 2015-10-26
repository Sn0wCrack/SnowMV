//=============================================================================
// SnowMV - Quest Journal
// SnowQuest.js
// Version: 1.0.0
//=============================================================================

"use strict";

PluginManager.register("SnowQuest", "1.0.0", {
	"email": "",
	"website": "",
	"name": "Sn0wCrack"
}, "2015-10-26")

//=============================================================================
 /*:
 * @plugindesc A quest journal system
 * @author Sn0wCrack
 *
 * @param Menu Title
 * @desc Text to display for the menu command
 * @default Quest Journal
 *
 * @param Complete Quests Icon
 * @desc ID of icon to display for completed quests
 * @deafult 1
 *
 * @param All Quests Icon
 * @desc ID of icon to display for all quests
 * @default 2
 *
 * @param Incomplete Quests Icon
 * @desc
 * @default 3
 *
 * @help
 * ============================================================================
 * Introduction
 * ============================================================================
 *
 * Please see https://github.com/Sn0wCrack/SnowMV/blob/master/LICENSE for license
 * details.
 *
 * If you use this script, please give credit!
 *
 * ============================================================================
 * Setup
 * ============================================================================
 *
 * Place Quests.json in the data folder of your project.
 *
 * ============================================================================
 * Usage
 * ============================================================================
 *
 *
 *
 */
//=============================================================================
var Snow = Snow || {};
Snow.Quest = Snow.Quest || {};
Snow.Quest.Scenes = Snow.Quest.Scenes || {};
Snow.Quest.Windows = Snow.Quest.Windows || {};
Snow.Quest.Parameters = PluginManager.parameters("SnowQuest");

Snow.Quest.QuestData = JSON.parse(MVC.ajaxLoadFile("data/Quests.json", "application/json"));
Snow.Quest.PlayerQuestData = Snow.Quest.QuestData;

//==============================================================================
// Quest Functions
//==============================================================================

Snow.Quest.RefreshQuests = function() {
	console.warn("This may take a long time!");
	for (var i = 0; i < Snow.Quest.PlayerQuestData.length; i++) {
		var objectivesComplete = 0;
		for (var j = 0; i < Snow.Quest.PlayerQuestData[i].objectives.length; j++) {
			if (Snow.Quest.PlayerQuestData[i].objectives[j].status == 2) {
				objectivesComplete++;
			}
		}
		if (Snow.Quest.PlayerQuestData[i].objectives.length == objectivesComplete) {
			Snow.Quest.QuestUpdate(i, true);
		}
	}
}

Snow.Quest.QuestUpdate = function(questId, status) {
	Snow.Quest.PlayerQuestData[questId].status = status;
}

Snow.Quest.QuestObjectiveUpdate = function(questId, questObjective, status) {
	Snow.Quest.PlayerQuestData[questId].objectives[questObjective].status = status;
}

//==============================================================================
// Windows
//==============================================================================

// Quest Information Window

var QuestInformation = function() {
	this.initialize.apply(this, arguments);

}

QuestInformation.prototype = Object.create(Window_Base.prototype);
QuestInformation.prototype.constructor = QuestInformation;

QuestInformation.prototype.initialize = function(wx, wy, wh, ww) {
	Window_Base.prototype.initialize.call(this, wx, wy, ww, wh);
	this._handlers = [];
	this.deactivate();
}

QuestInformation.prototype.refresh = function() {
	this.contents.clear();
}

QuestInformation.prototype.update = function() {
    Window_Base.prototype.update.call(this);
    this.processHandling();
}

QuestInformation.prototype.isOpenAndActive = function() {
    return this.isOpen() && this.active;
}

QuestInformation.prototype.processHandling = function() {
    if (this.isOpenAndActive()) {
        if (this.isCancelEnabled() && this.isCancelTriggered()) {
            this.processCancel();
        }
    }
}

QuestInformation.prototype.setHandler = function(symbol, method) {
	this._handlers[symbol] = method;
}

QuestInformation.prototype.isHandled = function(symbol) {
    return !!this._handlers[symbol];
}

QuestInformation.prototype.isCancelEnabled = function() {
    return this.isHandled('cancel');
}

QuestInformation.prototype.isCancelTriggered = function() {
    return Input.isRepeated('cancel');
}

QuestInformation.prototype.callHandler = function(symbol) {
    if (this.isHandled(symbol)) {
        this._handlers[symbol]();
    }
}

QuestInformation.prototype.processCancel = function() {
    SoundManager.playCancel();
    this.deactivate();
    this.callCancelHandler();
};

QuestInformation.prototype.callCancelHandler = function() {
    this.callHandler('cancel');
};


Snow.Quest.Windows.QuestInformation = QuestInformation;

// Quest List Window

var QuestList = function() {
	this.initialize.apply(this, arguments);
}

QuestList.prototype = Object.create(Window_Command.prototype);
QuestList.prototype.constructor = QuestList;

QuestList.prototype.initialize = function(wx, wy) {
        Window_Command.prototype.initialize.call(this, wx, wy);
		this.deactivate();
		this.deselect();
}

QuestList.prototype.windowWidth = function() {
	return 245;
}

QuestList.prototype.windowHeight = function() {
	return Graphics.boxHeight - 100;
}

QuestList.prototype._addQuestsAll = function() {
	for (var i = 0; i < Snow.Quest.PlayerQuestData.length; i++) {
		this.addCommand(Snow.Quest.PlayerQuestData[i].name, "quest" + i);
	}
}

QuestList.prototype._addQuestsComplete = function() {
	for (var i = 0; i < Snow.Quest.PlayerQuestData.length; i++) {
		if (Snow.Quest.PlayerQuestData[i].status) {
			this.addCommand(Snow.Quest.PlayerQuestData[i].name, "quest" + i);
		}
	}
}

QuestList.prototype._addQuestsIncomplete = function() {
	for (var i = 0; i < Snow.Quest.PlayerQuestData.length; i++) {
		if (!Snow.Quest.PlayerQuestData[i].status) {
			this.addCommand(Snow.Quest.PlayerQuestData[i].name, "quest" + i);
		}
	}
}

Snow.Quest.Windows.QuestList = QuestList;

// Quest Type Choice

var QuestTypeChoice = function() {
	this.initialize.apply(this, arguments);
}

QuestTypeChoice.prototype = Object.create(Window_Selectable.prototype);
QuestTypeChoice.prototype.constructor = QuestTypeChoice;

QuestTypeChoice.prototype.initialize = function(wx, wy, ww, wh) {
	Window_Selectable.prototype.initialize.call(this, wx, wy, ww, wh);
	this._index = 0;
	this.activate();
	this.refresh();
}

QuestTypeChoice.prototype.refresh = function() {
	this.makeItemList();
    this.createContents();
    this.drawAllItems();
}

QuestTypeChoice.prototype.makeItemList = function() {
	this._data = ["All Quests", "Incomplete Quests", "Complete Quests"];
}

QuestTypeChoice.prototype.isCurrentItemEnabled = function() {
	return true;
}

QuestTypeChoice.prototype.isEnabled = function(index) {
	return true;
}

QuestTypeChoice.prototype.maxItems = function() {
	return this._data ? this._data.length : 1;
}

QuestTypeChoice.prototype.drawItem = function(index) {
	var type = this._data[index],
		rect = this.itemRect(index);
		
	if (type === "All Quests") {
		this.drawText(type, rect.x + 35, rect.y, rect.width, 'left'); 
		this.drawIcon(Number(Snow.Quest.Parameters["All Quests Icon"]), rect.x, rect.y + 2);
	}
	
	if (type === "Incomplete Quests") {
		this.drawText(type, rect.x + 35, rect.y, rect.width, 'left'); 
		this.drawIcon(Number(Snow.Quest.Parameters["Incomplete Quests Icon"]), rect.x, rect.y + 2);
	}
	
	if (type === "Complete Quests") {
		this.drawText(type, rect.x + 35, rect.y, rect.width, 'left'); 
		this.drawIcon(Number(Snow.Quest.Parameters["Complete Quests Icon"]), rect.x, rect.y + 2);
	}
}

Snow.Quest.Windows.QuestTypeChoice = QuestTypeChoice;

//==============================================================================
// Scenes
//==============================================================================

var Journal = function() {
	this.initialize.apply(this, arguments);
}

Journal.prototype = Object.create(Scene_MenuBase.prototype);
Journal.prototype.constructor = Journal;

Journal.prototype.initialize = function() {
	Scene_MenuBase.prototype.initialize.call(this);
}

Journal.prototype.create = function() {
	Scene_MenuBase.prototype.create.call(this);
	this._createQuestListTypeChoiceWindow();
	this._createQuestListCommandWindow();
	this._createQuestInformationWindow();
}

Journal.prototype.start = function() {
	 Scene_MenuBase.prototype.start.call(this);
}

Journal.prototype._createQuestListTypeChoiceWindow = function() {
	var wx = 0,
		wy = 0,
		ww = 245,
		wh = 100;
	this._questTypeChoiceWindow = new Snow.Quest.Windows.QuestTypeChoice(wx, wy, ww, wh);
	this._questTypeChoiceWindow.setHandler('ok', this._onQuestListTypeChoiceOK.bind(this));
	this._questTypeChoiceWindow.setHandler('cancel', this._onQuestListTypeChoiceCancel.bind(this))
	this.addWindow(this._questTypeChoiceWindow);
}

Journal.prototype._createQuestListCommandWindow = function() {
	var wx = 0,
		wy = 100;
	this._questListCommandWindow = new Snow.Quest.Windows.QuestList(wx, wy);
	this._questListCommandWindow.setHandler('ok', this._onQuestListOK.bind(this));
	this._questListCommandWindow.setHandler('cancel', this._onQuestListCancel.bind(this));
	this.addWindow(this._questListCommandWindow);
}

Journal.prototype._createQuestInformationWindow = function() {
	var wx = this._questListCommandWindow.windowWidth(),
		wy = 0,
		wh = Graphics.boxHeight,
		ww = Graphics.boxWidth - this._questListCommandWindow.windowWidth();
	this._questInformationWindow = new Snow.Quest.Windows.QuestInformation(wx, wy, wh, ww);
	this._questInformationWindow.setHandler('cancel', this._onQuestInformationCancel.bind(this));
    this.addWindow(this._questInformationWindow);
}

Journal.prototype._onQuestListOK = function() {
	var questId = Number(this._questListCommandWindow.currentSymbol().replace("quest", ""));
	this._questInformationWindow.drawText(Snow.Quest.PlayerQuestData[questId].name, 0, 0, this._questInformationWindow.contentsWidth(), 'left');
	this._questInformationWindow.activate();
}

Journal.prototype._onQuestListCancel = function() {
	this._questTypeChoiceWindow.activate();
	this._questListCommandWindow.clearCommandList();
	this._questListCommandWindow.deselect();
}

Journal.prototype._onQuestInformationCancel = function() {
	this._questInformationWindow.refresh();
	this._questListCommandWindow.activate();
}

Journal.prototype._onQuestListTypeChoiceOK = function() {
	var index = this._questTypeChoiceWindow._index;
	this._questListCommandWindow.clearCommandList();
	switch(this._questTypeChoiceWindow._data[index]) {
		case "All Quests":
			this._questListCommandWindow._addQuestsAll();
			break;
		case "Complete Quests":
			this._questListCommandWindow._addQuestsComplete();
			break;
		case "Incomplete Quests":
			this._questListCommandWindow._addQuestsIncomplete();
			break;
		default:
			break;
	}
	if (this._questListCommandWindow.maxItems() > 0) {
		for (var i = 0; i < this._questListCommandWindow.maxItems(); i++) {
			this._questListCommandWindow.drawItem(i);
		}
		this._questListCommandWindow.activate();
		this._questListCommandWindow.select(0);
	} else {
		SoundManager.playBuzzer();
		this._questTypeChoiceWindow.activate();
	}
}

Journal.prototype._onQuestListTypeChoiceCancel = function() {
	this.popScene();
}

Snow.Quest.Scenes.Journal = Journal;

//==============================================================================
// Menu Override
//==============================================================================

// Use Yanfly's Main Menu Manager

//==============================================================================
// Plugin Commands
//==============================================================================

Snow.Quest.Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
	Snow.Gather.Game_Interpreter_pluginCommand.call(this, command, args);
	if (command === "SnowQuestObjectiveUpdate") {
		Snow.Quest.QuestObjectiveUpdate(Number(args[0]), Number(args[1]), Number(args[2]));
	}
	if (command === "SnowQuestUpdate") {
		Snow.Quest.QuestUpdate(Number(args[0]), MVC.Boolean(args[1]));
	}
	if (command === "SnowQuestRefresh") {
		Snow.Quest.RefreshQuests();
	}
	if (command === "SnowQuestJournal") {
		SceneManager.push(Snow.Quest.Scenes.Journal);
	}
}